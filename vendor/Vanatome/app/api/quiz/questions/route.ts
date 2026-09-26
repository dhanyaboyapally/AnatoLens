import { z } from "zod";
import { authenticateRequest } from "../../../lib/api-auth";
import { serializeQuizQuestion, type QuizQuestionRow } from "../../../lib/quiz";
const querySchema = z.object({
  organId: z.string().trim().min(1).max(100),
});

export async function GET(request: Request) {
  const context = await authenticateRequest(request, "the quiz");
  if (context instanceof Response) return context;

  const parsed = querySchema.safeParse({
    organId: new URL(request.url).searchParams.get("organ_id"),
  });
  if (!parsed.success) {
    return Response.json({ error: "A valid organ_id is required." }, { status: 400 });
  }

  try {
    const { data, error } = await context.client
      .from("quiz_questions")
      .select("id,organ_id,question,options")
      .eq("organ_id", parsed.data.organId)
      .eq("active", true)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return Response.json((data as QuizQuestionRow[]).map(serializeQuizQuestion));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load quiz questions." },
      { status: 500 },
    );
  }
}
