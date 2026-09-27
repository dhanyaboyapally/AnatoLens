import { authenticateRequest } from "../../../../lib/api-auth";
import { serializeQuizQuestion, type QuizQuestionRow } from "../../../../lib/quiz";

type SessionRow = {
  id: string;
  user_id: string;
  organ_id: string;
  score: number;
  total_questions: number;
  started_at: string;
  completed_at: string | null;
  created_at: string;
};

type SessionQuestionRow = {
  id: string;
  session_id: string;
  question_id: string;
  question_order: number;
  selected_option: number | null;
  is_correct: boolean | null;
  answered_at: string | null;
};

export async function GET(
  request: Request,
  routeContext: { params: Promise<{ sessionId: string }> },
) {
  const context = await authenticateRequest(request, "quiz history");
  if (context instanceof Response) return context;

  const { sessionId } = await routeContext.params;
  if (!sessionId) {
    return Response.json({ error: "A quiz session id is required." }, { status: 400 });
  }

  try {
    const { data: sessionData, error: sessionError } = await context.client
      .from("quiz_sessions")
      .select("id,user_id,organ_id,score,total_questions,started_at,completed_at,created_at")
      .eq("id", sessionId)
      .eq("user_id", context.user.id)
      .single();

    if (sessionError || !sessionData) {
      return Response.json({ error: "Quiz session not found." }, { status: 404 });
    }

    const { data: linkData, error: linkError } = await context.client
      .from("quiz_session_questions")
      .select("id,session_id,question_id,question_order,selected_option,is_correct,answered_at")
      .eq("session_id", sessionId)
      .order("question_order", { ascending: true });

    if (linkError) throw linkError;
    const links = (linkData ?? []) as SessionQuestionRow[];
    const questionIds = links.map((link) => link.question_id);
    const { data: questionData, error: questionError } = questionIds.length
      ? await context.client
        .from("quiz_questions")
        .select("id,organ_id,question,options")
        .in("id", questionIds)
      : { data: [], error: null };

    if (questionError) throw questionError;
    const questions = new Map(
      (questionData as QuizQuestionRow[]).map((question) => [question.id, question]),
    );

    return Response.json({
      session: sessionData as SessionRow,
      questions: links.flatMap((link) => {
        const question = questions.get(link.question_id);
        return question
          ? [{
            session_question_id: link.id,
            question_order: link.question_order,
            selected_option: link.selected_option,
            is_correct: link.is_correct,
            answered_at: link.answered_at,
            ...serializeQuizQuestion(question),
          }]
          : [];
      }),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load quiz session." },
      { status: 500 },
    );
  }
}
