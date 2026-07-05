import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/routes";

export const Announcement = () => (
  <Badge asChild variant="secondary">
    <Link href={`${ROUTES.DOCS_AGENTS}/mastra`}>
      Mastra support is here <ArrowRightIcon />
    </Link>
  </Badge>
);
