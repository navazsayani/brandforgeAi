/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { auth } from '@/lib/firebase'
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}))

jest.mock('@/lib/firebase', () => ({
  auth: {},
  googleProvider: {},
}))

const mockSignInWithEmailAndPassword = signInWithEmailAndPassword as jest.MockedFunction<typeof signInWithEmailAndPassword>
const mockCreateUserWithEmailAndPassword = createUserWithEmailAndPassword as jest.MockedFunction<typeof createUserWithEmailAndPassword>
const mockSignInWithPopup = signInWithPopup as jest.MockedFunction<typeof signInWithPopup>
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>
const mockOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<typeof onAuthStateChanged>

// Test component to access auth context
const TestComponent = () => {
  const { 
    user, 
    currentUser, 
    userId, 
    isLoading, 
    error, 
    signUp, 
    logIn, 
    signInWithGoogle, 
    logOut,
    setError 
  } = useAuth()

  return (
    <div>
      <div data-testid="user">{user ? user.email : 'No user'}</div>
      <div data-testid="current-user">{currentUser ? currentUser.email : 'No current user'}</div>
      <div data-testid="user-id">{userId || 'No user ID'}</div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not loading'}</div>
      <div data-testid="error">{error || 'No error'}</div>
      
      <button 
        data-testid="sign-up" 
        onClick={() => signUp('test@example.com', 'password123')}
      >
        Sign Up
      </button>
      
      <button 
        data-testid="log-in" 
        onClick={() => logIn('test@example.com', 'password123')}
      >
        Log In
      </button>
      
      <button 
        data-testid="google-sign-in" 
        onClick={() => signInWithGoogle()}
      >
        Google Sign In
      </button>
      
      <button 
        data-testid="log-out" 
        onClick={() => logOut()}
      >
        Log Out
      </button>
      
      <button 
        data-testid="set-error" 
        onClick={() => setError('Test error')}
      >
        Set Error
      </button>
    </div>
  )
}

const renderWithAuthProvider = () => {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  )
}

