# BrandForge AI Testing Suite

This document provides comprehensive information about the testing strategy, setup, and guidelines for the BrandForge AI application.

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Test Structure](#test-structure)
3. [Setup and Installation](#setup-and-installation)
4. [Running Tests](#running-tests)
5. [Writing Tests](#writing-tests)
6. [Mocking Strategy](#mocking-strategy)
7. [CI/CD Integration](#cicd-integration)
8. [Troubleshooting](#troubleshooting)

## Testing Strategy

Our testing approach follows the testing pyramid principle:

- **70% Unit Tests**: Fast, isolated tests for individual functions and components
- **20% Integration Tests**: Tests for component interactions and API integrations
- **10% End-to-End Tests**: Full user journey tests using Playwright

### Test Categories

#### Unit Tests (`__tests__/unit/`)
- **Utility Functions** (`lib/utils.test.ts`): Core utility functions
- **Server Actions** (`lib/actions.test.ts`): Next.js server actions
- **AI Flows** (`ai/flows/`): AI generation and processing logic
- **Components** (`components/`): React component behavior and rendering

#### Integration Tests (`__tests__/integration/`)
- **Authentication Flows**: Firebase Auth integration
- **Database Operations**: Firestore CRUD operations
- **API Endpoints**: Server-side API functionality
- **Context Providers**: React context integration

#### End-to-End Tests (`__tests__/e2e/`)
- **Authentication Journey**: Login, signup, logout flows
- **Brand Creation**: Complete brand setup workflow
- **Content Generation**: AI-powered content creation
- **Campaign Management**: Marketing campaign workflows

## Test Structure

```
__tests__/
├── README.md                 # This documentation
├── e2e/                     # Playwright E2E tests
│   ├── auth.spec.ts         # Authentication flows
│   └── brand-creation.spec.ts # Brand creation journey
├── integration/             # Integration tests
│   ├── auth.test.ts         # Authentication integration
│   └── firebase.test.ts     # Firebase integration
├── mocks/                   # Mock configurations
│   ├── handlers.ts          # MSW request handlers
│   └── server.ts            # MSW server setup
├── types/                   # TypeScript type definitions
│   └── jest.d.ts            # Jest type extensions
├── unit/                    # Unit tests
│   ├── ai/                  # AI flow tests
│   ├── components/          # Component tests
│   └── lib/                 # Utility and action tests
└── utils/                   # Test utilities
    └── test-utils.tsx       # React Testing Library setup
```

## Setup and Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project configured

### Installation

1. **Install dependencies** (already included in package.json):
   ```bash
   npm install
   ```

2. **Install Playwright browsers**:
   ```bash
   npm run playwright:install
   ```

3. **Environment Setup**:
   Create a `.env.test` file with test-specific environment variables:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=test-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=test-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=test-project
   FIREBASE_ADMIN_PRIVATE_KEY=test-private-key
   GEMINI_API_KEY=test-gemini-key
   FREEPIK_API_KEY=test-freepik-key
   ```

## Running Tests

### Available Scripts

```bash
# Run all unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test:all

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed

# CI/CD test run
npm run test:ci
```

### Test Execution Examples

```bash
# Run specific test file
npm test -- __tests__/unit/lib/utils.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should validate email"

# Run tests with verbose output
npm test -- --verbose

# Run E2E tests for specific browser
npx playwright test --project=chromium

# Run specific E2E test file
npx playwright test __tests__/e2e/auth.spec.ts
```

## Writing Tests

### Unit Test Example

```typescript
import { validateEmail } from '@/lib/utils'

describe('validateEmail', () => {
  test('should return true for valid email', () => {
    expect(validateEmail('test@example.com')).toBe(true)
  })

  test('should return false for invalid email', () => {
    expect(validateEmail('invalid-email')).toBe(false)
  })
})
```

### Component Test Example

```typescript
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  test('should render with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test'

test('should login successfully', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Log In' }).click()
  await page.getByPlaceholder('Email').fill('test@example.com')
  await page.getByPlaceholder('Password').fill('password123')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page).toHaveURL('/dashboard')
})
```

## Mocking Strategy

### Mock Service Worker (MSW)

We use MSW for API mocking in integration and unit tests:

```typescript
// __tests__/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      user: { id: '1', email: 'test@example.com' }
    })
  })
]
```

### Firebase Mocking

Firebase services are mocked using Jest mocks:

```typescript
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn()
}))
```

### AI Service Mocking

AI services are mocked to avoid external API calls during testing:

```typescript
jest.mock('@/ai/genkit', () => ({
  generate: jest.fn().mockResolvedValue({
    output: 'Generated content'
  })
}))
```

## Test Guidelines

### Best Practices

1. **Test Naming**: Use descriptive test names that explain the expected behavior
   ```typescript
   test('should display error message when login fails with invalid credentials')
   ```

2. **Arrange-Act-Assert**: Structure tests clearly
   ```typescript
   test('should calculate total with tax', () => {
     // Arrange
     const items = [10, 20, 30]
     const taxRate = 0.1
     
     // Act
     const result = calculateTotalWithTax(items, taxRate)
     
     // Assert
     expect(result).toBe(66)
   })
   ```

3. **Test Independence**: Each test should be independent and not rely on others
4. **Mock External Dependencies**: Mock APIs, databases, and external services
5. **Test Edge Cases**: Include tests for error conditions and edge cases

### What to Test

#### Unit Tests
- ✅ Pure functions and utilities
- ✅ Component rendering and props
- ✅ Event handlers and user interactions
- ✅ State management logic
- ✅ Form validation
- ✅ Error handling

#### Integration Tests
- ✅ API endpoint functionality
- ✅ Database operations
- ✅ Authentication flows
- ✅ Context provider behavior
- ✅ Component integration

#### E2E Tests
- ✅ Critical user journeys
- ✅ Authentication workflows
- ✅ Form submissions
- ✅ Navigation between pages
- ✅ Error scenarios
- ✅ Mobile responsiveness

### What Not to Test

- ❌ Third-party library internals
- ❌ Implementation details
- ❌ Trivial getters/setters
- ❌ Static content
- ❌ CSS styling (unless critical to functionality)

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
      - run: npx playwright install
      - run: npm run test:e2e
```

