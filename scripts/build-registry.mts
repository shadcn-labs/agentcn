/**
 * Builds the agent recipe registries.
 *
 * Recipes are organised by framework under `registry/eve/<name>` and
 * `registry/flue/<name>`. Each agent ships a `registry.json` describing a single
 * `registry:block`. We read every referenced file, inline its content, and emit
 * a shadcn registry-item document to `public/r/<framework>/<name>.json` so it
 * can be installed with
 * `npx shadcn@latest add https://agentcn.vercel.app/r/<framework>/<name>`.
 *
 * We also write the published manifest at `public/r/registry.json` so it
 * references every block across both frameworks.
 */
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");
const REGISTRY_DIR = path.join(ROOT, "registry");
const OUTPUT_DIR = path.join(ROOT, "public", "r");

const FRAMEWORKS = ["eve", "flue", "mastra"] as const;

const REGISTRY_ITEM_SCHEMA = "https://ui.shadcn.com/schema/registry-item.json";

type Framework = (typeof FRAMEWORKS)[number];

interface RegistryFile {
  path: string;
  type: string;
  target?: string;
}

interface AgentRegistry {
  name: string;
  type: string;
  title: string;
  description: string;
  framework: Framework;
  files: RegistryFile[];
  dependencies?: string[];
}

interface ManifestItem {
  name: string;
  type: string;
  title: string;
  description: string;
  framework?: Framework;
}

const listAgentDirs = async (framework: Framework): Promise<string[]> => {
  const frameworkDir = path.join(REGISTRY_DIR, framework);

  const entries = await readdir(frameworkDir, { withFileTypes: true }).catch(
    () => null
  );
  if (!entries) {
    return [];
  }

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(frameworkDir, entry.name));
};

const buildAgent = async (
  framework: Framework,
  agentDir: string
): Promise<ManifestItem> => {
  const manifestPath = path.join(agentDir, "registry.json");
  const registry = JSON.parse(
    await readFile(manifestPath, "utf-8")
  ) as AgentRegistry;

  const files = await Promise.all(
    registry.files.map(async (file) => ({
      content: await readFile(path.join(agentDir, file.path), "utf-8"),
      path: file.path,
      // The recipe-relative path is also the install target inside the
      // consumer's Eve/Flue project (e.g. `agent/agent.ts`).
      target: file.target ?? file.path,
      type: file.type,
    }))
  );

  const item = {
    $schema: REGISTRY_ITEM_SCHEMA,
    description: registry.description,
    files,
    name: registry.name,
    title: registry.title,
    type: registry.type,
    ...(registry.dependencies ? { dependencies: registry.dependencies } : {}),
  };

  const outDir = path.join(OUTPUT_DIR, framework);
  await mkdir(outDir, { recursive: true });
  await writeFile(
    path.join(outDir, `${registry.name}.json`),
    `${JSON.stringify(item, null, 2)}\n`
  );

  // eslint-disable-next-line no-console
  console.log(`✓ built r/${framework}/${registry.name}.json`);

  return {
    description: registry.description,
    framework,
    name: `${framework}/${registry.name}`,
    title: registry.title,
    type: registry.type,
  };
};

const writeManifest = async (agentItems: ManifestItem[]): Promise<void> => {
  const manifest = {
    homepage: "https://agentcn.vercel.app",
    items: agentItems,
    name: "agentcn",
  };

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(
    path.join(OUTPUT_DIR, "registry.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  );

  // eslint-disable-next-line no-console
  console.log(`✓ wrote r/registry.json (${agentItems.length} blocks)`);
};

const main = async (): Promise<void> => {
  const agentItems: ManifestItem[] = [];

  for (const framework of FRAMEWORKS) {
    const agentDirs = await listAgentDirs(framework);
    for (const agentDir of agentDirs) {
      agentItems.push(await buildAgent(framework, agentDir));
    }
  }

  await writeManifest(agentItems);
};

await main();
