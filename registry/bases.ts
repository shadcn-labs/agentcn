import { EveIcon, FlueIcon, MastraIcon } from "@/components/icons";

export interface Base {
  name: string;
  type: string;
  title: string;
  description: string;
  meta?: {
    logo?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  };
}

export const BASES: Base[] = [
  {
    description:
      "Optimized for fast development, easy maintenance, and accessibility.",
    meta: {
      logo: EveIcon,
    },
    name: "eve",
    title: "Eve",
    type: "registry:style",
  },
  {
    description:
      "Components for building accessible web apps and design systems.",
    meta: {
      logo: FlueIcon,
    },
    name: "flue",
    title: "Flue",
    type: "registry:style",
  },
  {
    description:
      "Opinionated TypeScript framework for rapidly building AI applications with workflows, agents, RAG, and evals.",
    meta: {
      logo: MastraIcon,
    },
    name: "mastra",
    title: "Mastra",
    type: "registry:style",
  },
];
