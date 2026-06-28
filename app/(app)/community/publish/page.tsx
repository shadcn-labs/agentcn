import type { Metadata } from "next";
import Link from "next/link";

import { PublishForm } from "@/components/community/publish-form";
import { SignInButtons } from "@/components/community/sign-in-buttons";
import { ROUTES } from "@/constants/routes";
import { getSession } from "@/lib/community/session";

export const metadata: Metadata = {
  description: "Share your Eve or Flue agent with the community.",
  title: "Publish an agent",
};

export default async function PublishPage() {
  const session = await getSession();

  return (
    <div className="container-wrapper flex-1">
      <div className="3xl:fixed:container px-6 py-10">
        <div className="mx-auto max-w-2xl">
          <Link
            href={ROUTES.COMMUNITY}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ← Back to community
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            Publish an agent
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Share your Eve or Flue agent. It gets a unique install code so
            anyone can add it with the shadcn CLI.
          </p>

          <div className="mt-8">
            {session ? (
              <PublishForm />
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-sm">Sign in to publish an agent.</p>
                <SignInButtons callbackURL={ROUTES.COMMUNITY_PUBLISH} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
