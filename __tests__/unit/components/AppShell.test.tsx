/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { AppShell } from '@/components/AppShell'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

// Mock auth context
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

// Mock theme context
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: jest.fn().mockReturnValue({
    theme: 'light',
    setTheme: jest.fn(),
  }),
}))

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: any) => <div data-testid="sheet">{children}</div>,
  SheetContent: ({ children }: any) => <div data-testid="sheet-content">{children}</div>,
  SheetHeader: ({ children }: any) => <div data-testid="sheet-header">{children}</div>,
  SheetTitle: ({ children }: any) => <h2 data-testid="sheet-title">{children}</h2>,
  SheetTrigger: ({ children }: any) => <div data-testid="sheet-trigger">{children}</div>,
}))

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <div data-testid="dropdown-item" onClick={onClick}>{children}</div>
  ),
  DropdownMenuLabel: ({ children }: any) => <div data-testid="dropdown-label">{children}</div>,
  DropdownMenuSeparator: () => <hr data-testid="dropdown-separator" />,
  DropdownMenuTrigger: ({ children }: any) => <div data-testid="dropdown-trigger">{children}</div>,
}))

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: any) => <div className={className} data-testid="avatar">{children}</div>,
  AvatarFallback: ({ children }: any) => <div data-testid="avatar-fallback">{children}</div>,
  AvatarImage: ({ src, alt }: any) => <img src={src} alt={alt} data-testid="avatar-image" />,
}))

