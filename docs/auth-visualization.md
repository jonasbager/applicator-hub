# Authentication Monitoring Visualization Guide

This guide covers creating effective visualizations for authentication monitoring.

## Dashboard Organization

### 1. Overview Dashboard

```json
{
  "dashboard": {
    "title": "Authentication Overview",
    "layout": {
      "sections": [
        {
          "title": "Key Metrics",
          "panels": [
            {
              "title": "Active Users",
              "type": "stat",
              "size": "small"
            },
            {
              "title": "Auth Success Rate",
              "type": "gauge",
              "size": "small"
            },
            {
              "title": "Response Time",
              "type": "stat",
              "size": "small"
            }
          ]
        },
        {
          "title": "Trends",
          "panels": [
            {
              "title": "Auth Operations",
              "type": "timeseries",
              "size": "medium"
            },
            {
              "title": "Error Rate",
              "type": "timeseries",
              "size": "medium"
            }
          ]
        }
      ]
    }
  }
}
```

### 2. Panel Types

#### Stat Panel
```typescript
interface StatPanel {
  type: 'stat';
  options: {
    colorMode: 'value' | 'background';
    graphMode: 'area' | 'none';
    justifyMode: 'auto' | 'center';
    textMode: 'auto' | 'value' | 'name';
    colorThresholds: Array<{
      color: string;
      value: number;
    }>;
  };
  targets: Array<{
    expr: string;
    instant: boolean;
  }>;
}

const activeUsersPanel: StatPanel = {
  type: 'stat',
  options: {
    colorMode: 'value',
    graphMode: 'area',
    justifyMode: 'center',
    colorThresholds: [
      { value: 0, color: 'red' },
      { value: 100, color: 'yellow' },
      { value: 1000, color: 'green' }
    ]
  },
  targets: [{
    expr: 'sum(auth_active_users)',
    instant: true
  }]
};
```

#### Time Series Panel
```typescript
interface TimeSeriesPanel {
  type: 'timeseries';
  options: {
    legend: {
      show: boolean;
      placement: 'bottom' | 'right';
    };
    tooltip: {
      mode: 'single' | 'multi' | 'none';
      sort: 'none' | 'asc' | 'desc';
    };
    visualization: {
      type: 'line' | 'bar' | 'points';
      lineWidth: number;
      fillOpacity: number;
    };
  };
  targets: Array<{
    expr: string;
    legendFormat: string;
  }>;
}

const authLatencyPanel: TimeSeriesPanel = {
  type: 'timeseries',
  options: {
    legend: {
      show: true,
      placement: 'bottom'
    },
    tooltip: {
      mode: 'multi',
      sort: 'desc'
    },
    visualization: {
      type: 'line',
      lineWidth: 2,
      fillOpacity: 20
    }
  },
  targets: [
    {
      expr: 'histogram_quantile(0.95, sum(rate(auth_latency_bucket[5m])) by (le))',
      legendFormat: 'p95'
    },
    {
      expr: 'histogram_quantile(0.50, sum(rate(auth_latency_bucket[5m])) by (le))',
      legendFormat: 'p50'
    }
  ]
};
```

## Color Schemes

### 1. Status Colors
```typescript
const STATUS_COLORS = {
  critical: '#E02F44', // Red
  warning: '#FFA941',  // Orange
  success: '#3EB489',  // Green
  info: '#3B7DDD',     // Blue
  neutral: '#808080'   // Gray
};

const SEVERITY_THRESHOLDS = {
  error_rate: [
    { value: 0.01, color: STATUS_COLORS.success },
    { value: 0.05, color: STATUS_COLORS.warning },
    { value: 0.10, color: STATUS_COLORS.critical }
  ],
  latency_ms: [
    { value: 200, color: STATUS_COLORS.success },
    { value: 500, color: STATUS_COLORS.warning },
    { value: 1000, color: STATUS_COLORS.critical }
  ]
};
```

### 2. Theme Integration
```typescript
interface ThemeColors {
  background: string;
  text: string;
  textMuted: string;
  border: string;
  visualization: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
  };
}

const lightTheme: ThemeColors = {
  background: '#FFFFFF',
  text: '#2D3748',
  textMuted: '#718096',
  border: '#E2E8F0',
  visualization: {
    primary: '#3182CE',
    secondary: '#805AD5',
    success: '#38A169',
    warning: '#D69E2E',
    error: '#E53E3E'
  }
};

const darkTheme: ThemeColors = {
  background: '#1A202C',
  text: '#F7FAFC',
  textMuted: '#A0AEC0',
  border: '#2D3748',
  visualization: {
    primary: '#63B3ED',
    secondary: '#B794F4',
    success: '#68D391',
    warning: '#F6E05E',
    error: '#FC8181'
  }
};
```

