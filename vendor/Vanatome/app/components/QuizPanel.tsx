import { CheckCircle2, RotateCcw, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import type { AnatomyStructure } from "../data/anatomy";

type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
};

const QUESTION_BANK: Record<string, QuizQuestion[]> = {
  heart: [
    { question: "What is the primary function of the heart?", options: ["Store bile", "Pump blood", "Exchange gases", "Filter urine"], answer: "Pump blood" },
    { question: "How many chambers does the heart have?", options: ["Two", "Three", "Four", "Six"], answer: "Four" },
    { question: "Which system does the heart belong to?", options: ["Digestive", "Cardiovascular", "Respiratory", "Nervous"], answer: "Cardiovascular" },
  ],
  lungs: [
    { question: "What is the main function of the lungs?", options: ["Digest food", "Exchange gases", "Produce insulin", "Store blood"], answer: "Exchange gases" },
    { question: "Which gas moves from the lungs into the bloodstream?", options: ["Oxygen", "Nitrogen", "Helium", "Hydrogen"], answer: "Oxygen" },
  ],
  liver: [
    { question: "Which substance does the liver produce to help digest fats?", options: ["Bile", "Insulin", "Saliva", "Mucus"], answer: "Bile" },
    { question: "Where is most of the liver located?", options: ["Upper-right abdomen", "Lower-left pelvis", "Center of the skull", "Posterior thorax"], answer: "Upper-right abdomen" },
  ],
};

const FALLBACK_QUESTIONS: QuizQuestion[] = [
  { question: "Which body system contains this structure?", options: ["Cardiovascular", "Digestive", "Respiratory", "Nervous"], answer: "Digestive" },
  { question: "What is the best first step when studying this structure?", options: ["Identify its location", "Ignore its relationships", "Study without a model", "Memorize unrelated facts"], answer: "Identify its location" },
  { question: "Which detail is most useful for understanding an organ?", options: ["Its function", "Its screen position", "Its file name", "Its display color"], answer: "Its function" },
];

type QuizPanelProps = {
  selectedStructure: AnatomyStructure | null;
};

export function QuizPanel({ selectedStructure }: QuizPanelProps) {
  const questions = selectedStructure
    ? QUESTION_BANK[selectedStructure.id] ?? FALLBACK_QUESTIONS
    : [];
  const [started, setStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<string | null>(null);

  useEffect(() => {
    setStarted(false);
    setQuestionIndex(0);
    setScore(0);
    setAnswered(null);
  }, [selectedStructure?.id]);

  if (!selectedStructure) {
    return <div className="quiz-empty">Select a structure in the model to begin a quiz.</div>;
  }

  const currentQuestion = questions[questionIndex];
  const isComplete = started && questionIndex >= questions.length;

  const startQuiz = () => {
    setStarted(true);
    setQuestionIndex(0);
    setScore(0);
    setAnswered(null);
  };

  const answerQuestion = (option: string) => {
    if (answered) return;
    setAnswered(option);
    if (option === currentQuestion.answer) setScore((value) => value + 1);
    window.setTimeout(() => {
      setQuestionIndex((value) => value + 1);
      setAnswered(null);
    }, 350);
  };

  if (!started) {
    return (
      <div className="quiz-panel-content">
        <span className="eyebrow">KNOWLEDGE CHECK</span>
        <h2>{selectedStructure.name}</h2>
        <p className="summary">Test your understanding with a short set of questions about this structure.</p>
        <button type="button" className="quiz-primary-action" onClick={startQuiz}>START QUIZ</button>
        <span className="quiz-meta">{questions.length} QUESTIONS</span>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="quiz-panel-content quiz-scoreboard">
        <Trophy size={32} />
        <span className="eyebrow">QUIZ COMPLETE</span>
        <h2>{score} / {questions.length}</h2>
        <p className="summary">Your score for {selectedStructure.name}.</p>
        <button type="button" className="quiz-primary-action" onClick={startQuiz}><RotateCcw size={14} /> TRY AGAIN</button>
      </div>
    );
  }

  return (
    <div className="quiz-panel-content">
      <div className="quiz-progress"><span>QUESTION {questionIndex + 1} OF {questions.length}</span><strong>{score} correct</strong></div>
      <h3>{currentQuestion.question}</h3>
      <div className="quiz-options">
        {currentQuestion.options.map((option) => (
          <button
            type="button"
            key={option}
            className={answered === option ? "selected" : ""}
            onClick={() => answerQuestion(option)}
            disabled={Boolean(answered)}
          >
            {answered === option && <CheckCircle2 size={14} />}
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
