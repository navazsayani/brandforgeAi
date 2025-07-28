import { decodeHtmlEntitiesInUrl, verifyImageUrlExists, cn } from '@/lib/utils'

// Mock fetch for testing
global.fetch = jest.fn()

describe('Utils', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('cn (className utility)', () => {
    test('should merge class names correctly', () => {
      const result = cn('base-class', 'additional-class')
      expect(result).toContain('base-class')
      expect(result).toContain('additional-class')
    })

    test('should handle conditional classes', () => {
      const result = cn('base-class', true && 'conditional-class', false && 'hidden-class')
      expect(result).toContain('base-class')
      expect(result).toContain('conditional-class')
      expect(result).not.toContain('hidden-class')
    })

    test('should handle undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'valid-class')
      expect(result).toContain('base-class')
      expect(result).toContain('valid-class')
    })

    test('should merge Tailwind classes correctly', () => {
      const result = cn('p-4 bg-red-500', 'p-2 bg-blue-500')
      // Should prioritize the last class when there are conflicts
      expect(result).toContain('p-2')
      expect(result).toContain('bg-blue-500')
      expect(result).not.toContain('p-4')
      expect(result).not.toContain('bg-red-500')
    })
  })

  describe('decodeHtmlEntitiesInUrl', () => {
    test('should decode HTML entities in URLs', () => {
      const encodedUrl = 'https://example.com/image.jpg?token=abc&amp;size=large&quot;test&quot;'
      const expectedUrl = 'https://example.com/image.jpg?token=abc&size=large"test"'
      
      const result = decodeHtmlEntitiesInUrl(encodedUrl)
      expect(result).toBe(expectedUrl)
    })

    test('should decode all supported HTML entities', () => {
      const encodedUrl = 'https://example.com?param1=value&amp;param2=&lt;test&gt;&quot;quoted&quot;&#39;single&#39;'
      const expectedUrl = 'https://example.com?param1=value&param2=<test>"quoted"\'single\''
      
      const result = decodeHtmlEntitiesInUrl(encodedUrl)
      expect(result).toBe(expectedUrl)
    })

    test('should handle URLs without HTML entities', () => {
      const normalUrl = 'https://example.com/image.jpg?size=large'
      
      const result = decodeHtmlEntitiesInUrl(normalUrl)
      expect(result).toBe(normalUrl)
    })

    test('should handle empty strings', () => {
      const result = decodeHtmlEntitiesInUrl('')
      expect(result).toBe('')
    })

    test('should handle Firebase Storage URLs with tokens', () => {
      const firebaseUrl = 'https://firebasestorage.googleapis.com/v0/b/bucket/o/image.jpg?alt=media&amp;token=abc123'
      const expectedUrl = 'https://firebasestorage.googleapis.com/v0/b/bucket/o/image.jpg?alt=media&token=abc123'
      
      const result = decodeHtmlEntitiesInUrl(firebaseUrl)
      expect(result).toBe(expectedUrl)
    })
  })

  describe('verifyImageUrlExists', () => {
    beforeEach(() => {
      // Reset fetch mock
      (global.fetch as jest.Mock).mockReset()
    })

    test('should return true for accessible image URLs', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      })

      const result = await verifyImageUrlExists('https://example.com/image.jpg')
      
      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/image.jpg',
        expect.objectContaining({
          method: 'HEAD',
          signal: expect.any(AbortSignal),
        })
      )
    })

    test('should return false for inaccessible image URLs', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      const result = await verifyImageUrlExists('https://example.com/nonexistent.jpg')
      
      expect(result).toBe(false)
    })

    test('should return false when fetch throws an error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const result = await verifyImageUrlExists('https://example.com/image.jpg')
      
      expect(result).toBe(false)
    })

    test('should decode HTML entities before verification', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      })

      const encodedUrl = 'https://example.com/image.jpg?token=abc&amp;size=large'
      const result = await verifyImageUrlExists(encodedUrl)
      
      expect(result).toBe(true)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/image.jpg?token=abc&size=large',
        expect.any(Object)
      )
    })

    test('should handle timeout errors', async () => {
      const timeoutError = new Error('The operation was aborted')
      timeoutError.name = 'AbortError'
      
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(timeoutError)

      const result = await verifyImageUrlExists('https://slow-server.com/image.jpg')
      
      expect(result).toBe(false)
    })

    test('should use HEAD method for efficiency', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      })

      await verifyImageUrlExists('https://example.com/image.jpg')
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'HEAD',
        })
      )
    })

    test('should include timeout signal', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      })

      await verifyImageUrlExists('https://example.com/image.jpg')
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      )
    })

    test('should handle various HTTP status codes', async () => {
      const testCases = [
        { status: 200, ok: true, expected: true },
        { status: 404, ok: false, expected: false },
        { status: 403, ok: false, expected: false },
        { status: 500, ok: false, expected: false },
        { status: 301, ok: false, expected: false }, // Redirects should be handled by fetch
      ]

      for (const testCase of testCases) {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: testCase.ok,
          status: testCase.status,
        })

        const result = await verifyImageUrlExists('https://example.com/image.jpg')
        expect(result).toBe(testCase.expected)
      }
    })
  })
})