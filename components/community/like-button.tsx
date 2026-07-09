"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export const LikeButton = ({
  code,
  initialLiked,
  initialCount,
  className,
}: {
  code: string;
  initialLiked: boolean;
  initialCount: number;
  className?: string;
}) => {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const toggle = (event: React.MouseEvent) => {
    // The button sits inside the card's <Link>; don't navigate when liking.
    event.preventDefault();
    event.stopPropagation();
    if (isPending) {
      return;
    }

    const next = !liked;
    setLiked(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));

    startTransition(async () => {
      try {
        const res = await fetch(`/api/community/${code}/like`, {
          method: "POST",
        });
        if (res.status === 401) {
          setLiked(!next);
          setCount((c) => Math.max(0, c + (next ? -1 : 1)));
          toast("Sign in to like agents", {
            action: {
              label: "Sign in",
              onClick: () => authClient.signIn.social({ provider: "github" }),
            },
          });
          return;
        }
        if (!res.ok) {
          throw new Error("request failed");
        }
        const data = (await res.json()) as {
          liked: boolean;
          likeCount: number;
        };
        setLiked(data.liked);
        setCount(data.likeCount);
        router.refresh();
      } catch {
        setLiked(!next);
        setCount((c) => Math.max(0, c + (next ? -1 : 1)));
        toast.error("Couldn't update like");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      className={cn(
        "text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors",
        liked && "text-red-500 hover:text-red-500",
        className
      )}
    >
      <Heart className={cn("size-4", liked && "fill-current")} />
      <span className="tabular-nums">{count}</span>
    </button>
  );
};
