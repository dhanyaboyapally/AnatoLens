# AI Chat Feature

## Goal
The AI chat helps students learn anatomy while interacting with the 3D human body.

The AI should understand:
- what body structure is currently selected
- what the student is asking
- when it should control the 3D model

---

## Core Behavior

### 1. Ask About Selected Structure
If the student clicks a structure, the AI receives that structure as context.

Example:

Selected: `Median Nerve`

User:
`What does this do?`

AI:
Explains the median nerve without asking the user to type its name.

---

### 2. General Anatomy Questions
Students can ask normal anatomy questions.

Examples:
- `What does the heart do?`
- `What muscles help bend the elbow?`
- `What is behind the stomach?`

The AI gives a short, student-friendly answer.

---

### 3. Control the 3D Model
The AI can trigger actions on the anatomy model.

Supported actions for MVP:

- `focus(structure)`
- `highlight(structure)`
- `hide(structure)`
- `show(structure)`
- `isolate(structure)`
- `resetView()`

Example:

User:
`Show me the heart`

AI should:
1. Find the heart
2. Focus the camera on it
3. Highlight it
4. Explain what it is

---

### 4. Teach Me Mode
The student can ask the AI to teach a body part.

Example:

`Teach me the heart`

The AI should:
1. Focus on the heart
2. Explain the main function
3. Highlight important structures one by one
4. Explain each structure briefly

For the MVP, lessons should be short and simple.

---

## AI Context

Each AI request should include:

- User message
- Currently selected structure
- Visible anatomy systems
- Current mode
- Available 3D actions

Example:

```json
{
  "message": "What does this do?",
  "selectedStructure": "Median Nerve",
  "mode": "chat"
}