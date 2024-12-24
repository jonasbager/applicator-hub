# Authentication Monitoring Setup

This guide covers setting up comprehensive monitoring for the Clerk authentication system.

## Metrics Overview

### 1. Key Performance Indicators (KPIs)

```typescript
// src/lib/monitoring/metrics.ts
export const AUTH_METRICS = {
  // User Activity
  activeUsers: {
    name: 'auth.active_users',
    type: 'gauge',
    description: 'Currently active authenticated users'
  },
  
  // Authentication
  loginSuccess: {
    name: 'auth.login.success',
    type: 'counter',
    description: 'Successful login attempts'
  },
  loginFailure: {
    name: 'auth.login.failure',
    type: 'counter',
    description: 'Failed login attempts'
  },
  
  // Performance
  authLatency: {
    name: 'auth.latency',
    type: 'histogram',
    description: 'Authentication operation latency',
    buckets: [50, 100, 200, 500, 1000, 2000]
  }
};
```

## Dashboard Setup

### 1. Grafana Dashboard

```json
{
  "dashboard": {
    "id": null,
    "title": "Authentication Overview",
    "tags": ["auth", "clerk", "production"],
    "timezone": "browser",
    "panels": [
      {
        "title": "Active Users",
        "type": "stat",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "sum(auth_active_users)",
            "legendFormat": "Active Users"
          }
        ],
        "gridPos": {
          "h": 4,
          "w": 6,
          "x": 0,
          "y": 0
        }
      },
      {
        "title": "Authentication Success Rate",
        "type": "gauge",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "sum(rate(auth_login_success[5m])) / sum(rate(auth_login_total[5m])) * 100",
            "legendFormat": "Success Rate"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 8,
          "x": 6,
          "y": 0
        },
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "steps": [
                { "value": 90, "color": "red" },
                { "value": 95, "color": "yellow" },
                { "value": 98, "color": "green" }
              ]
            }
          }
        }
      },
      {
        "title": "Authentication Latency",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(auth_latency_bucket[5m])) by (le))",
            "legendFormat": "p95"
          },
          {
            "expr": "histogram_quantile(0.50, sum(rate(auth_latency_bucket[5m])) by (le))",
            "legendFormat": "p50"
          }
        ],
        "gridPos": {
          "h": 8,
          "w": 12,
          "x": 0,
          "y": 8
        }
      }
    ]
  }
}
```

### 2. Alert Rules

```yaml
# prometheus/rules/auth.yml
groups:
  - name: auth
    rules:
      - alert: HighAuthFailureRate
        expr: |
          sum(rate(auth_login_failure[5m])) 
          / 
          sum(rate(auth_login_total[5m])) 
          > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High authentication failure rate
          description: |
            Authentication failure rate is above 5%
            Current value: {{ $value | printf "%.2f" }}%
            
      - alert: AuthLatencyHigh
        expr: |
          histogram_quantile(0.95, sum(rate(auth_latency_bucket[5m])) by (le))
          > 
          1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High authentication latency
          description: |
            95th percentile latency is above 1000ms
            Current value: {{ $value | printf "%.2f" }}ms
```

## Metric Collection

### 1. Clerk Metrics

```typescript
// src/lib/monitoring/clerk-metrics.ts
import { metrics } from './metrics';
import { clerk } from '@clerk/clerk-sdk-node';

export function setupClerkMetrics() {
  // Track sign-ins
  clerk.on('signIn.created', () => {
    metrics.increment('auth.login.success');
  });
  
  clerk.on('signIn.failed', () => {
    metrics.increment('auth.login.failure');
  });
  
  // Track sessions
  clerk.on('session.created', () => {
    metrics.increment('auth.session.created');
  });
  
  clerk.on('session.removed', () => {
    metrics.decrement('auth.session.active');
  });
  
  // Track user operations
  clerk.on('user.created', () => {
    metrics.increment('auth.user.created');
  });
  
  clerk.on('user.deleted', () => {
    metrics.decrement('auth.user.total');
  });
}
```

### 2. Performance Metrics

```typescript
// src/lib/monitoring/performance.ts
import { metrics } from './metrics';

export async function trackAuthOperation<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const timer = metrics.startTimer();
  
  try {
    const result = await fn();
    metrics.increment(`auth.operation.${operation}.success`);
    return result;
  } catch (error) {
    metrics.increment(`auth.operation.${operation}.failure`);
    throw error;
  } finally {
    const duration = timer.end();
    metrics.histogram('auth.operation.duration', duration, {
      operation
    });
  }
}
```

