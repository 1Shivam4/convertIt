import { http, HttpResponse } from "msw";

const GOTENBERG_URL = "http://localhost:8000";

export const handlers = [
  // Mock LibreOffice conversion (PDF → DOCX, TXT, HTML, etc.)
  http.post(`${GOTENBERG_URL}/forms/libreoffice/convert`, () => {
    const fakeBlob = new Uint8Array([37, 80, 68, 70]); // %PDF magic bytes
    return new HttpResponse(fakeBlob, {
      status: 200,
      headers: { "Content-Type": "application/pdf" },
    });
  }),

  // Mock Gotenberg PDF engines — convert (PDF/A), optimize, rotate, flatten, encrypt
  http.post(`${GOTENBERG_URL}/forms/pdfengines/convert`, () => {
    const fakeBlob = new Uint8Array([37, 80, 68, 70]);
    return new HttpResponse(fakeBlob, {
      status: 200,
      headers: { "Content-Type": "application/pdf" },
    });
  }),

  http.post(`${GOTENBERG_URL}/forms/pdfengines/merge`, () => {
    const fakeBlob = new Uint8Array([37, 80, 68, 70]);
    return new HttpResponse(fakeBlob, {
      status: 200,
      headers: { "Content-Type": "application/pdf" },
    });
  }),
];
