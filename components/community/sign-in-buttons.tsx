"use client";

import { Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { GithubIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export const SignInButtons = ({
  callbackURL = "/community",
}: {
  callbackURL?: string;
}) => {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const sendMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || sending) {
      return;
    }
    setSending(true);
    const { error } = await authClient.signIn.magicLink({ callbackURL, email });
    setSending(false);
    if (error) {
      toast.error(error.message ?? "Couldn't send the magic link.");
    } else {
      toast.success("Check your email for a sign-in link.");
    }
  };

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Button
        variant="outline"
        sound="click"
        onClick={() =>
          authClient.signIn.social({ callbackURL, provider: "github" })
        }
      >
        <GithubIcon />
        Continue with GitHub
      </Button>
      <Button
        variant="outline"
        sound="click"
        onClick={() =>
          authClient.signIn.social({ callbackURL, provider: "google" })
        }
      >
        Continue with Google
      </Button>

      <div className="flex items-center gap-3">
        <span className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs">or</span>
        <span className="bg-border h-px flex-1" />
      </div>

      <form onSubmit={sendMagicLink} className="flex flex-col gap-2">
        <Input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Button type="submit" disabled={sending} sound="click">
          <Mail />
          {sending ? "Sending…" : "Send magic link"}
        </Button>
      </form>
    </div>
  );
};
