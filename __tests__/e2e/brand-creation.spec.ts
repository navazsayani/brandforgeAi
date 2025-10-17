import { test, expect } from '@playwright/test'

test.describe('Brand Creation Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated state
    await page.addInitScript(() => {
      window.localStorage.setItem('auth-user', JSON.stringify({
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User'
      }))
    })
    
    // Mock API responses
    await page.route('**/api/brands/**', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'brand-123',
            name: 'Test Brand',
            description: 'A test brand for e-commerce',
            industry: 'E-commerce',
            targetAudience: 'Young professionals',
            createdAt: new Date().toISOString()
          })
        })
      } else {
        await route.continue()
      }
    })

    await page.route('**/api/ai/generate-images', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          generatedImages: [
            {
              url: 'https://example.com/image1.jpg',
              prompt: 'Modern e-commerce logo',
              provider: 'GEMINI'
            },
            {
              url: 'https://example.com/image2.jpg',
              prompt: 'Professional brand identity',
              provider: 'GEMINI'
            }
          ],
          providerUsed: 'GEMINI'
        })
      })
    })

    await page.goto('/brand-profile')
  })

  test('should create a new brand profile', async ({ page }) => {
    // Check if we're on the brand profile page
    await expect(page.getByText('Brand Profile')).toBeVisible()

    // Fill out brand information
    await page.getByPlaceholder('Enter your brand name').fill('Test Brand')
    await page.getByPlaceholder('Describe your brand').fill('A test brand for e-commerce')

    // Select industry
    await page.getByRole('combobox', { name: 'Industry' }).click()
    await page.getByText('E-commerce').click()

    // Fill target audience
    await page.getByPlaceholder('Describe your target audience').fill('Young professionals aged 25-35')

    // Fill brand values
    await page.getByPlaceholder('What values does your brand represent?').fill('Innovation, Quality, Sustainability')

    // Save brand profile
    await page.getByRole('button', { name: 'Save Brand Profile' }).click()

    // Check for success message
    await expect(page.getByText('Brand profile saved successfully')).toBeVisible()

    // NEW: Welcome gift should be triggered for new users
    await expect(page.getByText(/Welcome.*BrandForge/i)).toBeVisible({ timeout: 5000 })
  })

  test('should generate brand images using templates', async ({ page }) => {
    // Navigate to content studio
    await page.getByText('Content Studio').click()
    await expect(page).toHaveURL('/content-studio')

    // NEW: Check for template carousel
    await expect(page.getByText(/Templates|Quick Templates/i)).toBeVisible({ timeout: 5000 })

    // Select a template (e.g., Product Photo)
    const productTemplate = page.getByText('Product Photo').first()
    if (await productTemplate.isVisible({ timeout: 5000 })) {
      await productTemplate.click()

      // Fill template-specific fields
      await page.getByLabel(/Product Description|Describe your product/i).fill('Organic skincare product')
      await page.getByRole('combobox', { name: /Background/i }).click()
      await page.getByText('White/Clean').click()

      // Generate images using template
      await page.getByRole('button', { name: /Generate|Create/i }).click()

      // Check for loading state
      await expect(page.getByText(/Generating|Creating/i)).toBeVisible()

      // Wait for images to be generated
      await expect(page.getByText(/generated successfully|complete/i)).toBeVisible({ timeout: 15000 })
    } else {
      // Fallback to manual generation if templates not visible
      await page.getByPlaceholder('Describe the images you want to generate').fill('Modern logo for e-commerce brand')
      await page.getByRole('button', { name: /Generate/i }).click()
      await expect(page.getByText(/Generating|Creating/i)).toBeVisible()
    }
  })

  test('should save generated images to library', async ({ page }) => {
    // Navigate to content studio and generate images first
    await page.getByText('Content Studio').click()
    await page.getByPlaceholder('Describe the images you want to generate').fill('Brand logo')
    await page.getByRole('combobox', { name: 'Image Style' }).click()
    await page.getByText('Modern').click()
    await page.getByRole('button', { name: 'Generate Images' }).click()

    // Wait for generation to complete
    await expect(page.getByText('Images generated successfully')).toBeVisible()

    // Select images to save
    await page.locator('img[src*="example.com/image1.jpg"]').click()
    await page.locator('img[src*="example.com/image2.jpg"]').click()

    // Save to library
    await page.getByRole('button', { name: 'Save to Library' }).click()

    // Check for success message
    await expect(page.getByText('Images saved to library')).toBeVisible()

    // Navigate to image library
    await page.getByText('Image Library').click()
    await expect(page).toHaveURL('/image-library')

    // Check that saved images appear in library
    await expect(page.locator('img[src*="example.com/image1.jpg"]')).toBeVisible()
    await expect(page.locator('img[src*="example.com/image2.jpg"]')).toBeVisible()
  })

  test('should create a marketing campaign', async ({ page }) => {
    // Navigate to campaign manager
    await page.getByText('Campaign Manager').click()
    await expect(page).toHaveURL('/campaign-manager')

    // Create new campaign
    await page.getByRole('button', { name: 'Create Campaign' }).click()

    // Fill campaign details
    await page.getByPlaceholder('Campaign name').fill('Summer Sale 2024')
    await page.getByPlaceholder('Campaign description').fill('Promotional campaign for summer products')
    
    // Select campaign type
    await page.getByRole('combobox', { name: 'Campaign Type' }).click()
    await page.getByText('Social Media').click()

    // Set campaign dates
    await page.getByLabel('Start Date').fill('2024-06-01')
    await page.getByLabel('End Date').fill('2024-08-31')

    // Add campaign goals
    await page.getByPlaceholder('Campaign goals').fill('Increase brand awareness and drive sales')

    // Save campaign
    await page.getByRole('button', { name: 'Create Campaign' }).click()

    // Check for success message
    await expect(page.getByText('Campaign created successfully')).toBeVisible()

    // Verify campaign appears in list
    await expect(page.getByText('Summer Sale 2024')).toBeVisible()
  })

  test('should handle form validation errors', async ({ page }) => {
    // Try to save brand profile without required fields
    await page.getByRole('button', { name: 'Save Brand Profile' }).click()

    // Check for validation errors
    await expect(page.getByText('Brand name is required')).toBeVisible()
    await expect(page.getByText('Brand description is required')).toBeVisible()
    await expect(page.getByText('Industry is required')).toBeVisible()
  })

  test('should show loading states during API calls', async ({ page }) => {
    // Delay API response to test loading state
    await page.route('**/api/brands/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      await route.continue()
    })

    // Fill form and submit
    await page.getByPlaceholder('Enter your brand name').fill('Test Brand')
    await page.getByPlaceholder('Describe your brand').fill('A test brand')
    await page.getByRole('combobox', { name: 'Industry' }).click()
    await page.getByText('Technology').click()
    await page.getByRole('button', { name: 'Save Brand Profile' }).click()

    // Check for loading state
    await expect(page.getByText('Saving...')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save Brand Profile' })).toBeDisabled()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/brands/**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal server error'
        })
      })
    })

    // Fill form and submit
    await page.getByPlaceholder('Enter your brand name').fill('Test Brand')
    await page.getByPlaceholder('Describe your brand').fill('A test brand')
    await page.getByRole('combobox', { name: 'Industry' }).click()
    await page.getByText('Technology').click()
    await page.getByRole('button', { name: 'Save Brand Profile' }).click()

    // Check for error message
    await expect(page.getByText('Failed to save brand profile. Please try again.')).toBeVisible()
  })

  test('should navigate between different sections', async ({ page }) => {
    // Start at brand profile
    await expect(page.getByText('Brand Profile')).toBeVisible()

    // Navigate to content studio
    await page.getByText('Content Studio').click()
    await expect(page).toHaveURL('/content-studio')
    await expect(page.getByText('Generate Images')).toBeVisible()

    // Navigate to campaign manager
    await page.getByText('Campaign Manager').click()
    await expect(page).toHaveURL('/campaign-manager')
    await expect(page.getByText('Create Campaign')).toBeVisible()

    // Navigate to image library
    await page.getByText('Image Library').click()
    await expect(page).toHaveURL('/image-library')
    await expect(page.getByText('Your Images')).toBeVisible()

    // Navigate back to dashboard
    await page.getByText('Dashboard').click()
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText('Welcome to BrandForge AI')).toBeVisible()
  })

  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Open mobile menu
    await page.getByRole('button', { name: 'Open navigation menu' }).click()

    // Navigate to content studio via mobile menu
    await page.getByText('Content Studio').click()
    await expect(page).toHaveURL('/content-studio')

    // Check that content is properly displayed on mobile
    await expect(page.getByText('Generate Images')).toBeVisible()

    // Test form interaction on mobile
    await page.getByText('Generate Images').click()
    await page.getByPlaceholder('Describe the images you want to generate').fill('Mobile test')
    
    // Check that form elements are accessible on mobile
    await expect(page.getByRole('combobox', { name: 'Image Style' })).toBeVisible()
  })
})