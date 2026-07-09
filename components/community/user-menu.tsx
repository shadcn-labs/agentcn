"use client";

import Link from "next/link";
import { useState } from "react";

import { SignInButtons } from "@/components/community/sign-in-buttons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/constants/routes";
import { authClient, useSession } from "@/lib/auth-client";

const Avatar = ({ name, image }: { name: string; image?: string | null }) =>
  image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image}
      alt={name}
      width={28}
      height={28}
      className="size-7 rounded-full object-cover"
    />
  ) : (
    <span className="bg-muted text-muted-foreground flex size-7 items-center justify-center rounded-full text-xs font-medium uppercase">
      {name.charAt(0)}
    </span>
  );

export const UserMenu = () => {
  const { data, isPending } = useSession();
  const [open, setOpen] = useState(false);

  if (isPending) {
    return <div className="size-7" aria-hidden />;
  }

  if (!data) {
    return (
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogTrigger asChild>
          <Button size="sm" sound="click" variant="outline">
            Sign in
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign in to agentcn</DialogTitle>
            <DialogDescription>
              Publish your own agents and like community ones.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-2">
            <SignInButtons callbackURL={ROUTES.COMMUNITY} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { user } = data;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="focus-visible:ring-ring/50 rounded-full outline-none focus-visible:ring-[3px]"
        >
          <Avatar image={user.image} name={user.name} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="truncate">{user.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`${ROUTES.COMMUNITY}?scope=my`}>My agents</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`${ROUTES.COMMUNITY}?scope=liked`}>Liked agents</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={ROUTES.COMMUNITY_PUBLISH}>Publish agent</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => authClient.signOut()}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
