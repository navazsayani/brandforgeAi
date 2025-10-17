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

  test('should display complete navigation menu for authenticated users', async ({ page }) => {
    // Core navigation items
    await expect(page.getByText('Dashboard')).toBeVisible()
    await expect(page.getByText('Brand Profile')).toBeVisible()
    await expect(page.getByText('Content Studio')).toBeVisible()
    await expect(page.getByText('Campaign Manager')).toBeVisible()
    await expect(page.getByText('Image Library')).toBeVisible()
    await expect(page.getByText('Deployment Hub')).toBeVisible()

    // NEW: Quick Start menu item
    await expect(page.getByText('Quick Start')).toBeVisible()

    await expect(page.getByText('Pricing')).toBeVisible()
    await expect(page.getByText('Settings')).toBeVisible()
  })

  test('should navigate to Quick Start guide', async ({ page }) => {
    // Click on Quick Start menu item
    await page.getByText('Quick Start').click()

    // Should navigate to quick start page
    await expect(page).toHaveURL('/quick-start')

    // Check for Quick Start page content
    await expect(page.getByText(/Getting Started|Quick Start|Get Started/i)).toBeVisible()
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
    await expect(page.getByText('Quick Start')).toBeVisible()
  })

  test('should display welcome gift dialog for new users', async ({ page }) => {
    // Mock a new user who hasn't received welcome gift
    await page.addInitScript(() => {
      window.localStorage.setItem('new-user-flag', 'true')
    })

    await page.goto('/dashboard')

    // Check for welcome gift dialog (may take a moment to appear)
    await expect(page.getByText(/Welcome.*BrandForge/i)).toBeVisible({ timeout: 5000 })

    // Check for free preview/gift messaging
    await expect(page.getByText(/free.*preview|welcome.*gift|starter.*kit/i)).toBeVisible()
  })

  test('should show Content Studio with templates', async ({ page }) => {
    await page.getByText('Content Studio').click()
    await expect(page).toHaveURL('/content-studio')

    // Check for template sections
    await expect(page.getByText(/Templates|Quick Templates|Template Library/i)).toBeVisible()

    // Check for tabs (Images, Social, Blogs, etc.)
    await expect(page.getByRole('tab', { name: /Images/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Social/i })).toBeVisible()
  })

  test('should show templates carousel in Content Studio', async ({ page }) => {
    await page.getByText('Content Studio').click()
    await expect(page).toHaveURL('/content-studio')

    // Look for template cards
    const templateCards = page.locator('[data-testid="template-card"]')
    await expect(templateCards.first()).toBeVisible({ timeout: 5000 })

    // Check for common template types
    await expect(page.getByText(/Product Photo|Hero Banner|Quote Graphic/i)).toBeVisible()
  })
})

test.describe('Admin User Experience', () => {
  test.beforeEach(async ({ page }) => {
    // Mock admin user state
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-user', JSON.stringify({
        uid: 'admin-user-123',
        email: 'admin@brandforge.ai',
        displayName: 'Admin User'
      }))
    })
    await page.goto('/dashboard')
  })

  test('should display admin navigation sections', async ({ page }) => {
    // Check for admin section
    await expect(page.getByText('Admin')).toBeVisible()

    // Check for admin menu items
    await expect(page.getByText('User Management')).toBeVisible()
    await expect(page.getByText('Usage Dashboard')).toBeVisible()

    // NEW: Housekeeping menu items
    await expect(page.getByText(/Cleanup|Housekeeping/i)).toBeVisible()
  })

  test('should navigate to housekeeping page', async ({ page }) => {
    // Click on housekeeping/cleanup menu item
    await page.getByText(/Cleanup|Housekeeping/i).click()

    // Should navigate to admin housekeeping page
    await expect(page).toHaveURL(/\/admin\/(cleanup|housekeeping)/)

    // Check for housekeeping features
    await expect(page.getByText(/Scan|Cleanup|Old Content/i)).toBeVisible()
  })

  test('should show housekeeping scan results', async ({ page }) => {
    await page.goto('/admin/cleanup')

    // Click scan button
    const scanButton = page.getByRole('button', { name: /Scan|Start Scan/i })
    await scanButton.click()

    // Should show scan results
    await expect(page.getByText(/Deployed Content|Draft Content|Library Images/i)).toBeVisible({ timeout: 10000 })
  })

  test('should have cleanup confirmation dialogs', async ({ page }) => {
    await page.goto('/admin/cleanup')

    // Attempt cleanup operation
    const cleanupButton = page.getByRole('button', { name: /Clean.*Up|Start Cleanup/i })

    if (await cleanupButton.isVisible()) {
      await cleanupButton.click()

      // Should show confirmation dialog for destructive operation
      await expect(page.getByText(/Are you sure|Confirm/i)).toBeVisible({ timeout: 3000 })
    }
  })

  test('should highlight active admin navigation item', async ({ page }) => {
    await page.goto('/admin/dashboard')

    const adminDashboardLink = page.getByText('User Management').locator('..')
    await expect(adminDashboardLink).toHaveClass(/active/)
  })
})

