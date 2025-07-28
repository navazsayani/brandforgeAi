import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { BrandProvider } from '@/contexts/BrandContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { User } from 'firebase/auth'
import { BrandData } from '@/types'

// Mock user for testing
export const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  phoneNumber: null,
  providerId: 'firebase',
  emailVerified: true,
  isAnonymous: false,
  metadata: {
    creationTime: '2023-01-01T00:00:00.000Z',
    lastSignInTime: '2023-01-01T00:00:00.000Z',
  },
  providerData: [],
  refreshToken: 'mock-refresh-token',
  tenantId: null,
  delete: jest.fn(),
  getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
  getIdTokenResult: jest.fn(),
  reload: jest.fn(),
  toJSON: jest.fn(),
} as unknown as User

// Mock admin user
export const mockAdminUser = {
  ...mockUser,
  uid: 'admin-user-123',
  email: 'admin@brandforge.ai',
  displayName: 'Admin User',
} as unknown as User

// Mock brand data
export const mockBrandData: BrandData = {
  brandName: 'Test Brand',
  websiteUrl: 'https://testbrand.com',
  brandDescription: 'A test brand for testing purposes',
  industry: 'Technology',
  imageStyleNotes: 'Modern and clean',
  targetKeywords: 'innovation, technology, modern',
  exampleImages: ['https://example.com/image1.jpg'],
  brandLogoUrl: 'https://example.com/logo.jpg',
  plan: 'free',
  userEmail: 'test@example.com',
  subscriptionEndDate: null,
}

// Mock premium brand data
export const mockPremiumBrandData: BrandData = {
  ...mockBrandData,
  plan: 'premium',
  subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: User | null
  brandData?: BrandData | null
  queryClient?: QueryClient
}

// Custom render function with providers
export function renderWithProviders(
  ui: ReactElement,
  {
    user = mockUser,
    brandData = mockBrandData,
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  // Mock the auth context
  const mockAuthContext = {
    user,
    currentUser: user,
    userId: user?.uid || null,
    isLoading: false,
    error: null,
    signUp: jest.fn(),
    logIn: jest.fn(),
    signInWithGoogle: jest.fn(),
    logOut: jest.fn(),
    setError: jest.fn(),
  }

  // Mock the brand context
  const mockBrandContext = {
    brandData,
    isLoading: false,
    error: null,
    updateBrandData: jest.fn(),
    refreshBrandData: jest.fn(),
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <BrandProvider>
              {children}
            </BrandProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    )
  }

  // Override the context values
  const authModule = require('@/contexts/AuthContext')
  const brandModule = require('@/contexts/BrandContext')
  jest.spyOn(authModule, 'useAuth').mockReturnValue(mockAuthContext)
  jest.spyOn(brandModule, 'useBrand').mockReturnValue(mockBrandContext)

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Helper to create form data
export function createFormData(data: Record<string, string | File>): FormData {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value)
  })
  return formData
}

// Helper to create mock file
export function createMockFile(name: string = 'test.jpg', type: string = 'image/jpeg'): File {
  return new File(['mock file content'], name, { type })
}

// Helper to wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock Firebase Timestamp
export const mockTimestamp = {
  toDate: () => new Date('2023-01-01T00:00:00.000Z'),
  seconds: 1672531200,
  nanoseconds: 0,
}

// Mock Firestore document
export function createMockDoc(id: string, data: any) {
  return {
    id,
    data: () => data,
    exists: () => true,
    ref: { id },
  }
}

// Mock Firestore collection
export function createMockCollection(docs: any[]) {
  return {
    docs,
    empty: docs.length === 0,
    size: docs.length,
    forEach: (callback: (doc: any) => void) => docs.forEach(callback),
  }
}

// Custom matchers
if (typeof expect !== 'undefined') {
  expect.extend({
    toBeValidBrandData(received: any) {
      const pass = received &&
        typeof received.brandName === 'string' &&
        typeof received.brandDescription === 'string' &&
        ['free', 'premium'].includes(received.plan)

      if (pass) {
        return {
          message: () => `expected ${received} not to be valid brand data`,
          pass: true,
        }
      } else {
        return {
          message: () => `expected ${received} to be valid brand data`,
          pass: false,
        }
      }
    },

    toBeValidFormState(received: any) {
      const pass = received &&
        (received.data !== undefined || received.error !== undefined) &&
        typeof received === 'object'

      if (pass) {
        return {
          message: () => `expected ${received} not to be valid form state`,
          pass: true,
        }
      } else {
        return {
          message: () => `expected ${received} to be valid form state`,
          pass: false,
        }
      }
    },
  })
}

// Export everything for easy importing
export * from '@testing-library/react'
export { renderWithProviders as render }