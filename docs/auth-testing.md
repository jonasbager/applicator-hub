# Testing Authentication Setup

This guide covers testing strategies for the Clerk authentication integration with Supabase.

## Test Environment Setup

1. Create test environment:
```env
# .env.test
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
VITE_SUPABASE_URL=your-test-project-url
VITE_SUPABASE_ANON_KEY=your-test-anon-key
```

2. Install testing dependencies:
```bash
npm install -D vitest @testing-library/react @testing-library/user-event msw
```

3. Configure test setup:
```typescript
// vitest.setup.ts
import '@testing-library/jest-dom';
import { beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer(
  // Mock Clerk endpoints
  rest.post('https://api.clerk.dev/v1/client/sign_in', (req, res, ctx) => {
    return res(ctx.json({ token: 'test-token' }));
  }),
  
  // Mock Supabase endpoints
  rest.get('https://your-test-project.supabase.co/rest/v1/jobs', (req, res, ctx) => {
    return res(ctx.json([]));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Unit Tests

### 1. Testing Auth Components

```typescript
// src/__tests__/auth/sign-in.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { SignInPage } from '../../pages/auth/sign-in';

describe('SignInPage', () => {
  it('renders sign in form', () => {
    render(<SignInPage />);
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    render(<SignInPage />);
    
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Wait for redirect
    await screen.findByText(/redirecting/i);
  });
});
```

### 2. Testing Auth Bridge

```typescript
// src/__tests__/lib/auth-bridge.test.ts
import { AuthBridge } from '../../lib/auth-bridge';

describe('AuthBridge', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com'
  };

  it('fetches user jobs', async () => {
    const bridge = new AuthBridge(mockUser);
    const jobs = await bridge.getJobs();
    expect(jobs).toEqual([]);
  });

  it('creates job with user id', async () => {
    const bridge = new AuthBridge(mockUser);
    const job = await bridge.createJob({
      title: 'Test Job',
      company: 'Test Co'
    });
    
    expect(job.user_id).toBe(mockUser.id);
  });
});
```

### 3. Testing Protected Routes

```typescript
// src/__tests__/components/protected-route.test.tsx
import { render, screen } from '@testing-library/react';
import { Protected } from '../../lib/clerk-provider';

describe('Protected', () => {
  it('shows loading state', () => {
    render(
      <Protected>
        <div>Protected content</div>
      </Protected>
    );
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('redirects when not authenticated', async () => {
    render(
      <Protected>
        <div>Protected content</div>
      </Protected>
    );
    
    await screen.findByText(/please sign in/i);
  });
});
```

## Integration Tests

### 1. Auth Flow Testing

```typescript
// cypress/e2e/auth.cy.ts
describe('Authentication Flow', () => {
  it('completes sign up process', () => {
    cy.visit('/sign-up');
    
    // Fill sign up form
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('Password123!');
    cy.get('button[type="submit"]').click();
    
    // Verify email
    cy.get('input[name="code"]').type('123456');
    cy.get('button[type="submit"]').click();
    
    // Should redirect to jobs page
    cy.url().should('include', '/jobs');
  });

  it('handles sign in with GitHub', () => {
    cy.visit('/sign-in');
    cy.get('button').contains('Continue with GitHub').click();
    
    // Mock GitHub OAuth
    cy.origin('https://github.com', () => {
      cy.get('input[name="login"]').type('testuser');
      cy.get('input[name="password"]').type('githubpass123');
      cy.get('button[type="submit"]').click();
    });
    
    // Should redirect back and show jobs
    cy.url().should('include', '/jobs');
  });
});
```

### 2. Database Integration

```typescript
// cypress/e2e/data-access.cy.ts
describe('Database Access', () => {
  beforeEach(() => {
    cy.login(); // Custom command to set up auth state
  });

  it('fetches user jobs', () => {
    cy.visit('/jobs');
    cy.get('[data-testid="job-list"]').should('exist');
  });

  it('creates new job', () => {
    cy.visit('/jobs');
    cy.get('button').contains('Add Job').click();
    
    cy.get('input[name="title"]').type('Test Engineer');
    cy.get('input[name="company"]').type('Test Co');
    cy.get('button[type="submit"]').click();
    
    cy.get('[data-testid="job-list"]')
      .should('contain', 'Test Engineer')
      .and('contain', 'Test Co');
  });
});
```

## Performance Testing

### 1. Auth Response Times

```typescript
// tests/performance/auth-timing.test.ts
import { test, expect } from '@playwright/test';

test('measures auth operation timing', async ({ page }) => {
  const startTime = Date.now();
  
  await page.goto('/sign-in');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('/jobs');
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  expect(duration).toBeLessThan(2000); // Should complete within 2s
});
```

### 2. Load Testing

```typescript
// tests/performance/load.test.ts
import { check } from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
};

export default function() {
  const res = http.post('https://api.clerk.dev/v1/client/sign_in', {
    email: 'test@example.com',
    password: 'password123'
  });
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500
  });
  
  sleep(1);
}
```

## Security Testing

### 1. Token Validation

```typescript
// tests/security/token.test.ts
describe('Token Security', () => {
  it('validates token expiration', async () => {
    const expiredToken = 'eyJ...'; // Create expired token
    
    const res = await fetch('/api/protected', {
      headers: {
        Authorization: `Bearer ${expiredToken}`
      }
    });
    
    expect(res.status).toBe(401);
  });

  it('prevents token reuse', async () => {
    const token = await signIn();
    await signOut(); // Invalidate token
    
    const res = await fetch('/api/protected', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    expect(res.status).toBe(401);
  });
});
```

### 2. CORS Testing

```typescript
// tests/security/cors.test.ts
describe('CORS Security', () => {
  it('blocks unauthorized origins', async () => {
    const res = await fetch('https://your-app.com/api/protected', {
      headers: {
        Origin: 'https://malicious-site.com'
      }
    });
    
    expect(res.status).toBe(403);
  });
});
```

## Test Coverage

Run coverage reports:
```bash
# Unit test coverage
npm run test:coverage

# E2E coverage
npm run test:e2e:coverage
```

Coverage goals:
- Unit tests: 80%
- Integration tests: 70%
- E2E tests: 50%

## Continuous Integration

```yaml
# .github/workflows/test.yml
name: Test Auth

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: |
          npm run test
          npm run test:e2e
          npm run test:security
        env:
          VITE_CLERK_PUBLISHABLE_KEY: ${{ secrets.TEST_CLERK_KEY }}
          VITE_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
```

## Best Practices

1. **Test Data Management**
   - Use test database
   - Reset between tests
   - Mock external services

2. **Security Testing**
   - Test token validation
   - Verify CORS policies
   - Check rate limiting

3. **Performance Testing**
   - Measure response times
   - Test under load
   - Monitor memory usage

4. **Monitoring**
   - Track test metrics
   - Monitor coverage
   - Alert on failures
