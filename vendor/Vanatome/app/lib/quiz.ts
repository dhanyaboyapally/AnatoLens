export type QuizQuestionRow = {
  id: string;
  organ_id: string;
  question: string;
  options: unknown;
};

export function serializeQuizQuestion(question: QuizQuestionRow) {
  return {
    id: question.id,
    organ_id: question.organ_id,
    question: question.question,
    options: Array.isArray(question.options) ? question.options : [],
  };
}
