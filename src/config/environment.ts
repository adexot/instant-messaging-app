// Environment configuration for the instant messaging app
export interface AppConfig {
  instantDb: {
    appId: string;
    connectionTimeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
  ui: {
    messagePageSize: number;
    typingTimeout: number;
    animationDuration: number;
    maxMessageLength: number;
    maxAliasLength: number;
  };
  features: {
    enableVirtualScrolling: boolean;
    enableOfflineSupport: boolean;
    enableTypingIndicators: boolean;
    enableAnimations: boolean;
  };
  performance: {
    virtualScrollThreshold: number;
    messageCleanupInterval: number;
    typingCleanupInterval: number;
  };
}

// Default configuration
const defaultConfig: AppConfig = {
  instantDb: {
    appId: import.meta.env.VITE_INSTANT_APP_ID || '824af4ff-5ff9-43b3-af1b-6de3fcac579d',
    connectionTimeout: 10000, // 10 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },
  ui: {
    messagePageSize: 50,
    typingTimeout: 3000, // 3 seconds
    animationDuration: 300, // 300ms
    maxMessageLength: 1000,
    maxAliasLength: 20,
  },
  features: {
    enableVirtualScrolling: true,
    enableOfflineSupport: true,
    enableTypingIndicators: true,
    enableAnimations: true,
  },
  performance: {
    virtualScrollThreshold: 50, // Enable virtual scrolling after 50 messages
    messageCleanupInterval: 300000, // 5 minutes
    typingCleanupInterval: 60000, // 1 minute
  },
};

// Environment-specific configurations
const environments = {
  development: {
    ...defaultConfig,
    ui: {
      ...defaultConfig.ui,
      messagePageSize: 20, // Smaller page size for development
    },
    features: {
      ...defaultConfig.features,
      enableAnimations: true, // Always enable animations in dev
    },
  } as AppConfig,

  production: {
    ...defaultConfig,
    instantDb: {
      ...defaultConfig.instantDb,
      connectionTimeout: 15000, // Longer timeout for production
      retryAttempts: 5, // More retry attempts
    },
    ui: {
      ...defaultConfig.ui,
      messagePageSize: 100, // Larger page size for production
    },
    performance: {
      ...defaultConfig.performance,
      virtualScrollThreshold: 100, // Higher threshold for production
    },
  } as AppConfig,

  test: {
    ...defaultConfig,
    instantDb: {
      ...defaultConfig.instantDb,
      connectionTimeout: 5000, // Shorter timeout for tests
      retryAttempts: 1, // Fewer retries for tests
    },
    ui: {
      ...defaultConfig.ui,
      messagePageSize: 10, // Small page size for tests
      typingTimeout: 1000, // Shorter typing timeout for tests
    },
    features: {
      ...defaultConfig.features,
      enableAnimations: false, // Disable animations in tests
    },
  } as AppConfig,
};

// Get current environment
const getCurrentEnvironment = (): keyof typeof environments => {
  if (import.meta.env.MODE === 'test') return 'test';
  if (import.meta.env.MODE === 'production') return 'production';
  return 'development';
};

// Validate environment configuration
const validateConfig = (config: AppConfig): void => {
  if (!config.instantDb.appId || config.instantDb.appId === 'your-app-id') {
    console.warn('⚠️  VITE_INSTANT_APP_ID not configured. Please set your Instant DB app ID in .env file.');
  }
  
  if (config.instantDb.connectionTimeout < 1000) {
    console.warn('⚠️  Connection timeout is very low, this may cause connection issues.');
  }
  
  if (config.ui.maxMessageLength < 10) {
    console.warn('⚠️  Maximum message length is very low.');
  }
};

// Export the configuration for the current environment
export const config: AppConfig = (() => {
  const currentConfig = environments[getCurrentEnvironment()];
  validateConfig(currentConfig);
  return currentConfig;
})();

// Export individual environment configs for testing
export { environments };

// Utility functions
export const isProduction = () => getCurrentEnvironment() === 'production';
export const isDevelopment = () => getCurrentEnvironment() === 'development';
export const isTest = () => getCurrentEnvironment() === 'test';

// Feature flags
export const featureFlags = {
  isVirtualScrollingEnabled: (messageCount: number) => 
    config.features.enableVirtualScrolling && messageCount >= config.performance.virtualScrollThreshold,
  
  isOfflineSupportEnabled: () => config.features.enableOfflineSupport,
  
  isTypingIndicatorsEnabled: () => config.features.enableTypingIndicators,
  
  isAnimationsEnabled: () => config.features.enableAnimations,
};

// Validation helpers
export const validation = {
  isValidMessageLength: (message: string) => 
    message.length > 0 && message.length <= config.ui.maxMessageLength,
  
  isValidAliasLength: (alias: string) => 
    alias.length > 0 && alias.length <= config.ui.maxAliasLength,
  
  isValidAlias: (alias: string) => {
    const trimmed = alias.trim();
    return validation.isValidAliasLength(trimmed) && /^[a-zA-Z0-9_-]+$/.test(trimmed);
  },
};

// Debug helpers (only available in development)
export const debug = isDevelopment() ? {
  logConfig: () => console.log('App Configuration:', config),
  logEnvironment: () => console.log('Current Environment:', getCurrentEnvironment()),
  logFeatureFlags: () => console.log('Feature Flags:', {
    virtualScrolling: config.features.enableVirtualScrolling,
    offlineSupport: config.features.enableOfflineSupport,
    typingIndicators: config.features.enableTypingIndicators,
    animations: config.features.enableAnimations,
  }),
} : {};