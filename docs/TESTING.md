# RightsGuard AI - Testing Guide

This document outlines the testing strategy and procedures for RightsGuard AI.

## 🧪 Testing Strategy

### Testing Pyramid

1. **Unit Tests** (70%)
   - Individual functions and components
   - Business logic validation
   - API service functions

2. **Integration Tests** (20%)
   - Component interactions
   - API integrations
   - Database operations

3. **End-to-End Tests** (10%)
   - Complete user workflows
   - Cross-browser compatibility
   - Mobile responsiveness

## 🔧 Test Setup

### Dependencies

```bash
# Install testing dependencies
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  vitest \
  jsdom \
  msw
```

### Configuration

Create `vitest.config.js`:

```javascript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
  },
})
```

Create `src/test/setup.js`:

```javascript
import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './mocks/server'

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers after each test
afterEach(() => server.resetHandlers())

// Clean up after all tests
afterAll(() => server.close())

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_SUPABASE_URL: 'http://localhost:54321',
    VITE_SUPABASE_ANON_KEY: 'test-key',
    VITE_OPENAI_API_KEY: 'test-openai-key',
    VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_key'
  }
})
```

## 🧪 Unit Tests

### Component Testing

```javascript
// src/components/__tests__/LocationSelector.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import LocationSelector from '../LocationSelector'

describe('LocationSelector', () => {
  it('renders state selection dropdown', () => {
    const mockOnStateSelect = vi.fn()
    render(<LocationSelector onStateSelect={mockOnStateSelect} />)
    
    expect(screen.getByText('Select Your State')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('calls onStateSelect when state is selected', async () => {
    const mockOnStateSelect = vi.fn()
    render(<LocationSelector onStateSelect={mockOnStateSelect} />)
    
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'California' } })
    
    await waitFor(() => {
      expect(mockOnStateSelect).toHaveBeenCalledWith('California')
    })
  })

  it('handles geolocation when available', async () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) => 
        success({
          coords: { latitude: 34.0522, longitude: -118.2437 }
        })
      )
    }
    
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true
    })

    const mockOnStateSelect = vi.fn()
    render(<LocationSelector onStateSelect={mockOnStateSelect} />)
    
    const geoButton = screen.getByText('Use My Location')
    fireEvent.click(geoButton)
    
    await waitFor(() => {
      expect(mockOnStateSelect).toHaveBeenCalledWith('California')
    })
  })
})
```

### Service Testing

```javascript
// src/lib/__tests__/database.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { userService, incidentService } from '../database'

// Mock Supabase
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { user_id: 'test-user', email: 'test@example.com' },
            error: null
          }))
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { user_id: 'test-user', email: 'test@example.com' },
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { user_id: 'test-user', subscription_status: 'pro' },
              error: null
            }))
          }))
        }))
      }))
    }))
  }
}))

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a new user', async () => {
    const userData = { id: 'test-user', email: 'test@example.com' }
    const result = await userService.createUser(userData)
    
    expect(result).toEqual({
      user_id: 'test-user',
      email: 'test@example.com'
    })
  })

  it('gets user by ID', async () => {
    const result = await userService.getUser('test-user')
    
    expect(result).toEqual({
      user_id: 'test-user',
      email: 'test@example.com'
    })
  })

  it('updates user profile', async () => {
    const result = await userService.updateUser('test-user', {
      subscription_status: 'pro'
    })
    
    expect(result.subscription_status).toBe('pro')
  })
})

describe('incidentService', () => {
  it('creates incident report', async () => {
    const incidentData = {
      userId: 'test-user',
      location: 'California',
      notes: 'Test incident'
    }
    
    const result = await incidentService.createIncident(incidentData)
    expect(result.user_id).toBe('test-user')
    expect(result.location).toBe('California')
  })
})
```

### OpenAI Service Testing

```javascript
// src/lib/__tests__/openai.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateLegalScripts, translateToSpanish } from '../openai'

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  }))
}))

describe('OpenAI Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('generates legal scripts for a state', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            scriptToSay: 'Test script to say',
            scriptNotToSay: 'Test script not to say'
          })
        }
      }]
    }

    // Mock the OpenAI response
    const mockCreate = vi.fn().mockResolvedValue(mockResponse)
    vi.doMock('openai', () => ({
      default: vi.fn(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }))
    }))

    const result = await generateLegalScripts('California', 'english')
    
    expect(result.scriptToSay).toBe('Test script to say')
    expect(result.scriptNotToSay).toBe('Test script not to say')
  })

  it('handles API errors gracefully', async () => {
    const mockCreate = vi.fn().mockRejectedValue(new Error('API Error'))
    vi.doMock('openai', () => ({
      default: vi.fn(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }))
    }))

    const result = await generateLegalScripts('California', 'english')
    
    // Should return mock scripts when API fails
    expect(result.scriptToSay).toContain('exercising my right to remain silent')
  })
})
```

