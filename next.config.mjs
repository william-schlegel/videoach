// @ts-check
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
import config from "./next-i18next.config.mjs";

!process.env.SKIP_ENV_VALIDATION && (await import("./src/env/server.mjs"));

/**
 * @template {import('next').NextConfig} T
 * @param {T} config - A generic parameter that flows through to the return type
 * @constraint {{import('next').NextConfig}}
 */
function defineNextConfig(config) {
  return config;
}

/** @type {import("next").NextConfig} */
const configNext = {
  reactStrictMode: true,
  swcMinify: true,
  i18n: config.i18n,
  images: {
    domains: ["platform-lookaside.fbsbx.com"],
  },
};
export default defineNextConfig(configNext);
