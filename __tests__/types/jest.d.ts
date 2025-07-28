import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidBrandData(): R
      toBeValidFormState(): R
    }
  }
}

export {}