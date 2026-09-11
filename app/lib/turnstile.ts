/**
 * Cloudflare Turnstile Bot Verification Helper.
 * Verifies turnstile tokens with Cloudflare's siteverify API endpoint.
 */

export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteip?: string,
): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // In development mode, auto-pass if no secret key is set or token is 'dev-pass'
  if (!secretKey || process.env.NODE_ENV === "development") {
    if (!token || token === "dev-pass" || !secretKey) {
      return true;
    }
  }

  if (!token) return false;

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey!);
    formData.append("response", token);
    if (remoteip) formData.append("remoteip", remoteip);

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error("Turnstile verification request failed:", err);
    // Graceful fallback during API outages
    return false;
  }
}
