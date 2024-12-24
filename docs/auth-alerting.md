# Authentication Alerting Configuration

This guide covers setting up comprehensive alerting for the authentication system.

## Alert Definitions

### 1. Critical Alerts

```yaml
# prometheus/rules/auth-critical.yml
groups:
  - name: auth_critical
    rules:
      - alert: AuthSystemDown
        expr: |
          sum(up{job="auth-service"}) == 0
        for: 1m
        labels:
          severity: critical
          team: auth
        annotations:
          summary: "Authentication system is down"
          description: "No auth service instances are running"
          runbook_url: "https://wiki.applymate.app/runbooks/auth-system-down"

      - alert: HighAuthFailureRate
        expr: |
          (
            sum(rate(auth_login_failure_total[5m]))
            /
            sum(rate(auth_login_total[5m]))
          ) > 0.1
        for: 5m
        labels:
          severity: critical
          team: auth
        annotations:
          summary: "High authentication failure rate"
          description: "Auth failure rate is above 10% for 5 minutes"
          value: "{{ $value | humanizePercentage }}"
          
      - alert: AuthDatabaseConnectionLost
        expr: |
          auth_database_connection_status == 0
        for: 1m
        labels:
          severity: critical
          team: auth
        annotations:
          summary: "Lost connection to auth database"
          description: "Cannot connect to authentication database"
```

### 2. Warning Alerts

```yaml
# prometheus/rules/auth-warnings.yml
groups:
  - name: auth_warnings
    rules:
      - alert: ElevatedAuthLatency
        expr: |
          histogram_quantile(0.95, 
            sum(rate(auth_request_duration_seconds_bucket[5m])) 
            by (le)
          ) > 0.5
        for: 5m
        labels:
          severity: warning
          team: auth
        annotations:
          summary: "Elevated authentication latency"
          description: "95th percentile latency is above 500ms"
          value: "{{ $value | humanizeDuration }}"

      - alert: IncreasedErrorRate
        expr: |
          sum(rate(auth_errors_total[5m])) 
          > 
          sum(rate(auth_errors_total[60m] offset 1h)) * 2
        for: 15m
        labels:
          severity: warning
          team: auth
        annotations:
          summary: "Increased error rate"
          description: "Error rate has doubled compared to 1h ago"
```

## Alert Routing

### 1. Alertmanager Configuration

```yaml
# alertmanager/config.yml
global:
  resolve_timeout: 5m
  slack_api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
  opsgenie_api_url: 'https://api.opsgenie.com/v2/alerts'
  
route:
  receiver: 'default'
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
      group_wait: 0s
      repeat_interval: 1h
      
    - match:
        severity: warning
      receiver: 'slack-warnings'
      group_wait: 1m
      repeat_interval: 2h

receivers:
  - name: 'default'
    slack_configs:
      - channel: '#auth-alerts'
        title: '{{ template "slack.title" . }}'
        text: '{{ template "slack.text" . }}'
        
  - name: 'pagerduty-critical'
    pagerduty_configs:
      - routing_key: YOUR_PAGERDUTY_KEY
        description: '{{ template "pagerduty.description" . }}'
        severity: critical
        class: auth
        
  - name: 'slack-warnings'
    slack_configs:
      - channel: '#auth-warnings'
        title: '{{ template "slack.title" . }}'
        text: '{{ template "slack.text" . }}'
```

### 2. Alert Templates

```yaml
# alertmanager/templates/auth.tmpl
{{ define "slack.title" }}
[{{ .Status | toUpper }}{{ if eq .Status "firing" }}:{{ .Alerts.Firing | len }}{{ end }}] {{ .CommonLabels.alertname }}
{{ end }}

{{ define "slack.text" }}
{{ range .Alerts }}
*Alert:* {{ .Labels.alertname }}
*Description:* {{ .Annotations.description }}
*Severity:* {{ .Labels.severity }}
*Value:* {{ .Annotations.value }}
*Started:* {{ .StartsAt | since }}
{{ if .Annotations.runbook_url }}*Runbook:* {{ .Annotations.runbook_url }}{{ end }}
{{ end }}
{{ end }}

{{ define "pagerduty.description" }}
[{{ .Status | toUpper }}] {{ .CommonLabels.alertname }}
{{ range .Alerts }}
Description: {{ .Annotations.description }}
Severity: {{ .Labels.severity }}
Value: {{ .Annotations.value }}
{{ end }}
{{ end }}
```

