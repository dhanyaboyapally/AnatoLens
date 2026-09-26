import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

const structureSchema = z.object({
  id: z.string(),
  name: z.string(),
  system: z.string(),
  layer: z.string(),
  parentId: z.string().nullable().optional(),
  summary: z.string().optional(),
  function: z.string().optional(),
  fact: z.string().optional(),
});

const requestSchema = z.object({
  messages: z.array(z.unknown()).max(40),
  selectedStructure: structureSchema.nullable(),
  visibleSystems: z.array(z.string()),
  mode: z.string(),
  structureCatalog: z.array(structureSchema).max(2500),
});

type ChatStructure = z.infer<typeof structureSchema>;

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function findStructure(query: string, catalog: ChatStructure[]) {
  const needle = normalize(query);
  if (!needle) return undefined;

  const exact = catalog.find((structure) =>
    normalize(structure.id) === needle || normalize(structure.name) === needle,
  );
  if (exact) return exact;

  const words = needle.split(" ").filter(Boolean);
  return catalog
    .map((structure) => {
      const haystack = `${normalize(structure.name)} ${normalize(structure.id)}`;
      const score = words.reduce(
        (total, word) => total + (haystack.includes(word) ? 1 : 0),
        0,
      );
      return { structure, score };
    })
    .filter(({ score }) => score === words.length)
    .sort((a, b) => a.structure.name.length - b.structure.name.length)[0]
    ?.structure;
}

function buildInstructions({
  selectedStructure,
  visibleSystems,
  mode,
  structureCatalog,
}: {
  selectedStructure: ChatStructure | null;
  visibleSystems: string[];
  mode: string;
  structureCatalog: ChatStructure[];
}) {
  const catalog = structureCatalog
    .map(({ id, name, system, layer, parentId }) =>
      JSON.stringify({ id, name, system, layer, parentId }),
    )
    .join("\n");

  return `You are AnatomyAI, a patient anatomy teacher connected to a 3D human atlas.

Teaching rules:
- Explain in short, student-friendly paragraphs.
- Use the current selected structure when the student says "this", "it", or asks a follow-up question.
- For "teach me" requests, teach in a clear sequence: location, main function, important relationships, and one useful clinical or study note.
- Ground structure names and navigation targets in the supplied atlas catalog. Do not invent atlas IDs.
- If the requested structure is found, call focusStructure before explaining it.
- If it is not found, say so and ask the student to choose a visible structure or clarify the name.
- The current mode is: ${mode}.
- Visible systems: ${visibleSystems.join(", ") || "none provided"}.

Currently selected structure:
${selectedStructure ? JSON.stringify(selectedStructure) : "None"}

Atlas structures available for lookup:
${catalog}`;
}

export const maxDuration = 30;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON request." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid anatomy chat request." }, { status: 400 });
  }

  const {
    messages,
    selectedStructure,
    visibleSystems,
    mode,
    structureCatalog,
  } = parsed.data;
  const openai = createOpenAI({ apiKey });

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: buildInstructions({
      selectedStructure,
      visibleSystems,
      mode,
      structureCatalog,
    }),
    messages: await convertToModelMessages(messages as UIMessage[]),
    stopWhen: stepCountIs(3),
    tools: {
      focusStructure: tool({
        description:
          "Find an anatomy structure in the atlas, select it, and focus the 3D viewer on it.",
        inputSchema: z.object({
          query: z.string().describe("The structure name requested by the student"),
        }),
        execute: async ({ query }) => {
          const structure = findStructure(query, structureCatalog);
          if (!structure) {
            return { found: false, query };
          }
          return {
            found: true,
            action: "focus",
            structureId: structure.id,
            structureName: structure.name,
            structure,
          };
        },
      }),
    },
  });

  return createUIMessageStreamResponse({
    stream: result.toUIMessageStream(),
  });
}