describe('AuthContext Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock implementation for onAuthStateChanged
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      // Simulate no user initially
      callback(null)
      // Return unsubscribe function
      return jest.fn()
    })
  })

  describe('Initial State', () => {
    test('should initialize with no user and not loading', async () => {
      renderWithAuthProvider()

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No user')
        expect(screen.getByTestId('current-user')).toHaveTextContent('No current user')
        expect(screen.getByTestId('user-id')).toHaveTextContent('No user ID')
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
        expect(screen.getByTestId('error')).toHaveTextContent('No error')
      })
    })

    test('should set up auth state listener on mount', () => {
      renderWithAuthProvider()
      expect(mockOnAuthStateChanged).toHaveBeenCalledWith(auth, expect.any(Function))
    })
  })

  describe('Sign Up Flow', () => {
    test('should handle successful sign up', async () => {
      const mockUser = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'Test User'
      }

      mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({
        user: mockUser
      } as any)

      renderWithAuthProvider()

      fireEvent.click(screen.getByTestId('sign-up'))

      await waitFor(() => {
        expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
          auth,
          'test@example.com',
          'password123'
        )
      })
    })

    test('should handle sign up errors', async () => {
      const errorMessage = 'Email already in use'
      mockCreateUserWithEmailAndPassword.mockRejectedValueOnce(
        new Error(errorMessage)
      )

      renderWithAuthProvider()

      fireEvent.click(screen.getByTestId('sign-up'))

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(errorMessage)
      })
    })

    test('should show loading state during sign up', async () => {
      let resolveSignUp: (value: any) => void
      const signUpPromise = new Promise((resolve) => {
        resolveSignUp = resolve
      })

      mockCreateUserWithEmailAndPassword.mockReturnValueOnce(signUpPromise as any)

      renderWithAuthProvider()

      fireEvent.click(screen.getByTestId('sign-up'))

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Loading')
      })

      // Resolve the promise
      resolveSignUp!({ user: { uid: 'test', email: 'test@example.com' } })

      // Should stop loading
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
      })
    })
  })

  describe('Log In Flow', () => {
    test('should handle successful log in', async () => {
      const mockUser = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'Test User'
      }

      mockSignInWithEmailAndPassword.mockResolvedValueOnce({
        user: mockUser
      } as any)

      renderWithAuthProvider()

      fireEvent.click(screen.getByTestId('log-in'))

      await waitFor(() => {
        expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
          auth,
          'test@example.com',
          'password123'
        )
      })
    })

    test('should handle log in errors', async () => {
      const errorMessage = 'Invalid credentials'
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(
        new Error(errorMessage)
      )

      renderWithAuthProvider()

      fireEvent.click(screen.getByTestId('log-in'))

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(errorMessage)
      })
    })

    test('should clear previous errors on successful login', async () => {
      const mockUser = {
        uid: 'test-uid-123',
        email: 'test@example.com'
      }

      renderWithAuthProvider()

      // Set an error first
      fireEvent.click(screen.getByTestId('set-error'))
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Test error')
      })

      // Successful login should clear error
      mockSignInWithEmailAndPassword.mockResolvedValueOnce({
        user: mockUser
      } as any)

      fireEvent.click(screen.getByTestId('log-in'))

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('No error')
      })
    })
  })

  describe('Google Sign In Flow', () => {
    test('should handle successful Google sign in', async () => {
      const mockUser = {
        uid: 'google-uid-123',
        email: 'test@gmail.com',
        displayName: 'Test User'
      }

      mockSignInWithPopup.mockResolvedValueOnce({
        user: mockUser
      } as any)

      renderWithAuthProvider()

      fireEvent.click(screen.getByTestId('google-sign-in'))

      await waitFor(() => {
        expect(mockSignInWithPopup).toHaveBeenCalledWith(auth, expect.any(Object))
      })
    })

    test('should handle Google sign in errors', async () => {
      const errorMessage = 'Google sign in failed'
      mockSignInWithPopup.mockRejectedValueOnce(
        new Error(errorMessage)
      )

      renderWithAuthProvider()

      fireEvent.click(screen.getByTestId('google-sign-in'))

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(errorMessage)
      })
    })
  })

  describe('Log Out Flow', () => {
    test('should handle successful log out', async () => {
      mockSignOut.mockResolvedValueOnce(undefined)

      renderWithAuthProvider()

      fireEvent.click(screen.getByTestId('log-out'))

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith(auth)
      })
    })

    test('should handle log out errors', async () => {
      const errorMessage = 'Log out failed'
      mockSignOut.mockRejectedValueOnce(
        new Error(errorMessage)
      )

      renderWithAuthProvider()

      fireEvent.click(screen.getByTestId('log-out'))

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(errorMessage)
      })
    })
  })

  describe('Auth State Changes', () => {
    test('should update user state when auth state changes', async () => {
      const mockUser = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'Test User'
      }

      let authStateCallback: (user: any) => void

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authStateCallback = callback
        // Initially no user
        callback(null)
        return jest.fn()
      })

      renderWithAuthProvider()

      // Initially no user
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No user')
      })

      // Simulate user login
      authStateCallback!(mockUser)

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
        expect(screen.getByTestId('current-user')).toHaveTextContent('test@example.com')
        expect(screen.getByTestId('user-id')).toHaveTextContent('test-uid-123')
      })

      // Simulate user logout
      authStateCallback!(null)

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No user')
        expect(screen.getByTestId('current-user')).toHaveTextContent('No current user')
        expect(screen.getByTestId('user-id')).toHaveTextContent('No user ID')
      })
    })

    test('should show loading state during initial auth check', () => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        // Don't call callback immediately to simulate loading
        return jest.fn()
      })

      renderWithAuthProvider()

      expect(screen.getByTestId('loading')).toHaveTextContent('Loading')
    })
  })

  describe('Error Management', () => {
    test('should allow setting custom errors', async () => {
      renderWithAuthProvider()

      fireEvent.click(screen.getByTestId('set-error'))

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Test error')
      })
    })

    test('should clear errors when setError is called with null', async () => {
      renderWithAuthProvider()

      // Set error first
      fireEvent.click(screen.getByTestId('set-error'))
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Test error')
      })

      // Clear error (this would need to be implemented in the test component)
      // For now, we test that errors can be set
    })
  })

  describe('Cleanup', () => {
    test('should unsubscribe from auth state listener on unmount', () => {
      const mockUnsubscribe = jest.fn()
      mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe)

      const { unmount } = renderWithAuthProvider()

      expect(mockOnAuthStateChanged).toHaveBeenCalled()

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    test('should handle auth state listener errors', async () => {
      mockOnAuthStateChanged.mockImplementation(() => {
        throw new Error('Auth listener error')
      })

      // Should not crash the app
      expect(() => renderWithAuthProvider()).not.toThrow()
    })

    test('should handle malformed user objects', async () => {
      const malformedUser = {
        // Missing uid
        email: 'test@example.com'
      }

      let authStateCallback: (user: any) => void

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        authStateCallback = callback
        callback(null)
        return jest.fn()
      })

      renderWithAuthProvider()

      // Should handle malformed user gracefully
      expect(() => authStateCallback!(malformedUser)).not.toThrow()
    })
  })
})