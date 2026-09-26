import { authenticateRequest } from "../../lib/api-auth";

type QuizSession = {
  id: string;
  organ_id: string;
  score: number;
  total_questions: number;
  started_at: string;
  completed_at: string | null;
  created_at: string;
};

export async function GET(request: Request) {
  const context = await authenticateRequest(request, "learning progress");
  if (context instanceof Response) return context;

  try {
    const { data, error } = await context.client
      .from("quiz_sessions")
      .select("id,organ_id,score,total_questions,started_at,completed_at,created_at")
      .eq("user_id", context.user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    const sessions = (data ?? []) as QuizSession[];
    const completedSessions = sessions.filter((session) => session.completed_at);
    const answeredQuestions = completedSessions.reduce(
      (total, session) => total + session.total_questions,
      0,
    );
    const correctAnswers = completedSessions.reduce(
      (total, session) => total + session.score,
      0,
    );

    return Response.json({
      summary: {
        organs_studied: new Set(completedSessions.map((session) => session.organ_id)).size,
        quiz_accuracy: answeredQuestions
          ? Math.round((correctAnswers / answeredQuestions) * 100)
          : 0,
        completed_quizzes: completedSessions.length,
      },
      quiz_sessions: sessions,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load learning progress." },
      { status: 500 },
    );
  }
}