### Test Coverage

We aim for:
- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical paths covered
- **E2E Tests**: Main user journeys covered

Coverage reports are generated in `coverage/` directory.

## Troubleshooting

### Common Issues

#### TypeScript Errors in Tests
```bash
# Ensure Jest types are properly configured
npm install --save-dev @types/jest
```

#### MSW Not Working
```typescript
// Ensure MSW server is started in jest.setup.js
import { server } from './__tests__/mocks/server'
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

#### Playwright Tests Failing
```bash
# Update browsers
npx playwright install

# Run with debug mode
npx playwright test --debug

# Check if dev server is running
npm run dev
```

#### Firebase Auth Errors
```typescript
// Mock Firebase Auth properly
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  signInWithEmailAndPassword: jest.fn(),
  onAuthStateChanged: jest.fn()
}))
```

### Debug Commands

```bash
# Run tests with debug output
npm test -- --verbose --no-cache

# Run single test file with debugging
npm test -- --testNamePattern="specific test" --verbose

# Playwright debug mode
npx playwright test --debug --project=chromium

# Generate Playwright test report
npx playwright show-report
```

## Performance Testing

### Load Testing
For performance testing, consider using:
- **Artillery.js** for API load testing
- **Lighthouse CI** for performance metrics
- **Bundle Analyzer** for bundle size monitoring

### Example Artillery Config
```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Brand creation flow"
    requests:
      - get:
          url: "/api/brands"
```

## Accessibility Testing

### Automated A11y Testing
```typescript
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

test('should not have accessibility violations', async () => {
  const { container } = render(<MyComponent />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

## Contributing

When adding new features:

1. **Write tests first** (TDD approach recommended)
2. **Ensure all tests pass** before submitting PR
3. **Maintain test coverage** above 80%
4. **Update documentation** if adding new test patterns
5. **Review test performance** - keep tests fast and reliable

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [MSW Documentation](https://mswjs.io/docs/)
- [Firebase Testing](https://firebase.google.com/docs/emulator-suite)

---

For questions or issues with the testing setup, please refer to this documentation or reach out to the development team.