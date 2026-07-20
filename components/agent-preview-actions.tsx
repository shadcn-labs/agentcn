"use client";

import {
  CheckIcon,
  EllipsisIcon,
  GlobeIcon,
  LockIcon,
  RocketIcon,
  SquareTerminalIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CodeBlockCommand } from "@/components/code-block-command";
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
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { FrameworkId } from "@/constants/agents";
import { FRAMEWORK_LABEL, getAgent } from "@/constants/agents";
import { SITE } from "@/constants/site";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const gitProviders = [
  { id: "github", label: "GitHub", mark: "GH" },
  { id: "gitlab", label: "GitLab", mark: "GL" },
  { id: "bitbucket", label: "Bitbucket", mark: "BB" },
] as const;

const deploymentProviders = [
  { id: "vercel", label: "Vercel", mark: "V" },
  { id: "cloudflare", label: "Cloudflare", mark: "CF" },
  { id: "railway", label: "Railway", mark: "RW" },
  { id: "digitalocean", label: "DigitalOcean", mark: "DO" },
  { id: "render", label: "Render", mark: "R" },
] as const;

type GitProvider = (typeof gitProviders)[number]["id"];
type DeploymentProvider = (typeof deploymentProviders)[number]["id"];

const getInstallCommands = (framework: FrameworkId, agent: string) => {
  const registryItem = `${SITE.REGISTRY}/${framework}/${agent}`;

  return {
    bun: `bunx --bun shadcn@latest add ${registryItem}`,
    npm: `npx shadcn@latest add ${registryItem}`,
    pnpm: `pnpm dlx shadcn@latest add ${registryItem}`,
    yarn: `yarn shadcn@latest add ${registryItem}`,
  };
};

const UtilityButton = ({
  label,
  children,
  ...props
}: {
  label: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<typeof Button>, "aria-label" | "children">) => (
  <Button
    aria-label={label}
    className="size-7 text-muted-foreground hover:text-foreground"
    size="icon-sm"
    type="button"
    variant="ghost"
    {...props}
  >
    {children}
  </Button>
);

const InstallContent = ({
  agent,
  framework,
}: {
  agent: string;
  framework: FrameworkId;
}) => {
  const commands = getInstallCommands(framework, agent);

  return (
    <>
      <div className="space-y-1">
        <p className="text-sm font-medium">Add to an existing project</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Install the {FRAMEWORK_LABEL[framework]} version of this agent with
          the shadcn CLI.
        </p>
      </div>
      <CodeBlockCommand
        __bun__={commands.bun}
        __npm__={commands.npm}
        __pnpm__={commands.pnpm}
        __yarn__={commands.yarn}
        className="mt-3"
        copyEvent="copy_registry_command"
      />
    </>
  );
};

const ProviderButton = ({
  label,
  mark,
  onClick,
  selected,
}: {
  label: string;
  mark: string;
  onClick: () => void;
  selected: boolean;
}) => (
  <button
    aria-pressed={selected}
    className={cn(
      "relative flex min-w-0 items-center gap-2.5 rounded-lg border p-2.5 text-left text-sm transition-colors",
      selected
        ? "border-foreground/25 bg-accent text-accent-foreground"
        : "border-border bg-background hover:bg-muted/60"
    )}
    onClick={onClick}
    type="button"
  >
    <span className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-muted font-mono text-[10px] font-semibold text-muted-foreground">
      {mark}
    </span>
    <span className="truncate font-medium">{label}</span>
    {selected ? (
      <CheckIcon className="ml-auto size-3.5 shrink-0" aria-hidden="true" />
    ) : null}
  </button>
);

const DeploymentConfiguration = ({
  agent,
  framework,
}: {
  agent: string;
  framework: FrameworkId;
}) => {
  const [gitProvider, setGitProvider] = useState<GitProvider>("github");
  const [deploymentProvider, setDeploymentProvider] =
    useState<DeploymentProvider>("vercel");
  const [repositoryName, setRepositoryName] = useState(`${agent}-agent`);
  const agentTitle = getAgent(agent)?.shortTitle ?? agent;
  const frameworkLabel = FRAMEWORK_LABEL[framework];

  const handleContinue = (repositoryOnly: boolean) => {
    toast.info("Provider connection is the next implementation step", {
      description: repositoryOnly
        ? `The ${gitProviders.find(({ id }) => id === gitProvider)?.label} repository flow is ready to be connected.`
        : `${agentTitle} is configured for ${deploymentProviders.find(({ id }) => id === deploymentProvider)?.label} with ${frameworkLabel}; OAuth and repository generation still need to be connected.`,
    });
  };

  return (
    <>
      <div className="max-h-[min(60vh,34rem)] space-y-5 overflow-y-auto px-0.5">
        <fieldset className="space-y-2.5">
          <legend className="text-sm font-medium">Save code to</legend>
          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
            {gitProviders.map((provider) => (
              <ProviderButton
                key={provider.id}
                label={provider.label}
                mark={provider.mark}
                onClick={() => setGitProvider(provider.id)}
                selected={gitProvider === provider.id}
              />
            ))}
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
          <label className="space-y-1.5" htmlFor={`repository-name-${agent}`}>
            <span className="text-sm font-medium">Repository name</span>
            <Input
              id={`repository-name-${agent}`}
              onChange={(event) => setRepositoryName(event.target.value)}
              value={repositoryName}
            />
          </label>
          <label className="space-y-1.5" htmlFor={`visibility-${agent}`}>
            <span className="text-sm font-medium">Visibility</span>
            <NativeSelect
              className="w-full"
              defaultValue="private"
              id={`visibility-${agent}`}
            >
              <NativeSelectOption value="private">Private</NativeSelectOption>
              <NativeSelectOption value="public">Public</NativeSelectOption>
            </NativeSelect>
          </label>
        </div>

        <fieldset className="space-y-2.5">
          <legend className="text-sm font-medium">Deploy on</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {deploymentProviders.map((provider) => (
              <ProviderButton
                key={provider.id}
                label={provider.label}
                mark={provider.mark}
                onClick={() => setDeploymentProvider(provider.id)}
                selected={deploymentProvider === provider.id}
              />
            ))}
          </div>
        </fieldset>

        <div className="flex gap-3 rounded-lg border bg-muted/40 p-3">
          <LockIcon
            className="mt-0.5 size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="text-sm font-medium">Secrets stay with your host</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Required environment variables are entered securely during
              deployment and are never committed to the generated repository.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
        <Button
          onClick={() => handleContinue(true)}
          size="sm"
          type="button"
          variant="outline"
        >
          <GlobeIcon />
          Create repository only
        </Button>
        <Button
          disabled={!repositoryName.trim()}
          onClick={() => handleContinue(false)}
          size="sm"
          type="button"
        >
          <RocketIcon />
          Create &amp; deploy
        </Button>
      </div>
    </>
  );
};

const DesktopActions = ({
  agent,
  deployOpen,
  framework,
  installOpen,
  setDeployOpen,
  setInstallOpen,
}: {
  agent: string;
  deployOpen: boolean;
  framework: FrameworkId;
  installOpen: boolean;
  setDeployOpen: (open: boolean) => void;
  setInstallOpen: (open: boolean) => void;
}) => (
  <div className="flex items-center gap-0.5">
    <Popover open={installOpen} onOpenChange={setInstallOpen} sounds>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <UtilityButton label="Add to existing project">
              <SquareTerminalIcon />
            </UtilityButton>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6}>
          Add to existing project
        </TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))]">
        <InstallContent agent={agent} framework={framework} />
      </PopoverContent>
    </Popover>

    <Dialog open={deployOpen} onOpenChange={setDeployOpen} sounds>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <UtilityButton label="Create repository and deploy">
              <RocketIcon />
            </UtilityButton>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6}>
          Create repository and deploy
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create &amp; deploy</DialogTitle>
          <DialogDescription>
            Generate a complete {FRAMEWORK_LABEL[framework]} backend for this
            agent, save it to your Git provider, and deploy it.
          </DialogDescription>
        </DialogHeader>
        <DeploymentConfiguration agent={agent} framework={framework} />
      </DialogContent>
    </Dialog>
  </div>
);

