import { authenticateRequest } from "../../../../../lib/api-auth";

export async function POST(
  request: Request,
  routeContext: { params: Promise<{ sessionId: string }> },
) {
  const context = await authenticateRequest(request, "the quiz");
  if (context instanceof Response) return context;

  const { sessionId } = await routeContext.params;
  try {
    const { data: session, error: sessionError } = await context.client
      .from("quiz_sessions")
      .select("id,user_id,organ_id,score,total_questions,started_at,completed_at,created_at")
      .eq("id", sessionId)
      .eq("user_id", context.user.id)
      .single();

    if (sessionError || !session) {
      return Response.json({ error: "Quiz session not found." }, { status: 404 });
    }
    if (session.completed_at) {
      return Response.json({
        session,
        score: session.score,
        total_questions: session.total_questions,
      });
    }

    const { data: answers, error: answersError } = await context.client
      .from("quiz_session_questions")
      .select("is_correct")
      .eq("session_id", sessionId);
    if (answersError) throw answersError;

    const answerRows = answers ?? [];
    if (answerRows.some((answer) => answer.is_correct === null)) {
      return Response.json({ error: "Answer every question before completing the quiz." }, { status: 409 });
    }

    const score = answerRows.filter((answer) => answer.is_correct === true).length;
    const completedAt = new Date().toISOString();
    const { data: completedSession, error: updateError } = await context.client
      .from("quiz_sessions")
      .update({ score, completed_at: completedAt })
      .eq("id", sessionId)
      .eq("user_id", context.user.id)
      .select("id,user_id,organ_id,score,total_questions,started_at,completed_at,created_at")
      .single();

    if (updateError) throw updateError;
    return Response.json({
      session: completedSession,
      score,
      total_questions: session.total_questions,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to complete quiz session." },
      { status: 500 },
    );
  }
}