## Layout Guidelines

### 1. Grid System
```typescript
interface GridLayout {
  columns: 24;
  rowHeight: 30;
  padding: 8;
  panels: Array<{
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }>;
}

const PANEL_SIZES = {
  small: { w: 6, h: 4 },   // 1/4 width
  medium: { w: 12, h: 8 }, // 1/2 width
  large: { w: 24, h: 12 }  // Full width
};

const LAYOUT_TEMPLATES = {
  overview: {
    columns: 24,
    rowHeight: 30,
    padding: 8,
    panels: [
      // Top row - small stats
      { id: 'active_users', ...PANEL_SIZES.small, x: 0, y: 0 },
      { id: 'success_rate', ...PANEL_SIZES.small, x: 6, y: 0 },
      { id: 'latency', ...PANEL_SIZES.small, x: 12, y: 0 },
      { id: 'error_rate', ...PANEL_SIZES.small, x: 18, y: 0 },
      
      // Middle row - medium charts
      { id: 'auth_trends', ...PANEL_SIZES.medium, x: 0, y: 4 },
      { id: 'error_trends', ...PANEL_SIZES.medium, x: 12, y: 4 },
      
      // Bottom row - large chart
      { id: 'detailed_metrics', ...PANEL_SIZES.large, x: 0, y: 12 }
    ]
  }
};
```

### 2. Responsive Design
```typescript
interface ResponsiveLayout {
  breakpoints: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  layouts: Record<string, GridLayout>;
}

const RESPONSIVE_LAYOUT: ResponsiveLayout = {
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280
  },
  layouts: {
    sm: {
      columns: 12,
      panels: [
        // Stack panels vertically on small screens
        { id: 'active_users', w: 12, h: 4, x: 0, y: 0 },
        { id: 'success_rate', w: 12, h: 4, x: 0, y: 4 },
        { id: 'latency', w: 12, h: 4, x: 0, y: 8 },
        { id: 'error_rate', w: 12, h: 4, x: 0, y: 12 }
      ]
    },
    xl: {
      columns: 24,
      panels: [
        // Full layout on large screens
        { id: 'active_users', w: 6, h: 4, x: 0, y: 0 },
        { id: 'success_rate', w: 6, h: 4, x: 6, y: 0 },
        { id: 'latency', w: 6, h: 4, x: 12, y: 0 },
        { id: 'error_rate', w: 6, h: 4, x: 18, y: 0 }
      ]
    }
  }
};
```

## Visualization Best Practices

### 1. Data Presentation
- Use appropriate chart types
- Show context and trends
- Highlight anomalies
- Include units and labels

### 2. Performance
- Limit data points
- Use efficient queries
- Cache where appropriate
- Optimize refresh rates

### 3. Accessibility
- Use colorblind-friendly palettes
- Include text alternatives
- Support keyboard navigation
- Maintain contrast ratios

### 4. Interactivity
- Enable drill-down views
- Provide tooltips
- Allow time range selection
- Support data export

## Implementation Examples

### 1. Success Rate Gauge
```typescript
const successRateGauge = {
  type: 'gauge',
  options: {
    reduceOptions: {
      calcs: ['lastNotNull'],
      fields: '',
      values: false
    },
    orientation: 'auto',
    showThresholdLabels: false,
    showThresholdMarkers: true,
    thresholds: {
      mode: 'percentage',
      steps: [
        { value: 0, color: 'red' },
        { value: 90, color: 'orange' },
        { value: 95, color: 'green' }
      ]
    }
  },
  targets: [{
    expr: '100 * sum(rate(auth_success[5m])) / sum(rate(auth_total[5m]))'
  }]
};
```

### 2. Error Rate Heatmap
```typescript
const errorRateHeatmap = {
  type: 'heatmap',
  options: {
    calculate: false,
    color: {
      mode: 'scheme',
      scheme: 'RdYlBu'
    },
    yAxis: {
      format: 'short',
      decimals: null,
      logBase: 1
    }
  },
  targets: [{
    expr: 'sum(increase(auth_errors_total[$__rate_interval])) by (error_type)',
    format: 'heatmap',
    legendFormat: '{{error_type}}'
  }]
};
