"use server";

import { eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { z } from "zod";

import { getSession } from "@/lib/community/session";
import { db } from "@/lib/db";
import { agentTag, communityAgent } from "@/lib/db/schema";

// Unambiguous, URL-safe alphabet (no 0/O/1/l/I) for shareable install codes.
const makeCode = customAlphabet(
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
  8
);
const makeId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 21);

const fileSchema = z.object({
  content: z.string().min(1).max(100_000),
  path: z.string().trim().min(1).max(200),
  target: z.string().trim().max(200).optional(),
  type: z.string().trim().min(1).max(50).default("registry:file"),
});

const publishSchema = z.object({
  dependencies: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
  description: z.string().trim().min(2).max(300),
  files: z.array(fileSchema).min(1).max(40),
  framework: z.enum(["eve", "flue"]),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(8),
  title: z.string().trim().min(2).max(80),
});

export type PublishInput = z.input<typeof publishSchema>;

export type PublishResult =
  | { ok: true; code: string }
  | { ok: false; error: string };

const generateUniqueCode = async (): Promise<string> => {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = makeCode();
    const [existing] = await db
      .select({ code: communityAgent.code })
      .from(communityAgent)
      .where(eq(communityAgent.code, code))
      .limit(1);
    if (!existing) {
      return code;
    }
  }
  throw new Error("Could not allocate a unique code");
};

export const publishAgent = async (
  input: PublishInput
): Promise<PublishResult> => {
  const session = await getSession();
  if (!session) {
    return { error: "You must be signed in to publish.", ok: false };
  }

  const parsed = publishSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid submission.",
      ok: false,
    };
  }
  const { data } = parsed;

  // De-duplicate tags while preserving order.
  const tags = [...new Set(data.tags)].filter(Boolean);

  try {
    const code = await generateUniqueCode();
    const id = makeId();

    await db.insert(communityAgent).values({
      authorId: session.user.id,
      code,
      dependencies: data.dependencies ?? [],
      description: data.description,
      files: data.files.map((file) => ({
        content: file.content,
        path: file.path,
        target: file.target,
        type: file.type,
      })),
      framework: data.framework,
      id,
      title: data.title,
    });

    if (tags.length > 0) {
      await db
        .insert(agentTag)
        .values(tags.map((tag) => ({ agentId: id, tag })));
    }

    return { code, ok: true };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("publishAgent failed:", error);
    return {
      error: "Couldn't publish right now. Is the database configured?",
      ok: false,
    };
  }
};
