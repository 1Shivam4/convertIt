// @vitest-environment node
import { describe, it, expect, beforeAll, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../../mocks/server";

// The GOTENBERG_URL env is loaded from .env.test (http://localhost:8000)
// The client module is imported at the top — env must already be set
import { proxyToGotenberg } from "@/app/lib/gotenberg/client";

const GOTENBERG_BASE = "http://localhost:8000";

function buildRequest(
  url: string,
  options: { method?: string; body?: BodyInit | null; headers?: Record<string, string> } = {}
): Request {
  const init: RequestInit & { duplex?: string } = {
    method: options.method ?? "POST",
    headers: options.headers,
    duplex: "half",
  };
  if (options.body !== undefined) init.body = options.body;
  return new Request(url, init);
}

describe("proxyToGotenberg", () => {
  it("proxies POST request to the Gotenberg URL resolved from ?target= param", async () => {
    let capturedUrl = "";
    server.use(
      http.post(`${GOTENBERG_BASE}/forms/libreoffice/convert`, ({ request }) => {
        capturedUrl = request.url;
        return new HttpResponse(new Uint8Array([37, 80, 68, 70]), {
          status: 200,
          headers: { "Content-Type": "application/pdf" },
        });
      })
    );

    const req = buildRequest(
      `http://localhost:3000/api/pdf/convert?target=/forms/libreoffice/convert`,
      { body: new FormData() }
    );
    const res = await proxyToGotenberg(req);
    expect(res.status).toBe(200);
    expect(capturedUrl).toContain("/forms/libreoffice/convert");
  });

  it("x-gotenberg-path header takes priority over ?target= query param", async () => {
    let capturedUrl = "";
    server.use(
      http.post(`${GOTENBERG_BASE}/forms/pdfengines/convert`, ({ request }) => {
        capturedUrl = request.url;
        return new HttpResponse(new Uint8Array([37, 80, 68, 70]), {
          status: 200,
          headers: { "Content-Type": "application/pdf" },
        });
      })
    );

    const req = buildRequest(
      `http://localhost:3000/api/pdf/convert?target=/forms/libreoffice/convert`,
      {
        body: new FormData(),
        headers: { "x-gotenberg-path": "/forms/pdfengines/convert" },
      }
    );
    const res = await proxyToGotenberg(req);
    expect(res.status).toBe(200);
    expect(capturedUrl).toContain("/forms/pdfengines/convert");
  });

  it("strips host header before forwarding to Gotenberg", async () => {
    let capturedHostHeader: string | null = "present";
    server.use(
      http.post(`${GOTENBERG_BASE}/forms/libreoffice/convert`, ({ request }) => {
        capturedHostHeader = request.headers.get("host");
        return new HttpResponse(new Uint8Array([37, 80, 68, 70]), {
          status: 200,
          headers: { "Content-Type": "application/pdf" },
        });
      })
    );

    const req = buildRequest(
      `http://localhost:3000/api/pdf/convert?target=/forms/libreoffice/convert`,
      { body: new FormData() }
    );
    await proxyToGotenberg(req);
    expect(capturedHostHeader).toBeNull();
  });

  it("returns 502 when Gotenberg fetch fails (network error)", async () => {
    server.use(
      http.post(`${GOTENBERG_BASE}/forms/libreoffice/convert`, () =>
        HttpResponse.error()
      )
    );

    const req = buildRequest(
      `http://localhost:3000/api/pdf/convert?target=/forms/libreoffice/convert`,
      { body: new FormData() }
    );
    const res = await proxyToGotenberg(req);
    expect(res.status).toBe(502);
  });

  it("falls back to defaultPath when no ?target= or header is provided", async () => {
    let capturedUrl = "";
    server.use(
      http.post(`${GOTENBERG_BASE}/my/default/path`, ({ request }) => {
        capturedUrl = request.url;
        return new HttpResponse(new Uint8Array([37, 80, 68, 70]), {
          status: 200,
          headers: { "Content-Type": "application/pdf" },
        });
      })
    );

    const req = buildRequest(`http://localhost:3000/api/pdf/convert`, {
      body: new FormData(),
    });
    const res = await proxyToGotenberg(req, "/my/default/path");
    expect(res.status).toBe(200);
    expect(capturedUrl).toContain("/my/default/path");
  });

  it("forwards the Gotenberg response status code back to the caller", async () => {
    server.use(
      http.post(`${GOTENBERG_BASE}/forms/libreoffice/convert`, () => {
        return new HttpResponse("Invalid file", { status: 400 });
      })
    );

    const req = buildRequest(
      `http://localhost:3000/api/pdf/convert?target=/forms/libreoffice/convert`,
      { body: new FormData() }
    );
    const res = await proxyToGotenberg(req);
    expect(res.status).toBe(400);
  });
});
