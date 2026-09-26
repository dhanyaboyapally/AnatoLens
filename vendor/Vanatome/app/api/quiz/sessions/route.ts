import { z } from "zod";
import { authenticateRequest } from "../../../lib/api-auth";
import { ensurePublicUser } from "../../../lib/notes";
import { serializeQuizQuestion, type QuizQuestionRow } from "../../../lib/quiz";

const createSessionSchema = z.object({
  organ_id: z.string().trim().min(1).max(100),
  question_count: z.number().int().min(1).max(20).default(5),
});

type QuizSessionRow = {
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
};

async function parseJson(request: Request): Promise<unknown | Response> {
  try {
    return await request.json();
  } catch {
    return Response.json({ error: "Invalid quiz session request." }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const body = await parseJson(request);
  if (body instanceof Response) return body;

  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "A quiz session needs a valid organ_id and question_count." },
      { status: 400 },
    );
  }

  const context = await authenticateRequest(request, "the quiz");
  if (context instanceof Response) return context;

  try {
    await ensurePublicUser(context.user, context.client);
    const { data: questionData, error: questionError } = await context.client
      .from("quiz_questions")
      .select("id,organ_id,question,options")
      .eq("organ_id", parsed.data.organ_id)
      .eq("active", true)
      .order("created_at", { ascending: true })
      .limit(parsed.data.question_count);

    if (questionError) throw questionError;
    const questions = (questionData ?? []) as QuizQuestionRow[];
    if (questions.length === 0) {
      return Response.json(
        { error: "No active quiz questions exist for this organ." },
        { status: 404 },
      );
    }

    const { data: sessionData, error: sessionError } = await context.client
      .from("quiz_sessions")
      .insert({
        user_id: context.user.id,
        organ_id: parsed.data.organ_id,
        total_questions: questions.length,
      })
      .select("id,user_id,organ_id,score,total_questions,started_at,completed_at,created_at")
      .single();

    if (sessionError) throw sessionError;
    const session = sessionData as QuizSessionRow;
    const sessionQuestions = questions.map((question, index) => ({
      session_id: session.id,
      question_id: question.id,
      question_order: index + 1,
    }));
    const { data: linkData, error: linkError } = await context.client
      .from("quiz_session_questions")
      .insert(sessionQuestions)
      .select("id,session_id,question_id,question_order");

    if (linkError) {
      await context.client.from("quiz_sessions").delete().eq("id", session.id);
      throw linkError;
    }

    const links = (linkData ?? []) as SessionQuestionRow[];
    return Response.json(
      {
        session,
        questions: links
          .map((link) => ({
            session_question_id: link.id,
            question_order: link.question_order,
            ...serializeQuizQuestion(
              questions.find((question) => question.id === link.question_id)!,
            ),
          }))
          .sort((a, b) => a.question_order - b.question_order),
      },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to create quiz session." },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const context = await authenticateRequest(request, "quiz history");
  if (context instanceof Response) return context;

  try {
    const { data, error } = await context.client
      .from("quiz_sessions")
      .select("id,user_id,organ_id,score,total_questions,started_at,completed_at,created_at")
      .eq("user_id", context.user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return Response.json(data ?? []);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load quiz history." },
      { status: 500 },
    );
  }
}
