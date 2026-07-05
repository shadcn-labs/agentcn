import { AgentInstallTabs } from "@/components/agent-install-tabs";
import { Announcement } from "@/components/announcement";
import { HomeAgentPreview } from "@/components/home-agent-preview";
import { HomeCtas } from "@/components/home-ctas";
import { PageTransition } from "@/components/page-transition";
import { ROUTES } from "@/constants/routes";
import { BreadcrumbJsonLd } from "@/seo/json-ld";

export const dynamic = "force-static";
export const revalidate = false;

export default function IndexPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Home", path: ROUTES.HOME }]} />
      <PageTransition>
        <section className="container-wrapper relative">
          <div className="container flex flex-col items-center gap-4 py-16 text-center md:py-20 lg:py-24">
            <Announcement />

            <h1 className="max-w-7xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl from-foreground via-foreground to-foreground/65 bg-linear-to-b bg-clip-text text-transparent">
              Production-ready agents, made simple
            </h1>

            <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Ready to use, customizable AI agent recipes.
              <br className="hidden sm:block" />
              Built on Eve, Flue, and Mastra. Distributed via shadcn.
            </p>

            <AgentInstallTabs className="mt-4 w-full max-w-xl" />

            <HomeCtas className="mt-4" />
          </div>
        </section>

        <section className="container-wrapper pb-8 lg:pb-12">
          <div className="container">
            <HomeAgentPreview />
          </div>
        </section>
      </PageTransition>
    </>
  );
}