jest.mock('@/components/ThemeToggle', () => ({
  CompactThemeToggle: () => <button data-testid="theme-toggle">Toggle Theme</button>,
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe('AppShell', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/dashboard')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        currentUser: null,
        userId: null,
        isLoading: false,
        error: null,
        signUp: jest.fn(),
        logIn: jest.fn(),
        signInWithGoogle: jest.fn(),
        logOut: jest.fn(),
        setError: jest.fn(),
      })
    })

    test('should render login and signup buttons for unauthenticated users', () => {
      render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      )

      expect(screen.getByText('Log In')).toBeInTheDocument()
      expect(screen.getByText('Sign Up')).toBeInTheDocument()
    })

    test('should not render navigation menu for unauthenticated users', () => {
      render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      )

      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
      expect(screen.queryByText('Brand Profile')).not.toBeInTheDocument()
    })

    test('should render brand logo and title', () => {
      render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      )

      expect(screen.getByText('BrandForge AI')).toBeInTheDocument()
      expect(screen.getByText('AI-Powered Branding')).toBeInTheDocument()
    })
  })

  describe('Authenticated State', () => {
    const mockUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null,
    }

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser as any,
        currentUser: mockUser as any,
        userId: 'test-user-123',
        isLoading: false,
        error: null,
        signUp: jest.fn(),
        logIn: jest.fn(),
        signInWithGoogle: jest.fn(),
        logOut: jest.fn(),
        setError: jest.fn(),
      })
    })

    test('should render navigation menu for authenticated users', () => {
      render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      )

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Brand Profile')).toBeInTheDocument()
      expect(screen.getByText('Content Studio')).toBeInTheDocument()
      expect(screen.getByText('Campaign Manager')).toBeInTheDocument()
      expect(screen.getByText('Image Library')).toBeInTheDocument()
      expect(screen.getByText('Deployment Hub')).toBeInTheDocument()
      // NEW: Quick Start menu item
      expect(screen.getByText('Quick Start')).toBeInTheDocument()
      expect(screen.getByText('Pricing')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    test('should highlight active navigation item', () => {
      mockUsePathname.mockReturnValue('/brand-profile')
      
      render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      )

      const brandProfileLink = screen.getByText('Brand Profile').closest('a')
      expect(brandProfileLink).toHaveClass('active')
    })

    test('should render user avatar with fallback', () => {
      render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      )

      expect(screen.getByTestId('avatar')).toBeInTheDocument()
      expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument()
      expect(screen.getByText('T')).toBeInTheDocument() // First letter of email
    })

    test('should render user avatar with photo when available', () => {
      const userWithPhoto = {
        ...mockUser,
        photoURL: 'https://example.com/photo.jpg',
      }

      mockUseAuth.mockReturnValue({
        user: userWithPhoto as any,
        currentUser: userWithPhoto as any,
        userId: 'test-user-123',
        isLoading: false,
        error: null,
        signUp: jest.fn(),
        logIn: jest.fn(),
        signInWithGoogle: jest.fn(),
        logOut: jest.fn(),
        setError: jest.fn(),
      })

      render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      )

      expect(screen.getByTestId('avatar-image')).toBeInTheDocument()
      expect(screen.getByTestId('avatar-image')).toHaveAttribute('src', 'https://example.com/photo.jpg')
    })

    test('should render user dropdown menu', () => {
      render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      )

      expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    test('should call logout when logout menu item is clicked', () => {
      const mockLogOut = jest.fn()
      mockUseAuth.mockReturnValue({
        user: mockUser as any,
        currentUser: mockUser as any,
        userId: 'test-user-123',
        isLoading: false,
        error: null,
        signUp: jest.fn(),
        logIn: jest.fn(),
        signInWithGoogle: jest.fn(),
        logOut: mockLogOut,
        setError: jest.fn(),
      })

      render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      )

      const logoutButton = screen.getByText('Log out')
      fireEvent.click(logoutButton)

      expect(mockLogOut).toHaveBeenCalled()
    })
  })

  describe('Admin User State', () => {
    const mockAdminUser = {
      uid: 'admin-user-123',
      email: 'admin@brandforge.ai',
      displayName: 'Admin User',
      photoURL: null,
    }

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockAdminUser as any,
        currentUser: mockAdminUser as any,
        userId: 'admin-user-123',
        isLoading: false,
        error: null,
        signUp: jest.fn(),
        logIn: jest.fn(),
        signInWithGoogle: jest.fn(),
        logOut: jest.fn(),
        setError: jest.fn(),
      })
    })

    test('should render admin navigation sections for admin users', () => {
      render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      )

      expect(screen.getByText('Admin')).toBeInTheDocument()
      expect(screen.getByText('User Management')).toBeInTheDocument()
      expect(screen.getByText('Usage Dashboard')).toBeInTheDocument()
      // NEW: Check for housekeeping/cleanup menu items
      expect(screen.getByText(/Cleanup|Housekeeping/i)).toBeInTheDocument()
    })

    test('should highlight active admin navigation item', () => {
      mockUsePathname.mockReturnValue('/admin/dashboard')

      render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      )

      const adminDashboardLink = screen.getByText('User Management').closest('a')
      expect(adminDashboardLink).toHaveClass('active')
    })

    test('should navigate to housekeeping page', () => {
      mockUsePathname.mockReturnValue('/admin/cleanup')

      render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      )

      const housekeepingLink = screen.getByText(/Cleanup|Housekeeping/i).closest('a')
      expect(housekeepingLink).toHaveAttribute('href', '/admin/cleanup')
    })

    test('should highlight housekeeping when on cleanup page', () => {
      mockUsePathname.mockReturnValue('/admin/cleanup')

      render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      )

      const housekeepingLink = screen.getByText(/Cleanup|Housekeeping/i).closest('a')
      expect(housekeepingLink).toHaveClass(/active/)
    })
  })

  describe('Loading State', () => {
    test('should render loading skeleton when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        currentUser: null,
        userId: null,
        isLoading: true,
        error: null,
        signUp: jest.fn(),
        logIn: jest.fn(),
        signInWithGoogle: jest.fn(),
        logOut: jest.fn(),
        setError: jest.fn(),
      })

      render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      )

      // Should render a loading placeholder for the user menu
      expect(screen.getByTestId('avatar')).toBeInTheDocument()
    })
  })

  describe('Mobile Navigation', () => {
    test('should render mobile menu trigger', () => {
      render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      )

      expect(screen.getByTestId('sheet-trigger')).toBeInTheDocument()
      expect(screen.getByText('Open navigation menu')).toBeInTheDocument()
    })

    test('should render mobile navigation content', () => {
      mockUseAuth.mockReturnValue({
        user: {
          uid: 'test-user-123',
          email: 'test@example.com',
          displayName: 'Test User',
        } as any,
        currentUser: null,
        userId: 'test-user-123',
        isLoading: false,
        error: null,
        signUp: jest.fn(),
        logIn: jest.fn(),
        signInWithGoogle: jest.fn(),
        logOut: jest.fn(),
        setError: jest.fn(),
      })

      render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      )

      expect(screen.getByTestId('sheet-content')).toBeInTheDocument()
      expect(screen.getByTestId('sheet-title')).toBeInTheDocument()
    })
  })

  describe('Theme Integration', () => {
    test('should render theme toggle button', () => {
      render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      )

      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
    })
  })

  describe('Content Rendering', () => {
    test('should render children content', () => {
      render(
        <AppShell>
          <div data-testid="test-content">Test Content</div>
        </AppShell>
      )

      expect(screen.getByTestId('test-content')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    test('should apply proper layout classes', () => {
      render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      )

      // Check for main layout structure
      const mainElement = screen.getByRole('main')
      expect(mainElement).toBeInTheDocument()
      expect(mainElement).toHaveClass('flex-1')
    })
  })

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      )

      expect(screen.getByText('Open navigation menu')).toBeInTheDocument()
      expect(screen.getByTestId('sheet-title')).toBeInTheDocument()
    })

    test('should be keyboard navigable', () => {
      mockUseAuth.mockReturnValue({
        user: {
          uid: 'test-user-123',
          email: 'test@example.com',
        } as any,
        currentUser: null,
        userId: 'test-user-123',
        isLoading: false,
        error: null,
        signUp: jest.fn(),
        logIn: jest.fn(),
        signInWithGoogle: jest.fn(),
        logOut: jest.fn(),
        setError: jest.fn(),
      })

      render(
        <AppShell>
          <div>Test Content</div>
        </AppShell>
      )

      const dashboardLink = screen.getByText('Dashboard')
      expect(dashboardLink.closest('a')).toHaveAttribute('href', '/dashboard')
    })
  })
})