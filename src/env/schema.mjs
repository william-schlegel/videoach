// @ts-check
import { z } from "zod";

/**
 * Specify your server-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 */
export const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]),
  NEXTAUTH_SECRET:
    process.env.NODE_ENV === "production"
      ? z.string().min(1)
      : z.string().min(1).optional(),
  NEXTAUTH_URL: z.preprocess(
    // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
    // Since NextAuth automatically uses the VERCEL_URL if present.
    (str) => process.env.VERCEL_URL ?? str,
    // VERCEL_URL doesnt include `https` so it cant be validated as a URL
    process.env.VERCEL ? z.string() : z.string().url()
  ),
  STRAVA_CLIENT_ID: z.string(),
  STRAVA_CLIENT_SECRET: z.string(),
  FACEBOOK_ID: z.string(),
  FACEBOOK_SECRET: z.string(),
  GOOGLE_ID: z.string(),
  GOOGLE_SECRET: z.string(),
  EMAIL_FROM: z.string().email(),
  EMAIL_SERVER_USER: z.string(),
  EMAIL_SERVER_PASSWORD: z.string(),
  EMAIL_SERVER_HOST: z.string(),
  EMAIL_SERVER_PORT: z.enum(["25", "587", "465", "2525", "25025"]),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
});

/**
 * Specify your client-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 * To expose them to the client, prefix them with `NEXT_PUBLIC_`.
 */
export const clientSchema = z.object({
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string(),
  NEXT_PUBLIC_MAPQUEST_KEY: z.string(),
  // NEXT_PUBLIC_BAR: z.string(),
});

/**
 * You can't destruct `process.env` as a regular object, so you have to do
 * it manually here. This is because Next.js evaluates this at build time,
 * and only used environment variables are included in the build.
 * @type {{ [k in keyof z.infer<typeof clientSchema>]: z.infer<typeof clientSchema>[k] | undefined }}
 */
export const clientEnv = {
  NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  NEXT_PUBLIC_MAPQUEST_KEY: process.env.NEXT_PUBLIC_MAPQUEST_KEY,
};
