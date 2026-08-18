import { proxyToGotenberg } from "../../../lib/gotenberg/client";

// Default path can be overridden via `?target=` or `x-gotenberg-path` header
const DEFAULT_PATH = "/html-to-pdf";

export async function POST(req: Request) {
  return proxyToGotenberg(req, DEFAULT_PATH);
}

export async function GET(req: Request) {
  return proxyToGotenberg(req, DEFAULT_PATH);
}
