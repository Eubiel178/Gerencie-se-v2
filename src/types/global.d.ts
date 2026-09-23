interface GtagEvent {
  [key: string]: unknown;
}

interface GtagConfigParams {
  page_path?: string;
  [key: string]: unknown;
}

interface GtagFn {
  (command: "config", targetId: string, config?: GtagConfigParams): void;
  (command: "event", eventName: string, eventParams?: GtagEvent): void;
  (command: "js", config: Date): void;
}

interface Window {
  dataLayer: unknown[];
  gtag: GtagFn;
}
