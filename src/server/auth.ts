import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { z } from "zod";
import { db } from "./db";
import * as schema from "./db/schema";

const appOrigin = process.env.APP_ORIGIN;
if (!appOrigin) throw new Error("APP_ORIGIN is required to configure authentication.");
const authSecret = process.env.BETTER_AUTH_SECRET;
if (!authSecret) throw new Error("BETTER_AUTH_SECRET is required to configure authentication.");

const trustedOrigins = new Set([appOrigin]);
if (process.env.NODE_ENV !== "production") {
  trustedOrigins.add("http://localhost:*");
  trustedOrigins.add("http://127.0.0.1:*");
  const localOrigin = new URL(appOrigin);
  if (localOrigin.hostname === "localhost") {
    localOrigin.hostname = "127.0.0.1";
    trustedOrigins.add(localOrigin.origin);
  } else if (localOrigin.hostname === "127.0.0.1") {
    localOrigin.hostname = "localhost";
    trustedOrigins.add(localOrigin.origin);
  }
}

export const auth = betterAuth({
  appName: "Animal Controller",
  secret: authSecret,
  baseURL: appOrigin,
  trustedOrigins: [...trustedOrigins],
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.RESEND_FROM_EMAIL;
      if (!apiKey || !from) throw new Error("Password reset email is not configured.");
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [user.email],
          subject: "Redefinição de senha — Animal Controller",
          html: `<p>Para redefinir sua senha, <a href="${url}">acesse este link</a>. Se você não solicitou a alteração, ignore este e-mail.</p>`,
        }),
      });
      if (!response.ok) throw new Error("Unable to send password reset email.");
    },
  },
  user: {
    deleteUser: { enabled: true },
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "tutor", input: true, validator: z.enum(["tutor", "veterinarian"]) },
      councilNumber: { type: "string", required: false, defaultValue: "", input: true, validator: z.string().max(80) },
    },
  },
  session: { expiresIn: 60 * 60 * 24 * 14, updateAge: 60 * 60 * 24 },
  advanced: { useSecureCookies: process.env.NODE_ENV === "production" },
  plugins: [tanstackStartCookies()],
});
