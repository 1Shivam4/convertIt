import { proxyToGotenberg } from "../../../lib/gotenberg/client";

const DEFAULT_PATH = "/forms/pdfengines/flatten";

export async function POST(req: Request) {
  return proxyToGotenberg(req, DEFAULT_PATH);
}

export async function GET(req: Request) {
  return proxyToGotenberg(req, DEFAULT_PATH);
}
