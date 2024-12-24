# Authentication Deployment Guide

This guide covers deploying and maintaining the Clerk authentication setup in production.

## Deployment Checklist

### 1. Environment Setup

```env
# Production environment variables
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
VITE_SUPABASE_URL=your-production-url
VITE_SUPABASE_ANON_KEY=your-production-key
VITE_APP_URL=https://applymate.app
```

### 2. Security Headers

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name applymate.app;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/applymate.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/applymate.app/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS (uncomment if you're sure)
    # add_header Strict-Transport-Security "max-age=63072000" always;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self' https://*.clerk.com https://*.supabase.co; script-src 'self' 'unsafe-inline' https://*.clerk.com; style-src 'self' 'unsafe-inline' https://*.clerk.com; img-src 'self' data: https://*.clerk.com; font-src 'self' data:; connect-src 'self' https://*.clerk.com https://*.supabase.co;" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## CI/CD Pipeline

### 1. GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy Auth

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test
        env:
          VITE_CLERK_PUBLISHABLE_KEY: ${{ secrets.TEST_CLERK_KEY }}
          VITE_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}

  security:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  deploy:
    needs: [test, security]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Build
        run: |
          npm ci
          npm run build
        env:
          VITE_CLERK_PUBLISHABLE_KEY: ${{ secrets.PROD_CLERK_KEY }}
          VITE_SUPABASE_URL: ${{ secrets.PROD_SUPABASE_URL }}
      
      - name: Deploy to S3
        run: aws s3 sync dist/ s3://applymate-app --delete
      
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_ID }} \
            --paths "/*"
```

## Monitoring Setup

### 1. Clerk Dashboard Alerts

```typescript
// src/lib/monitoring.ts
import { clerk } from '@clerk/clerk-sdk-node';

// Set up webhook handler
export async function handleClerkWebhook(event: any) {
  switch (event.type) {
    case 'user.created':
      await notifySlack('New user signup');
      break;
    
    case 'session.removed':
      await logSecurityEvent('Session terminated');
      break;
    
    case 'verification.failed':
      await alertTeam('Verification failure');
      break;
  }
}

// Monitor auth failures
clerk.on('signIn.failed', async (event) => {
  if (event.attemptCount > 5) {
    await alertTeam(`Multiple failed login attempts for ${event.email}`);
  }
});
```

### 2. Error Tracking

```typescript
// src/lib/error-tracking.ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: [
        'localhost',
        'applymate.app'
      ],
    }),
  ],
  tracesSampleRate: 1.0,
});

// Track auth errors
export function trackAuthError(error: Error, context?: any) {
  Sentry.captureException(error, {
    tags: {
      type: 'auth_error'
    },
    extra: context
  });
}
```

### 3. Performance Monitoring

```typescript
// src/lib/performance.ts
import { metrics } from './monitoring';

// Track auth operation timing
export async function trackAuthTiming(operation: string, fn: () => Promise<any>) {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const duration = performance.now() - start;
    metrics.timing(`auth.${operation}`, duration);
  }
}

// Monitor rate limits
export function trackRateLimit(endpoint: string, remaining: number) {
  metrics.gauge(`auth.rate_limit.${endpoint}`, remaining);
  if (remaining < 100) {
    alertTeam(`Rate limit warning for ${endpoint}`);
  }
}
```

## Rollback Plan

### 1. Preparation

```bash
# Backup current state
aws s3 sync s3://applymate-app s3://applymate-backup/$(date +%Y%m%d)

# Keep previous deployment
mv dist dist-previous
```

### 2. Rollback Script

```bash
#!/bin/bash
# rollback.sh

# Restore previous version
aws s3 sync s3://applymate-backup/latest s3://applymate-app --delete

# Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_ID \
  --paths "/*"

# Switch Clerk to previous version
clerk environments:promote-last
```

### 3. Monitoring During Rollback

```typescript
// src/lib/rollback-monitoring.ts
async function monitorRollback() {
  const metrics = {
    authSuccess: 0,
    authFailure: 0,
    totalUsers: 0
  };

  // Monitor for 5 minutes
  const interval = setInterval(async () => {
    const current = await getAuthMetrics();
    
    if (current.failureRate > 0.01) {
      await alertTeam('High failure rate during rollback');
    }
    
    metrics.authSuccess += current.success;
    metrics.authFailure += current.failure;
    metrics.totalUsers = current.users;
  }, 10000);

  // Stop after 5 minutes
  setTimeout(() => {
    clearInterval(interval);
    reportRollbackMetrics(metrics);
  }, 300000);
}
```

## Production Checklist

### 1. Pre-deployment

- [ ] Run full test suite
- [ ] Check security scan results
- [ ] Verify environment variables
- [ ] Test OAuth providers
- [ ] Validate email templates

### 2. Deployment

- [ ] Deploy during low-traffic period
- [ ] Monitor error rates
- [ ] Check auth success rate
- [ ] Verify OAuth flows
- [ ] Test email delivery

### 3. Post-deployment

- [ ] Monitor performance metrics
- [ ] Check error logs
- [ ] Verify user sessions
- [ ] Test password reset
- [ ] Validate OAuth logins

## Maintenance

### 1. Regular Tasks

- Weekly security updates
- Monthly token rotation
- Quarterly OAuth review
- Daily backup verification

### 2. Monitoring

- Auth success rate
- API response times
- Error rates
- Session counts
- Token usage

### 3. Updates

- Clerk SDK versions
- Security patches
- OAuth provider changes
- Email template updates

## Troubleshooting

### 1. Common Issues

- Session expiration
- OAuth callback errors
- Rate limiting
- CORS issues

### 2. Quick Fixes

```bash
# Clear CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $CLOUDFRONT_ID \
  --paths "/auth/*"

# Rotate Clerk keys
clerk keys:rotate

# Check logs
aws logs tail /aws/lambda/auth-function --follow
```

### 3. Emergency Contacts

- Clerk Support: support@clerk.dev
- DevOps Team: devops@applymate.app
- Security Team: security@applymate.app
