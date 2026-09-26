# Progress Feature

## Goal

Track what each medical student studies and how they perform in quizzes.

## Question Bank

Questions are stored once and reused for quizzes.

Each question contains:

- `id`
- `organ_id` — the Vanatome structure keyword
- `question`
- `options`
- `correct_option`
- `explanation`
- `active`

Questions are filtered by the selected organ. The app does not generate a new question every time.

## Quiz Records

`quiz_sessions` stores each quiz attempt:

- `id`
- `user_id`
- `organ_id`
- `score`
- `total_questions`
- `started_at`
- `completed_at`

`quiz_answers` stores the answers for each session:

- `session_id`
- `question_id`
- `selected_option`
- `is_correct`

## Study Records

`study_sessions` stores learning activity:

- `id`
- `user_id`
- `organ_id`
- `started_at`
- `ended_at`
- `duration`

Progress is calculated from quiz and study records instead of storing duplicate totals.

## Progress View

The student can see:

- Organs studied
- Quiz sessions completed
- Best and average scores
- Last studied date
- Topics that need review

## 3D Progress Highlighting

Progress uses the stable Vanatome `organ_id`, not the display name.

The 3D model can highlight:

- Studied organs
- Organs used in quizzes
- Strong areas
- Areas needing review

If another 3D model uses different IDs, create a mapping between its IDs and the Vanatome IDs.

## Implementation Order

1. Store the question bank.
2. Save quiz sessions and answers.
3. Save study sessions.
4. Build the progress view.
5. Add progress highlighting to the 3D model.
