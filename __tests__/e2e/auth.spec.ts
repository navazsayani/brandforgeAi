import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display login and signup options on homepage', async ({ page }) => {
    // Check that the main branding is visible
    await expect(page.getByText('BrandForge AI')).toBeVisible()
    await expect(page.getByText('AI-Powered Branding')).toBeVisible()

    // Check that auth buttons are present
    await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible()
  })

  test('should show login form when login button is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'Log In' }).click()

    // Check for login form elements
    await expect(page.getByPlaceholder('Email')).toBeVisible()
    await expect(page.getByPlaceholder('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible()
  })

  test('should show signup form when signup button is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign Up' }).click()

    // Check for signup form elements
    await expect(page.getByPlaceholder('Email')).toBeVisible()
    await expect(page.getByPlaceholder('Password')).toBeVisible()
    await expect(page.getByPlaceholder('Confirm Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign up with Google' })).toBeVisible()
  })

  test('should validate email format in login form', async ({ page }) => {
    await page.getByRole('button', { name: 'Log In' }).click()

    // Enter invalid email
    await page.getByPlaceholder('Email').fill('invalid-email')
    await page.getByPlaceholder('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign In' }).click()

    // Check for validation error
    await expect(page.getByText('Please enter a valid email address')).toBeVisible()
  })

  test('should validate password requirements in signup form', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign Up' }).click()

    // Enter valid email but weak password
    await page.getByPlaceholder('Email').fill('test@example.com')
    await page.getByPlaceholder('Password').fill('123')
    await page.getByPlaceholder('Confirm Password').fill('123')
    await page.getByRole('button', { name: 'Create Account' }).click()

    // Check for password validation error
    await expect(page.getByText('Password must be at least 6 characters')).toBeVisible()
  })

  test('should validate password confirmation in signup form', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign Up' }).click()

    // Enter mismatched passwords
    await page.getByPlaceholder('Email').fill('test@example.com')
    await page.getByPlaceholder('Password').fill('password123')
    await page.getByPlaceholder('Confirm Password').fill('different123')
    await page.getByRole('button', { name: 'Create Account' }).click()

    // Check for password mismatch error
    await expect(page.getByText('Passwords do not match')).toBeVisible()
  })

  test('should handle login with invalid credentials', async ({ page }) => {
    await page.getByRole('button', { name: 'Log In' }).click()

    // Enter invalid credentials
    await page.getByPlaceholder('Email').fill('nonexistent@example.com')
    await page.getByPlaceholder('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign In' }).click()

    // Check for error message
    await expect(page.getByText('Invalid email or password')).toBeVisible()
  })

  test('should redirect to dashboard after successful login', async ({ page }) => {
    // Mock successful authentication
    await page.route('**/auth/**', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              uid: 'test-user-123',
              email: 'test@example.com',
              displayName: 'Test User'
            }
          })
        })
      } else {
        await route.continue()
      }
    })

    await page.getByRole('button', { name: 'Log In' }).click()
    await page.getByPlaceholder('Email').fill('test@example.com')
    await page.getByPlaceholder('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign In' }).click()

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('should show loading state during authentication', async ({ page }) => {
    // Delay the auth response to test loading state
    await page.route('**/auth/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.continue()
    })

    await page.getByRole('button', { name: 'Log In' }).click()
    await page.getByPlaceholder('Email').fill('test@example.com')
    await page.getByPlaceholder('Password').fill('password123')
    await page.getByRole('button', { name: 'Sign In' }).click()

    // Check for loading indicator
    await expect(page.getByText('Signing in...')).toBeVisible()
  })

  test('should allow switching between login and signup forms', async ({ page }) => {
    // Start with login
    await page.getByRole('button', { name: 'Log In' }).click()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()

    // Switch to signup
    await page.getByText('Need an account? Sign up').click()
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible()

    // Switch back to login
    await page.getByText('Already have an account? Sign in').click()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })
})

test.describe('Authenticated User Experience', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated state
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-user', JSON.stringify({
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User'
      }))
    })
    await page.goto('/dashboard')
  })

  test('should display navigation menu for authenticated users', async ({ page }) => {
    await expect(page.getByText('Dashboard')).toBeVisible()
    await expect(page.getByText('Brand Profile')).toBeVisible()
    await expect(page.getByText('Content Studio')).toBeVisible()
    await expect(page.getByText('Campaign Manager')).toBeVisible()
    await expect(page.getByText('Image Library')).toBeVisible()
    await expect(page.getByText('Deployment Hub')).toBeVisible()
    await expect(page.getByText('Pricing')).toBeVisible()
    await expect(page.getByText('Settings')).toBeVisible()
  })

  test('should display user avatar and dropdown', async ({ page }) => {
    // Check for user avatar
    await expect(page.locator('[data-testid="avatar"]')).toBeVisible()
    
    // Click on avatar to open dropdown
    await page.locator('[data-testid="avatar"]').click()
    
    // Check dropdown content
    await expect(page.getByText('test@example.com')).toBeVisible()
    await expect(page.getByText('Log out')).toBeVisible()
  })

  test('should logout when logout button is clicked', async ({ page }) => {
    // Open user dropdown
    await page.locator('[data-testid="avatar"]').click()
    
    // Click logout
    await page.getByText('Log out').click()
    
    // Should redirect to home page
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible()
  })

  test('should highlight active navigation item', async ({ page }) => {
    // Check that Dashboard is active
    const dashboardLink = page.getByText('Dashboard').locator('..')
    await expect(dashboardLink).toHaveClass(/active/)

    // Navigate to Brand Profile
    await page.getByText('Brand Profile').click()
    await expect(page).toHaveURL('/brand-profile')
    
    const brandProfileLink = page.getByText('Brand Profile').locator('..')
    await expect(brandProfileLink).toHaveClass(/active/)
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Check for mobile menu trigger
    await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeVisible()

    // Open mobile menu
    await page.getByRole('button', { name: 'Open navigation menu' }).click()

    // Check that navigation items are visible in mobile menu
    await expect(page.getByText('Dashboard')).toBeVisible()
    await expect(page.getByText('Brand Profile')).toBeVisible()
  })
})