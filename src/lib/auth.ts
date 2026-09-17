import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization, bearer, twoFactor } from "better-auth/plugins";
import { db } from "./db";
import { env } from "@/env";

const googleClientId = process.env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || env.GOOGLE_CLIENT_SECRET;

const resolvedBaseUrl =
  process.env.BETTER_AUTH_URL ||
  (process.env.NODE_ENV === "production" && env.BETTER_AUTH_URL === "http://localhost:3000"
    ? (env.NEXT_PUBLIC_APP_URL && env.NEXT_PUBLIC_APP_URL !== "http://localhost:3000"
        ? env.NEXT_PUBLIC_APP_URL
        : "https://contour.banyalabs.com")
    : env.BETTER_AUTH_URL);

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: resolvedBaseUrl,
  trustedOrigins: (request) => {
    const origins = [
      resolvedBaseUrl,
      env.BETTER_AUTH_URL,
      env.NEXT_PUBLIC_APP_URL,
      process.env.BETTER_AUTH_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      "https://contour.banyalabs.com",
      "http://localhost:3000",
    ];
    if (request) {
      const origin = request.headers.get("origin");
      if (origin) origins.push(origin);
      const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
      const proto = request.headers.get("x-forwarded-proto") || "https";
      if (host) origins.push(`${proto}://${host}`);
    }
    return Array.from(new Set(origins.filter((o): o is string => Boolean(o))));
  },
  socialProviders:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : undefined,
  plugins: [
    organization({
    }),
    bearer(),
    // Fix 1: TOTP-based MFA — opt-in via settings, no email required.
    // Users scan a QR code with Google Authenticator / Authy once during setup.
    twoFactor({
      totpOptions: { digits: 6, period: 30 },
      skipVerificationOnEnable: false,
      issuer: "Contour",
    }),
  ],
  emailAndPassword: {
    enabled: true,
    // Fix 5: Server-side password minimum length (not just HTML minLength attribute).
    minPasswordLength: 12,
  },
  // Fix 6: Explicit session TTL — 8-hour lifetime, sliding refresh every hour.
  session: {
    expiresIn: 60 * 60 * 8,
    updateAge: 60 * 60,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "FIELD_AGENT",
      },
      phone: {
        type: "string",
        required: false,
      },
    },
  },
  // Fix 7: Auth audit trail — write sign-in / sign-out events to AuditLog.
  hooks: {
    after: [
      {
        matcher: (ctx: any) => ctx.path === "/sign-in/email",
        handler: async (ctx: any) => {
          try {
            const ip = ctx.request?.headers?.get("x-forwarded-for") ?? "unknown";
            const userAgent = ctx.request?.headers?.get("user-agent") ?? "unknown";
            const succeeded = !!ctx.context?.newSession;
            await db.auditLog.create({
              data: {
                action: succeeded ? "USER_SIGN_IN" : "USER_SIGN_IN_FAILED",
                entityType: "User",
                entityId: ctx.body?.email ?? "unknown",
                ipAddress: ip,
                userAgent,
                details: { method: "email" },
              },
            });
          } catch {
            // Non-blocking — never let audit failures break login
          }
        },
      },
      {
        matcher: (ctx: any) => ctx.path === "/sign-out",
        handler: async (ctx: any) => {
          try {
            const sessionUserId = ctx.context?.session?.userId;
            if (sessionUserId) {
              await db.auditLog.create({
                data: {
                  action: "USER_SIGN_OUT",
                  entityType: "User",
                  entityId: sessionUserId,
                  details: { method: "explicit" },
                },
              });
            }
          } catch {
            // Non-blocking
          }
        },
      },
    ],
  },
});


export type Session = typeof auth.$Infer.Session;
