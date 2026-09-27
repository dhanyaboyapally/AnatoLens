import { z } from "zod";
import { authenticateRequest } from "../../../../../lib/api-auth";

const answerSchema = z.object({
  question_id: z.string().uuid(),
  selected_option: z.number().int().min(0).max(50),
});

export async function POST(
  request: Request,
  routeContext: { params: Promise<{ sessionId: string }> },
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid quiz answer request." }, { status: 400 });
  }

  const parsed = answerSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "A quiz answer needs a question_id and selected_option." },
      { status: 400 },
    );
  }

  const context = await authenticateRequest(request, "the quiz");
  if (context instanceof Response) return context;

  const { sessionId } = await routeContext.params;
  try {
    const { data: session, error: sessionError } = await context.client
      .from("quiz_sessions")
      .select("id,completed_at")
      .eq("id", sessionId)
      .eq("user_id", context.user.id)
      .single();

    if (sessionError || !session) {
      return Response.json({ error: "Quiz session not found." }, { status: 404 });
    }
    if (session.completed_at) {
      return Response.json({ error: "This quiz session is already complete." }, { status: 409 });
    }

    const { data: question, error: questionError } = await context.client
      .from("quiz_questions")
      .select("correct_option,options")
      .eq("id", parsed.data.question_id)
      .single();
    if (questionError || !question) {
      return Response.json({ error: "Quiz question not found." }, { status: 404 });
    }

    const options = Array.isArray(question.options) ? question.options : [];
    if (parsed.data.selected_option >= options.length) {
      return Response.json({ error: "The selected option is not valid." }, { status: 400 });
    }

    const { data: sessionQuestion, error: linkError } = await context.client
      .from("quiz_session_questions")
      .select("id")
      .eq("session_id", sessionId)
      .eq("question_id", parsed.data.question_id)
      .single();
    if (linkError || !sessionQuestion) {
      return Response.json({ error: "Question is not part of this quiz session." }, { status: 400 });
    }

    const { data, error } = await context.client
      .from("quiz_session_questions")
      .update({
        selected_option: parsed.data.selected_option,
        is_correct: parsed.data.selected_option === question.correct_option,
        answered_at: new Date().toISOString(),
      })
      .eq("id", sessionQuestion.id)
      .select("id,question_id,selected_option,answered_at")
      .single();

    if (error) throw error;
    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save quiz answer." },
      { status: 500 },
    );
  }
}
