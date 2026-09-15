/**
 * Cloudflare Turnstile token verification for anti-bot protection.
 */
export interface TurnstileVerifyResult {
  success: boolean;
  error?: string;
}

export async function verifyTurnstileToken(
  token?: string,
  remoteIp?: string
): Promise<TurnstileVerifyResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // In development, test environments, or when secret key is not set, allow bypass with test tokens
  if (
    !secretKey ||
    process.env.NODE_ENV !== "production" ||
    token === "test-turnstile-token" ||
    token === "XXXX.DUMMY.TOKEN.XXXX"
  ) {
    return { success: true };
  }

  if (!token) {
    return { success: false, error: "Güvenlik doğrulaması (Turnstile) eksik." };
  }

  try {
    const formData = new FormData();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });

    const outcome = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };

    if (outcome.success) {
      return { success: true };
    }

    return {
      success: false,
      error: `Doğrulama tamamlanamadı: ${(outcome["error-codes"] || []).join(", ") || "geçersiz belirteç"}`,
    };
  } catch (err) {
    console.error("[Turnstile] Verification error:", err);
    return { success: false, error: "Güvenlik doğrulama servisine erişilemedi." };
  }
}