## 🔗 Integration Tests

### Context Testing

```javascript
// src/contexts/__tests__/AuthContext.test.jsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AuthProvider, useAuth } from '../AuthContext'

// Test component that uses auth context
function TestComponent() {
  const { user, signIn, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      <div data-testid="user-email">{user?.email || 'Not signed in'}</div>
      <button onClick={() => signIn('test@example.com', 'password')}>
        Sign In
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  it('provides authentication state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('Not signed in')
    })
  })

  it('handles sign in', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    const signInButton = screen.getByText('Sign In')
    fireEvent.click(signInButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
    })
  })
})
```

### API Integration Testing

```javascript
// src/test/integration/api.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { rest } from 'msw'
import { userService } from '../../lib/database'

const server = setupServer(
  rest.post('*/rest/v1/users', (req, res, ctx) => {
    return res(ctx.json({
      user_id: 'test-user',
      email: 'test@example.com',
      subscription_status: 'free'
    }))
  }),
  
  rest.get('*/rest/v1/users', (req, res, ctx) => {
    return res(ctx.json({
      user_id: 'test-user',
      email: 'test@example.com',
      subscription_status: 'free'
    }))
  })
)

beforeAll(() => server.listen())
afterAll(() => server.close())

describe('API Integration', () => {
  it('creates and retrieves user', async () => {
    const userData = { id: 'test-user', email: 'test@example.com' }
    
    // Create user
    const created = await userService.createUser(userData)
    expect(created.email).toBe('test@example.com')
    
    // Retrieve user
    const retrieved = await userService.getUser('test-user')
    expect(retrieved.email).toBe('test@example.com')
  })
})
```

## 🌐 End-to-End Tests

### Playwright Setup

```bash
npm install --save-dev @playwright/test
npx playwright install
```

Create `playwright.config.js`:

```javascript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

### E2E Test Examples

```javascript
// e2e/user-flow.spec.js
import { test, expect } from '@playwright/test'

test.describe('User Authentication Flow', () => {
  test('user can sign up and sign in', async ({ page }) => {
    await page.goto('/')
    
    // Click sign up
    await page.click('[data-testid="auth-button"]')
    await page.click('[data-testid="sign-up-tab"]')
    
    // Fill sign up form
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'testpassword123')
    await page.click('[data-testid="sign-up-submit"]')
    
    // Should be signed in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })
})

test.describe('Rights Card Flow', () => {
  test('user can select state and view rights', async ({ page }) => {
    await page.goto('/')
    
    // Select state
    await page.selectOption('[data-testid="state-selector"]', 'California')
    
    // Should show rights information
    await expect(page.locator('[data-testid="rights-info"]')).toBeVisible()
    await expect(page.locator('[data-testid="rights-info"]')).toContainText('California')
  })

  test('user can generate AI scripts', async ({ page }) => {
    await page.goto('/')
    
    // Sign in first
    await page.click('[data-testid="auth-button"]')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'testpassword123')
    await page.click('[data-testid="sign-in-submit"]')
    
    // Select state
    await page.selectOption('[data-testid="state-selector"]', 'California')
    
    // Generate scripts
    await page.click('[data-testid="generate-scripts-button"]')
    
    // Should show loading and then scripts
    await expect(page.locator('[data-testid="loading-toast"]')).toBeVisible()
    await expect(page.locator('[data-testid="script-to-say"]')).toBeVisible()
    await expect(page.locator('[data-testid="script-not-to-say"]')).toBeVisible()
  })
})

test.describe('Recording Flow', () => {
  test('user can start and stop recording', async ({ page, context }) => {
    // Grant microphone permissions
    await context.grantPermissions(['microphone'])
    
    await page.goto('/')
    
    // Sign in and select state
    await page.click('[data-testid="auth-button"]')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'testpassword123')
    await page.click('[data-testid="sign-in-submit"]')
    await page.selectOption('[data-testid="state-selector"]', 'California')
    
    // Start recording
    await page.click('[data-testid="record-audio-button"]')
    await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible()
    
    // Stop recording
    await page.click('[data-testid="stop-recording-button"]')
    await expect(page.locator('[data-testid="save-recording-button"]')).toBeVisible()
    
    // Save recording
    await page.click('[data-testid="save-recording-button"]')
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
  })
})