const MobileActions = ({
  agent,
  deployOpen,
  framework,
  installOpen,
  setDeployOpen,
  setInstallOpen,
}: {
  agent: string;
  deployOpen: boolean;
  framework: FrameworkId;
  installOpen: boolean;
  setDeployOpen: (open: boolean) => void;
  setInstallOpen: (open: boolean) => void;
}) => {
  const [actionsOpen, setActionsOpen] = useState(false);
  const commands = getInstallCommands(framework, agent);

  const openAction = (action: "install" | "deploy") => {
    setActionsOpen(false);
    window.setTimeout(() => {
      if (action === "install") {
        setInstallOpen(true);
      } else {
        setDeployOpen(true);
      }
    }, 180);
  };

  return (
    <>
      <Drawer open={actionsOpen} onOpenChange={setActionsOpen} sounds>
        <DrawerTrigger asChild>
          <UtilityButton label="Agent actions">
            <EllipsisIcon />
          </UtilityButton>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Agent actions</DrawerTitle>
            <DrawerDescription>
              Add this agent to a project or create a deployable backend.
            </DrawerDescription>
          </DrawerHeader>
          <div className="grid gap-1 px-4">
            <Button
              className="h-auto justify-start px-3 py-3 text-left"
              onClick={() => openAction("install")}
              type="button"
              variant="ghost"
            >
              <SquareTerminalIcon />
              <span className="grid gap-0.5">
                <span>Add to existing project</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Copy the shadcn install command
                </span>
              </span>
            </Button>
            <Button
              className="h-auto justify-start px-3 py-3 text-left"
              onClick={() => openAction("deploy")}
              type="button"
              variant="ghost"
            >
              <RocketIcon />
              <span className="grid gap-0.5">
                <span>Create repository and deploy</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Generate a complete backend
                </span>
              </span>
            </Button>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button size="sm" variant="outline">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={installOpen} onOpenChange={setInstallOpen} sounds>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Add to an existing project</DrawerTitle>
            <DrawerDescription>
              Install the {FRAMEWORK_LABEL[framework]} agent with the shadcn
              CLI.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4">
            <CodeBlockCommand
              __bun__={commands.bun}
              __npm__={commands.npm}
              __pnpm__={commands.pnpm}
              __yarn__={commands.yarn}
              copyEvent="copy_registry_command"
            />
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button size="sm">Done</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={deployOpen} onOpenChange={setDeployOpen} sounds>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader>
            <DrawerTitle>Create &amp; deploy</DrawerTitle>
            <DrawerDescription>
              Generate a complete {FRAMEWORK_LABEL[framework]} backend, save it
              to your Git provider, and deploy it.
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-4">
            <DeploymentConfiguration agent={agent} framework={framework} />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export const AgentPreviewActions = ({
  agent,
  framework,
}: {
  agent: string;
  framework: FrameworkId;
}) => {
  const [installOpen, setInstallOpen] = useState(false);
  const [deployOpen, setDeployOpen] = useState(false);
  const isMobile = useIsMobile();

  const props = {
    agent,
    deployOpen,
    framework,
    installOpen,
    setDeployOpen,
    setInstallOpen,
  };

  return isMobile ? (
    <MobileActions {...props} />
  ) : (
    <DesktopActions {...props} />
  );
};