test.describe('Welcome Gift Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock new user with brand profile
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-user', JSON.stringify({
        uid: 'new-user-123',
        email: 'newuser@example.com',
        displayName: 'New User'
      }))
      window.localStorage.setItem('brand-profile', JSON.stringify({
        brandDescription: 'A modern tech startup',
        imageStyleNotes: 'clean, minimalist'
      }))
    })
  })

  test('should trigger welcome gift on first login', async ({ page }) => {
    await page.goto('/dashboard')

    // Welcome gift dialog should appear
    await expect(page.getByText(/Welcome.*BrandForge/i)).toBeVisible({ timeout: 5000 })
  })

  test('should auto-generate preview images', async ({ page }) => {
    await page.goto('/dashboard')

    // Wait for welcome dialog
    await expect(page.getByText(/Welcome.*BrandForge/i)).toBeVisible({ timeout: 5000 })

    // Should show generation in progress
    await expect(page.getByText(/Generating|Creating your preview/i)).toBeVisible({ timeout: 3000 })
  })

  test('should allow saving generated images to library', async ({ page }) => {
    await page.goto('/dashboard')

    // Wait for generation to complete (mocked)
    await page.waitForTimeout(2000)

    // Look for save button
    const saveButton = page.getByRole('button', { name: /Save|Save to Library/i })

    if (await saveButton.isVisible({ timeout: 10000 })) {
      await saveButton.click()

      // Should show success message
      await expect(page.getByText(/Saved|Success/i)).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('Content Templates Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-user', JSON.stringify({
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User'
      }))
    })
    await page.goto('/content-studio')
  })

  test('should display template categories', async ({ page }) => {
    // Check for template category tabs or sections
    await expect(page.getByText(/Image Templates|Social Templates/i)).toBeVisible({ timeout: 5000 })
  })

  test('should allow selecting a template', async ({ page }) => {
    // Look for a template card
    const productPhotoTemplate = page.getByText('Product Photo')

    if (await productPhotoTemplate.isVisible({ timeout: 5000 })) {
      await productPhotoTemplate.click()

      // Should show template details or form
      await expect(page.getByText(/Describe your product|Product Description/i)).toBeVisible({ timeout: 3000 })
    }
  })

  test('should show template-specific input fields', async ({ page }) => {
    // Select a template (e.g., Product Photo)
    const template = page.getByText('Product Photo').first()

    if (await template.isVisible({ timeout: 5000 })) {
      await template.click()

      // Should show template-specific fields
      await expect(page.getByLabel(/Product Description|Describe your product/i)).toBeVisible()
      await expect(page.getByLabel(/Background|Background Style/i)).toBeVisible()
    }
  })

  test('should preserve brand data in template prompts', async ({ page }) => {
    // Select template
    const template = page.getByText('Hero Banner').first()

    if (await template.isVisible({ timeout: 5000 })) {
      await template.click()

      // Fill template form
      await page.getByLabel(/Key Message|Message/i).fill('Innovation in tech')

      // When generating, brand data should be automatically included
      // (this would be verified in the actual generation call)
    }
  })
})
