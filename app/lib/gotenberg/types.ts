export type ProxyOptions = {
  /** Default path on the Gotenberg server (e.g. '/convert' or '/forms/chromium/convert') */
  defaultPath?: string;
};

export type GotenbergResponse = {
  status: number;
  headers: Record<string, string>;
  body?: unknown;
};