test.describe('Subscription Flow', () => {
  test('user can upgrade to pro', async ({ page }) => {
    await page.goto('/')
    
    // Sign in
    await page.click('[data-testid="auth-button"]')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'testpassword123')
    await page.click('[data-testid="sign-in-submit"]')
    
    // Open subscription modal
    await page.click('[data-testid="upgrade-button"]')
    await expect(page.locator('[data-testid="subscription-modal"]')).toBeVisible()
    
    // Upgrade to pro (mock)
    await page.click('[data-testid="upgrade-to-pro-button"]')
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
  })
})
```

## 📱 Mobile Testing

### Responsive Design Tests

```javascript
// e2e/mobile.spec.js
import { test, expect, devices } from '@playwright/test'

test.describe('Mobile Responsiveness', () => {
  test('app works on mobile devices', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
    })
    const page = await context.newPage()
    
    await page.goto('/')
    
    // Check mobile layout
    await expect(page.locator('[data-testid="mobile-header"]')).toBeVisible()
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible()
    
    // Test touch interactions
    await page.tap('[data-testid="state-selector"]')
    await expect(page.locator('[data-testid="state-dropdown"]')).toBeVisible()
    
    await context.close()
  })

  test('recording works on mobile', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
      permissions: ['microphone']
    })
    const page = await context.newPage()
    
    await page.goto('/')
    
    // Test mobile recording interface
    await page.tap('[data-testid="record-fab"]')
    await expect(page.locator('[data-testid="recording-modal"]')).toBeVisible()
    
    await context.close()
  })
})
```

## 🔍 Performance Testing

### Lighthouse CI

```bash
npm install --save-dev @lhci/cli
```

Create `lighthouserc.js`:

```javascript
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:5173'],
      startServerCommand: 'npm run dev',
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
```

### Load Testing

```javascript
// scripts/load-test.js
import { check } from 'k6'
import http from 'k6/http'

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
}

export default function () {
  let response = http.get('https://your-domain.com')
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })
}
```

## 🚨 Error Testing

### Error Boundary Testing

```javascript
// src/components/__tests__/ErrorBoundary.test.jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ErrorBoundary from '../ErrorBoundary'

// Component that throws an error
function ThrowError({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  it('catches and displays errors', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument()
    
    consoleSpy.mockRestore()
  })

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('No error')).toBeInTheDocument()
  })
})
```

## 📊 Test Coverage

### Coverage Configuration

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui"
  }
}
```

### Coverage Thresholds

Add to `vitest.config.js`:

```javascript
export default defineConfig({
  test: {
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
})
```

## 🔄 Continuous Testing

### GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/coverage-final.json
    
    - name: Run E2E tests
      run: |
        npm run build
        npx playwright test
    
    - name: Upload E2E test results
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: playwright-report
        path: playwright-report/
```

## 📋 Testing Checklist

### Pre-Release Testing

- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass on all browsers
- [ ] Mobile responsiveness verified
- [ ] Performance benchmarks met
- [ ] Accessibility standards met
- [ ] Error handling tested
- [ ] Security vulnerabilities scanned
- [ ] Load testing completed
- [ ] Database migrations tested
- [ ] API rate limits tested
- [ ] Subscription flows tested
- [ ] Recording functionality tested
- [ ] AI script generation tested
- [ ] File upload/download tested

### Manual Testing Scenarios

1. **New User Journey**
   - Sign up with email
   - Verify email (if enabled)
   - Select state
   - View rights information
   - Generate first script
   - Record audio/video
   - View incident history

2. **Subscription Journey**
   - Reach free tier limit
   - Upgrade to Pro
   - Test unlimited features
   - Cancel subscription
   - Verify downgrade

3. **Error Scenarios**
   - Network offline
   - API failures
   - Invalid inputs
   - Browser permissions denied
   - Storage quota exceeded

4. **Cross-Browser Testing**
   - Chrome (latest)
   - Firefox (latest)
   - Safari (latest)
   - Edge (latest)
   - Mobile browsers

---

This testing guide ensures comprehensive coverage of RightsGuard AI functionality across all platforms and scenarios.