## Integration Setup

### 1. PagerDuty Integration

```typescript
// src/lib/alerting/pagerduty.ts
interface PagerDutyConfig {
  routingKey: string;
  serviceId: string;
  urgency: 'high' | 'low';
}

async function createPagerDutyIncident(
  alert: Alert,
  config: PagerDutyConfig
) {
  const response = await fetch('https://api.pagerduty.com/incidents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token token=${config.routingKey}`,
      'Accept': 'application/vnd.pagerduty+json;version=2'
    },
    body: JSON.stringify({
      incident: {
        type: 'incident',
        title: alert.summary,
        service: {
          id: config.serviceId,
          type: 'service_reference'
        },
        urgency: config.urgency,
        body: {
          type: 'incident_body',
          details: alert.description
        }
      }
    })
  });
  
  return response.json();
}
```

### 2. Slack Integration

```typescript
// src/lib/alerting/slack.ts
interface SlackConfig {
  webhookUrl: string;
  channel: string;
  username: string;
}

async function sendSlackAlert(
  alert: Alert,
  config: SlackConfig
) {
  const response = await fetch(config.webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      channel: config.channel,
      username: config.username,
      attachments: [{
        color: getAlertColor(alert.severity),
        title: alert.summary,
        text: alert.description,
        fields: [
          {
            title: 'Severity',
            value: alert.severity,
            short: true
          },
          {
            title: 'Status',
            value: alert.status,
            short: true
          }
        ],
        footer: `Alert ID: ${alert.id}`,
        ts: Math.floor(Date.now() / 1000)
      }]
    })
  });
  
  return response.ok;
}
```

## Alert Management

### 1. Alert Aggregation

```typescript
// src/lib/alerting/aggregation.ts
interface AlertGroup {
  name: string;
  alerts: Alert[];
  status: 'firing' | 'resolved';
  severity: 'critical' | 'warning' | 'info';
  startsAt: Date;
  endsAt?: Date;
}

function aggregateAlerts(alerts: Alert[]): AlertGroup[] {
  return Object.values(
    alerts.reduce((groups, alert) => {
      const key = `${alert.name}-${alert.severity}`;
      if (!groups[key]) {
        groups[key] = {
          name: alert.name,
          alerts: [],
          status: 'firing',
          severity: alert.severity,
          startsAt: alert.startsAt
        };
      }
      groups[key].alerts.push(alert);
      return groups;
    }, {} as Record<string, AlertGroup>)
  );
}
```

### 2. Alert Deduplication

```typescript
// src/lib/alerting/deduplication.ts
interface AlertFingerprint {
  name: string;
  labels: Record<string, string>;
  value: number;
}

function generateFingerprint(alert: Alert): string {
  const fp: AlertFingerprint = {
    name: alert.name,
    labels: alert.labels,
    value: alert.value
  };
  
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(fp))
    .digest('hex');
}

const seenAlerts = new Set<string>();

function isDuplicate(alert: Alert): boolean {
  const fp = generateFingerprint(alert);
  if (seenAlerts.has(fp)) return true;
  
  seenAlerts.add(fp);
  // Clean up old fingerprints after 1 hour
  setTimeout(() => seenAlerts.delete(fp), 3600000);
  
  return false;
}
```

## Best Practices

### 1. Alert Design
- Clear and actionable
- Include context
- Avoid alert fatigue
- Define ownership

### 2. Severity Levels
- Critical: Immediate action required
- Warning: Action needed soon
- Info: For awareness only

### 3. Response Times
- Critical: 5 minutes
- Warning: 30 minutes
- Info: Next business day

### 4. Alert Hygiene
- Regular review
- Clean up stale alerts
- Update thresholds
- Document changes
