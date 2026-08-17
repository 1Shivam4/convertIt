const GOTENBERG_URL = process.env.GOTENBERG_URL;

if (!GOTENBERG_URL) {
  throw new Error("GOTENBERG_URL is not configured");
}
