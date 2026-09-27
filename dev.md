# Project Name:
**AnatomyLens**
# One line elevator pitch:
**AnatomyLens - explore the human body, ask questions, and learn anatomy where it actually lives.**

<!-- On the 2nd page -->
# Inspiration

Medical students often learn anatomy from flat diagrams and disconnected resources. I wanted to make learning more visual, interactive, and powered by AI.

# What it does

AnatomyLens is an AI-powered 3D anatomy learning tool. Students can:

- Explore the human body
- Select anatomical structures
- Ask questions through chat (which include image/video/diagram/voice)
- Add notes on a specific organ/gland
- Take interactive quizzes
- Track user's learning progress

# How I built it

**Core technology:** I built the application with React, Next.js, TypeScript, Three.js, OpenAI through the Vercel AI SDK, the ElevenLabs API, and Supabase. The main learning loop is simple:

1. The student selects a structure in the 3D body.
2. They ask a question or start a lesson.
3. The AI explains the structure and controls the model.
4. The student practices with a quiz.
5. Their activity is saved to their progress dashboard.

**3D anatomy model:** I used a prebuilt 3D human anatomy model and integrated it into a Three.js scene. Each selectable mesh is connected to a stable anatomy ID and a local structure catalog containing:

- Structure names and aliases
- Body systems and regions
- Descriptions and functions
- Clinical notes

I added the main interaction features needed for learning:

- Rotation
- Zoom controls
- Drag controls

This allows students to move from a full-body view to a focused structure without leaving the lesson.

**AI chat and teaching:** I built the AI chat as a teaching layer on top of the 3D model. It currently uses OpenAI GPT-4o mini through the Vercel AI SDK. The bot receives the student's message, selected structure, visible body systems, learning mode, and available structure catalog.

The AI then:

- Resolves anatomy terms and aliases
- Understands follow-up references such as "this" or "it"
- Explains structures in student-friendly language
- Returns actions for the 3D scene

Supported model actions include focus, highlight, trace, hide, show, isolate, rotate, zoom, and reset.

**Voice and visual learning:** I connected the ElevenLabs API for voice output. The app sends the AI response to a server route, streams the generated audio, and plays it in the browser while the student explores the model.

For visual explanations:

- The AI can create Mermaid diagrams for pathways and relationships.
- The app can search for relevant anatomy images and videos when they improve the explanation.

**Quiz system:** The quiz is connected to the currently selected organ or structure. Questions are preset in the database and selected based on the current topic.

**Progress tracking:** The app stores each signed-in student's notes, quiz results, and chat activity.

The progress dashboard calculates completed quizzes, quiz accuracy, studied organs, recent activity, and areas that may need review. It uses the same 3D model, so progress connects to the correct structures and body systems.


# Challenges I ran into

One of my main challenges was coordinating multiple AI tools in one chat experience. The AI needed to understand when to respond with text, control the 3D model, create a diagram, find a learning resource, or generate voice output. I had to carefully design the tool instructions and data flow so each tool was used correctly and did not interrupt the learning experience.


# Accomplishments I'm proud of

- I am proud of building an AI anatomy chatbot with multiple tool-calling capabilities. It can explain structures, control the 3D model, focus and highlight anatomy, create diagrams, find learning resources, and generate voice responses.

- I also connected the chatbot to quizzes, notes, and progress tracking, creating one interactive learning experience instead of separate tools.

# What I learned

This project taught me that building an AI product is not only about getting good answers from a model. The hardest and most rewarding part was making the AI understand the student, choose the right tool, and respond through the 3D model in a way that felt natural.


# What's next for AnatomyLens

Next, I want to:

- Expand the anatomy content
- Improve lesson quality
- Add more quiz types
- Make progress recommendations more personalized


