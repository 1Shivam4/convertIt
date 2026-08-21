import { proxyToGotenberg } from "../../../lib/gotenberg/client";

// Default path can be overridden via `?target=` or `x-gotenberg-path` header
const DEFAULT_PATH = "/forms/chromium/convert/html";

export async function POST(req: Request) {
  return proxyToGotenberg(req, DEFAULT_PATH);
}

export async function GET(req: Request) {
  return proxyToGotenberg(req, DEFAULT_PATH);
}
