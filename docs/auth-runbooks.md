# Authentication Runbooks

This guide provides step-by-step procedures for handling common authentication incidents.

## System Down

### Symptoms
- Alert: `AuthSystemDown`
- No users can authenticate
- High error rate in logs
- Monitoring shows zero successful auth attempts

### Diagnosis Steps
```bash
# 1. Check Clerk status
curl -I https://api.clerk.dev/v1/status

# 2. Verify database connectivity
curl -I https://your-project.supabase.co/health

# 3. Check application logs
kubectl logs -l app=auth-service -n production --tail=100

# 4. Verify DNS resolution
dig clerk.applymate.app
dig auth.applymate.app
```

### Resolution Steps
1. **If Clerk is down:**
   ```typescript
   // Enable offline fallback mode
   await setFeatureFlag('auth.fallback', true);
   
   // Cache valid sessions
   await cacheAuthSessions();
   
   // Monitor Clerk status
   while (!(await checkClerkStatus())) {
     await delay(30000); // Check every 30s
   }
   
   // Restore normal operation
   await setFeatureFlag('auth.fallback', false);
   ```

2. **If database is down:**
   ```bash
   # Check database connections
   kubectl exec -it $(kubectl get pod -l app=auth-db -o jsonpath='{.items[0].metadata.name}') \
     -n production -- pg_isready
   
   # Check connection pool
   kubectl exec -it $(kubectl get pod -l app=auth-service -o jsonpath='{.items[0].metadata.name}') \
     -n production -- curl localhost:9090/metrics | grep db_connections
   ```

3. **If DNS issues:**
   ```bash
   # Update DNS cache
   kubectl delete pod -l app=coredns -n kube-system
   
   # Verify resolution
   for domain in clerk.applymate.app auth.applymate.app api.applymate.app; do
     dig +short $domain
   done
   ```

### Verification
```typescript
// src/lib/verification/auth-health.ts
async function verifyAuthSystem() {
  // 1. Check basic auth flow
  const testAuth = await testAuthFlow();
  if (!testAuth.success) {
    throw new Error(`Auth flow failed: ${testAuth.error}`);
  }

  // 2. Verify session management
  const testSession = await testSessionManagement();
  if (!testSession.success) {
    throw new Error(`Session test failed: ${testSession.error}`);
  }

  // 3. Check database operations
  const testDb = await testDatabaseOperations();
  if (!testDb.success) {
    throw new Error(`Database test failed: ${testDb.error}`);
  }

  return true;
}
```

## High Failure Rate

### Symptoms
- Alert: `HighAuthFailureRate`
- Increased error logs
- User complaints
- Elevated support tickets

### Diagnosis Steps
```typescript
// src/lib/diagnosis/auth-failures.ts
async function diagnoseAuthFailures() {
  // 1. Get error distribution
  const errorStats = await getErrorStats({
    timeRange: '1h',
    groupBy: 'error_type'
  });

  // 2. Check rate limiting
  const rateLimits = await getRateLimitStatus();

  // 3. Analyze geographic distribution
  const geoStats = await getGeoDistribution({
    timeRange: '1h',
    filterFailed: true
  });

  // 4. Check for blocked IPs
  const blockedIPs = await getBlockedIPs();

  return {
    errorStats,
    rateLimits,
    geoStats,
    blockedIPs
  };
}
```

### Resolution Steps
1. **If rate limited:**
   ```typescript
   // Increase rate limits temporarily
   await updateRateLimits({
     signIn: { rpm: 100, burst: 200 },
     signUp: { rpm: 50, burst: 100 },
     passwordReset: { rpm: 20, burst: 40 }
   });
   ```

2. **If under attack:**
   ```typescript
   // Enable additional protection
   await enableProtection({
     captcha: true,
     ipThrottling: true,
     geoFencing: true
   });
   ```

3. **If configuration issue:**
   ```typescript
   // Rollback to last known good config
   await rollbackConfig({
     version: 'last-successful',
     services: ['auth', 'session']
   });
   ```

### Recovery
```typescript
// src/lib/recovery/auth-restore.ts
async function restoreAuthService() {
  // 1. Verify system health
  const health = await checkSystemHealth();
  if (!health.ok) {
    throw new Error(`System unhealthy: ${health.reason}`);
  }

  // 2. Restore normal operations
  await restoreNormalOperation();

  // 3. Clear error counters
  await resetErrorMetrics();

  // 4. Notify team
  await notifyTeam('Auth service restored to normal operation');
}
```

## Performance Degradation

### Symptoms
- Alert: `AuthLatencyHigh`
- Slow response times
- Timeout errors
- Connection pool exhaustion

### Diagnosis Steps
```typescript
// src/lib/diagnosis/performance.ts
async function diagnosePerformance() {
  // 1. Check resource usage
  const resources = await getResourceUsage({
    cpu: true,
    memory: true,
    connections: true
  });

  // 2. Analyze query performance
  const slowQueries = await getSlowQueries({
    threshold: '500ms',
    limit: 10
  });

  // 3. Check connection pool
  const poolStats = await getConnectionPoolStats();

  return {
    resources,
    slowQueries,
    poolStats
  };
}
```

### Resolution Steps
1. **If resource constrained:**
   ```typescript
   // Scale up resources
   await scaleResources({
     replicas: 5,
     cpu: '2',
     memory: '4Gi'
   });
   ```

2. **If connection issues:**
   ```typescript
   // Optimize connection pool
   await updateConnectionPool({
     maxSize: 20,
     minSize: 5,
     idleTimeout: '5m'
   });
   ```

3. **If query performance:**
   ```typescript
   // Optimize queries
   await optimizeQueries({
     addIndexes: true,
     updateStatistics: true,
     vacuumAnalyze: true
   });
   ```

## OAuth Provider Issues

### Symptoms
- Alert: `OAuthProviderDown`
- Failed social logins
- Callback errors
- Token validation failures

### Diagnosis Steps
```typescript
// src/lib/diagnosis/oauth.ts
async function diagnoseOAuthIssues(provider: string) {
  // 1. Check provider status
  const status = await checkProviderStatus(provider);

  // 2. Verify configuration
  const config = await validateOAuthConfig(provider);

  // 3. Test endpoints
  const endpoints = await testOAuthEndpoints(provider);

  return {
    status,
    config,
    endpoints
  };
}
```

### Resolution Steps
1. **If provider down:**
   ```typescript
   // Enable alternative auth methods
   await enableAlternativeAuth({
     email: true,
     magicLink: true
   });
   ```

2. **If configuration issue:**
   ```typescript
   // Restore working configuration
   await restoreOAuthConfig({
     provider,
     version: 'last-working'
   });
   ```

3. **If token issues:**
   ```typescript
   // Refresh OAuth credentials
   await refreshOAuthCredentials(provider);
   ```

## Best Practices

### 1. Investigation
- Start with logs
- Check metrics
- Review recent changes
- Look for patterns

### 2. Communication
- Keep team updated
- Document findings
- Share resolution
- Update runbooks

### 3. Prevention
- Regular testing
- Proactive monitoring
- Configuration reviews
- Capacity planning

### 4. Recovery
- Verify resolution
- Update documentation
- Schedule post-mortem
- Implement improvements
