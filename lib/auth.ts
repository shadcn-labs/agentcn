import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { Resend } from "resend";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const EMAIL_FROM = process.env.EMAIL_FROM ?? "agentcn <onboarding@resend.dev>";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  plugins: [
    magicLink({
      async sendMagicLink({ email, url }) {
        if (!resend) {
          // No email provider configured yet: log the link so local sign-in
          // still works during development.
          // eslint-disable-next-line no-console
          console.log(`[magic-link] ${email}: ${url}`);
          return;
        }
        await resend.emails.send({
          from: EMAIL_FROM,
          subject: "Sign in to agentcn",
          text: `Click to sign in: ${url}`,
          to: email,
        });
      },
    }),
    // nextCookies must be last so it can flush Set-Cookie headers.
    nextCookies(),
  ],
  secret: process.env.BETTER_AUTH_SECRET,
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
});
