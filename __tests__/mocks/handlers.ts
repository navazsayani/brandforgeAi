import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock Google AI API
  http.post('https://generativelanguage.googleapis.com/v1beta/models/*', () => {
    return HttpResponse.json({
      candidates: [
        {
          content: {
            parts: [
              {
                text: 'Mocked AI response for testing'
              }
            ]
          }
        }
      ]
    })
  }),

  // Mock Freepik API
  http.post('https://api.freepik.com/v1/ai/text-to-image/imagen3', () => {
    return HttpResponse.json({
      data: {
        task_id: 'mock-task-id-123',
        status: 'IN_PROGRESS',
        generated: []
      }
    })
  }),

  http.get('https://api.freepik.com/v1/ai/text-to-image/imagen3/:taskId', () => {
    return HttpResponse.json({
      data: {
        status: 'COMPLETED',
        generated: [
          'https://example.com/mock-image-1.jpg',
          'https://example.com/mock-image-2.jpg'
        ]
      }
    })
  }),

  // Mock Firebase Storage URLs
  http.get('https://firebasestorage.googleapis.com/*', () => {
    return HttpResponse.arrayBuffer(new ArrayBuffer(1024), {
      headers: {
        'Content-Type': 'image/jpeg'
      }
    })
  }),

  // Mock external image URLs for verification
  http.head('https://example.com/*', () => {
    return new HttpResponse(null, { status: 200 })
  }),

  // Mock website content fetching
  http.get('https://example.com', () => {
    return HttpResponse.html(`
      <html>
        <head><title>Example Website</title></head>
        <body>
          <h1>Welcome to Example</h1>
          <p>This is example content for testing.</p>
        </body>
      </html>
    `)
  }),

  // Mock Razorpay API
  http.post('https://api.razorpay.com/v1/orders', () => {
    return HttpResponse.json({
      id: 'order_mock123',
      amount: 99900,
      currency: 'USD',
      status: 'created'
    })
  }),

  // Mock Meta/Facebook API
  http.get('https://graph.facebook.com/v19.0/me', () => {
    return HttpResponse.json({
      id: 'mock-user-id',
      name: 'Test User'
    })
  }),

  http.get('https://graph.facebook.com/v19.0/me/accounts', () => {
    return HttpResponse.json({
      data: [
        {
          id: 'mock-page-id',
          name: 'Test Page',
          access_token: 'mock-page-token'
        }
      ]
    })
  }),

  http.get('https://graph.facebook.com/v19.0/:pageId', () => {
    return HttpResponse.json({
      instagram_business_account: {
        id: 'mock-ig-id',
        username: 'testaccount'
      }
    })
  }),
]