## Real-time Monitoring

### 1. Active User Tracking

```typescript
// src/lib/monitoring/active-users.ts
import { metrics } from './metrics';

const ACTIVE_WINDOW = 5 * 60 * 1000; // 5 minutes
const activeUsers = new Set<string>();

export function trackActiveUser(userId: string) {
  activeUsers.add(userId);
  
  // Update gauge
  metrics.gauge('auth.active_users', activeUsers.size);
  
  // Clean up after window
  setTimeout(() => {
    activeUsers.delete(userId);
    metrics.gauge('auth.active_users', activeUsers.size);
  }, ACTIVE_WINDOW);
}
```

### 2. Error Tracking

```typescript
// src/lib/monitoring/error-tracking.ts
import * as Sentry from '@sentry/react';
import { metrics } from './metrics';

export function trackAuthError(error: Error, context: any = {}) {
  // Increment error counter
  metrics.increment('auth.error', {
    type: error.name,
    code: context.code
  });
  
  // Track in Sentry
  Sentry.captureException(error, {
    tags: {
      type: 'auth_error',
      ...context
    }
  });
  
  // Log to CloudWatch
  console.error('Auth Error:', {
    error: error.message,
    stack: error.stack,
    ...context
  });
}
```

## Health Checks

### 1. System Health

```typescript
// src/lib/monitoring/health.ts
interface HealthCheck {
  clerk: boolean;
  oauth: {
    github: boolean;
    google: boolean;
  };
  email: boolean;
}

export async function checkAuthHealth(): Promise<HealthCheck> {
  const health: HealthCheck = {
    clerk: await checkClerkHealth(),
    oauth: {
      github: await checkOAuthProvider('github'),
      google: await checkOAuthProvider('google')
    },
    email: await checkEmailDelivery()
  };
  
  // Update metrics
  Object.entries(health).forEach(([key, value]) => {
    metrics.gauge(`auth.health.${key}`, value ? 1 : 0);
  });
  
  return health;
}
```

### 2. Automated Tests

```typescript
// src/lib/monitoring/synthetic.ts
export async function runSyntheticTests() {
  const tests = [
    testSignIn,
    testOAuthFlow,
    testPasswordReset,
    testEmailVerification
  ];
  
  for (const test of tests) {
    try {
      await test();
      metrics.increment('auth.synthetic.success', {
        test: test.name
      });
    } catch (error) {
      metrics.increment('auth.synthetic.failure', {
        test: test.name
      });
      await alertTeam({
        level: 'warning',
        message: `Synthetic test failed: ${test.name}`,
        error
      });
    }
  }
}
```

## Dashboard Access

### 1. Role-Based Access

```typescript
// src/lib/monitoring/access.ts
interface DashboardAccess {
  role: 'admin' | 'developer' | 'support';
  permissions: string[];
}

const ACCESS_LEVELS: Record<string, DashboardAccess> = {
  admin: {
    role: 'admin',
    permissions: ['view', 'edit', 'delete']
  },
  developer: {
    role: 'developer',
    permissions: ['view', 'edit']
  },
  support: {
    role: 'support',
    permissions: ['view']
  }
};

export function getDashboardAccess(user: User): DashboardAccess {
  return ACCESS_LEVELS[user.role] || ACCESS_LEVELS.support;
}
```

### 2. Audit Logging

```typescript
// src/lib/monitoring/audit.ts
export async function logDashboardAccess(
  user: User,
  action: string,
  resource: string
) {
  await createAuditLog({
    user: user.id,
    action,
    resource,
    timestamp: new Date(),
    ip: user.ip,
    userAgent: user.userAgent
  });
  
  metrics.increment('dashboard.access', {
    action,
    resource
  });
}
```

## Best Practices

1. **Metric Naming**
   - Use consistent prefixes
   - Include units where applicable
   - Follow naming conventions

2. **Alert Configuration**
   - Set appropriate thresholds
   - Include clear descriptions
   - Define escalation paths

3. **Dashboard Organization**
   - Group related metrics
   - Use consistent time ranges
   - Include documentation

4. **Performance Impact**
   - Use sampling where appropriate
   - Batch metric updates
   - Monitor collector performance
