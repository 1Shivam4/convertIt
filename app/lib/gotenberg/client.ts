const GOTENBERG_URL = process.env.GOTENBERG_URL;

if (!GOTENBERG_URL) {
  throw new Error("GOTENBERG_URL is not configured");
}

export async function proxyToGotenberg(req: Request, defaultPath = "/") {
  try {
    const url = new URL(req.url);
    const targetParam = url.searchParams.get("target") || undefined;
    const targetHeader = req.headers.get("x-gotenberg-path") || undefined;
    const path = targetHeader ?? targetParam ?? defaultPath;
    const target = new URL(path, GOTENBERG_URL).toString();

    const headers = new Headers(req.headers);
    headers.delete("host");

    const res = await fetch(target, {
      method: req.method,
      headers,
      body:
        req.method === "GET" || req.method === "HEAD" ? undefined : req.body,
    });

    const resHeaders = Object.fromEntries(res.headers.entries());
    return new Response(res.body, { status: res.status, headers: resHeaders });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    return new Response(msg, { status: 502 });
  }
}

export { GOTENBERG_URL };
