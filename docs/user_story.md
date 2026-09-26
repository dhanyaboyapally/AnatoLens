# Project: AnatomyLens

## Project Overview
AnatomyLens is an AI-powered 3D anatomy learning tool for medical students.

Students can explore a 3D human body, click anatomical structures, ask questions, learn topics through guided AI lessons, and test themselves with interactive quizzes.

## Hackathon Scope
This project is being built as a hackathon MVP.

The goal is to prove that the core experience works, not to build a production-ready medical platform.

### MVP Constraints
- Support only 1–2 users
- No need to optimize for scale
- Basic authentication is enough, or no authentication if unnecessary (optional)
- No need for advanced security or compliance
- No need for perfect medical coverage
- Use existing 3D anatomy models instead of creating our own
- Focus only on making the main demo flow work smoothly
- Prefer simple solutions over production-level architecture

---

# Core Features

## 1. Interactive 3D Human Body
As a medical student, I want to explore a 3D human body so that I can understand anatomy visually.

### User can:
- Rotate the body
- Zoom in and out
- Hide/show anatomy layers
- Click individual structures
- Highlight selected structures

---

## 2. Point & Ask
As a medical student, I want to click any body structure and ask questions about it without needing to know its name.

### Example
Student clicks a structure and asks:
- What is this?
- What does it do?
- Why is it important?
- What is connected to it?

The AI should understand which structure is selected and answer based on it.

---

## 3. AI Teach Me Mode
As a medical student, I want the AI to teach me a topic while controlling the 3D model.

### Example
User enters:

`Teach me the heart`

The system should:
1. Locate the heart
2. Zoom into it
3. Highlight important structures
4. Explain them step by step
5. Move between structures as the lesson continues

---

## 4. Interactive Anatomy Quiz
As a medical student, I want to test myself directly on the 3D model.

### Quiz Flow
1. AI asks the student to find a structure
2. Labels are hidden
3. Student clicks a structure
4. App checks the answer
5. App shows whether it is correct
6. AI gives a short explanation

---

# MVP Demo Flow

1. Open the 3D human body
2. Rotate and explore the model
3. Click the heart
4. Ask: `What does this do?`
5. AI explains the heart
6. Start: `Teach me the heart`
7. AI zooms and highlights different structures
8. Start a quiz
9. AI asks the student to identify a structure
10. Student clicks the answer and receives feedback

## Success Criteria
The hackathon MVP is successful if the full demo flow works from start to finish, even with limited anatomy data and only a small number of users.