/* ============================================
   Test Setup - Mock Chrome APIs & DOM
   ============================================ */

// Mock chrome API
global.chrome = {
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        const data = {};
        if (typeof keys === "string") {
          data[keys] = null;
        } else if (Array.isArray(keys)) {
          keys.forEach((key) => (data[key] = null));
        } else if (typeof keys === "object") {
          Object.assign(data, keys);
        }
        if (callback) callback(data);
        return Promise.resolve(data);
      }),
      set: jest.fn((items, callback) => {
        if (callback) callback();
        return Promise.resolve();
      }),
    },
  },
  proxy: {
    settings: {
      set: jest.fn((details, callback) => {
        if (callback) callback();
      }),
      get: jest.fn((details, callback) => {
        if (callback) callback({ value: { mode: "direct" } });
      }),
    },
    onError: {
      addListener: jest.fn(),
    },
  },
  runtime: {
    onInstalled: {
      addListener: jest.fn(),
    },
    onStartup: {
      addListener: jest.fn(),
    },
    onMessage: {
      addListener: jest.fn(),
    },
    sendMessage: jest.fn(),
    openOptionsPage: jest.fn(),
  },
  alarms: {
    create: jest.fn(),
    onAlarm: {
      addListener: jest.fn(),
    },
  },
};

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index) => Object.keys(store)[index] || null),
  };
})();

global.localStorage = localStorageMock;

// Mock performance
global.performance = {
  now: jest.fn(() => Date.now()),
};

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        proxies: [
          {
            ip: "1.2.3.4",
            port: 8080,
            time_ms: 150,
            status: "ok",
            proxy_str: "http://1.2.3.4:8080",
          },
          {
            ip: "5.6.7.8",
            port: 3128,
            time_ms: 250,
            status: "ok",
            proxy_str: "http://5.6.7.8:3128",
          },
          {
            ip: "9.10.11.12",
            port: 8888,
            time_ms: 80,
            status: "ok",
            proxy_str: "http://9.10.11.12:8888",
          },
        ],
        timestamp: new Date().toISOString(),
      }),
    text: () => Promise.resolve(JSON.stringify({ proxies: [] })),
    headers: {
      get: jest.fn(),
    },
  })
);

// Mock AbortController
global.AbortController = class AbortController {
  constructor() {
    this.signal = { aborted: false };
  }
  abort() {
    this.signal.aborted = true;
  }
};

// Mock document elements for popup.js tests
document.body.innerHTML = `
  <div class="app">
    <div class="status-ring" id="status-ring"></div>
    <span class="status-label" id="status-label"></span>
    <span class="status-sub" id="status-sub"></span>
    <button class="connect-btn" id="connect-btn">
      <span class="connect-btn-text" id="connect-text"></span>
    </button>
    <button id="btn-auto-connect"></button>
    <div class="server-list" id="server-list"></div>
    <input type="text" id="search-input" />
    <span id="server-count"></span>
    <button id="btn-refresh"></button>
    <button id="btn-settings"></button>
    <span id="stat-ping"></span>
    <span id="stat-speed"></span>
    <span id="stat-upload"></span>
    <span id="stat-download"></span>
    <span id="last-update"></span>
  </div>
`;
