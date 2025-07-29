import '@testing-library/jest-dom'

// Mock IndexedDB for instant-db
global.indexedDB = {
  open: () => ({
    onsuccess: null,
    onerror: null,
    result: {
      createObjectStore: () => ({}),
      transaction: () => ({
        objectStore: () => ({
          add: () => ({}),
          get: () => ({}),
          put: () => ({}),
          delete: () => ({}),
        }),
      }),
    },
  }),
} as any;

// Mock WebSocket for instant-db
global.WebSocket = class MockWebSocket {
  constructor() {}
  send() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
} as any;