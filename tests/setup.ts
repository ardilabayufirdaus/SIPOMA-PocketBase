// Vitest / Jest setup file for SIPOMA testing
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global alias so existing tests calling jest.fn(), jest.spyOn() etc. work in Vitest
// @ts-expect-error
globalThis.jest = vi;

// Mock environment variables for testing
process.env.VITE_POCKETBASE_URL = 'https://db.sipoma.online/';
process.env.VITE_POCKETBASE_EMAIL = 'test@example.com';
process.env.VITE_POCKETBASE_PASSWORD = 'testpassword123';
process.env.VITE_ENCRYPTION_SEED = 'test-encryption-seed';

// Mock ResizeObserver for components that use it
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver for components that use it
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock EventSource for PocketBase realtime subscriptions
// @ts-expect-error
global.EventSource = vi.fn().mockImplementation(() => ({
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  close: vi.fn(),
  onopen: null,
  onmessage: null,
  onerror: null,
}));

// Mock window.matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock crypto for secure storage
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

// Suppress console errors in tests unless explicitly needed
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};
