import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
});

const cleanEnv = (val?: string) => {
  if (!val) return val;
  return val.replace(/^["']|["']$/g, "").trim();
};

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL:
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) || "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.anon_placeholder",
  SUPABASE_SERVICE_ROLE_KEY: cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: cleanEnv(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
  TURNSTILE_SECRET_KEY: cleanEnv(process.env.TURNSTILE_SECRET_KEY),
});

