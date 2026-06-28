/// <reference types="vite/client" />

interface CapacitorBridge {
  Plugins?: Record<string, any>;
  getPlatform?: () => string;
}

interface Window {
  Capacitor?: CapacitorBridge;
  MSStream?: unknown;
}
