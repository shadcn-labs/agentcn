import "server-only";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

/** Returns the current Better Auth session, or null (also on DB errors). */
export const getSession = async () => {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch {
    return null;
  }
};
