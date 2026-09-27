# AnatomyLens

An AI-powered 3D anatomy learning lab. Explore mapped human anatomy, ask questions about selected structures, create study notes, practice with quizzes, and review saved learning progress.

**Live app:** [anato-lens.vercel.app](https://anato-lens.vercel.app/)<br>
**Progress dashboard:** [anato-lens.vercel.app/progress](https://anato-lens.vercel.app/progress)<br>
**GitHub:** [dhanyaboyapally/AnatoLens](https://github.com/dhanyaboyapally/AnatoLens)

## Features

- Interactive 3D anatomy atlas with searchable systems and structures.
- AI anatomy chat with selected-structure context, explanations, diagrams, learning resources, and speech.
- Sticky notes attached to anatomy structures, including text formatting.
- Interactive quizzes and saved chat, quiz, and note history.
- A learning progress dashboard with anatomy coverage visualization.
- Responsive interface with light and dark themes.

## Technology

- Next.js, React, and TypeScript
- Three.js, React Three Fiber, and the Vanatome atlas packages
- OpenAI through the Vercel AI SDK
- Supabase authentication and persistence
- ElevenLabs text-to-speech

## Run locally

The application is in `vendor/Vanatome`. Use Node.js 22.13 or newer.

```bash
git clone https://github.com/dhanyaboyapally/AnatoLens.git
cd AnatoLens/vendor/Vanatome
npm install
cp .env.example .env
npm run dev
```

Set the service credentials you need in `vendor/Vanatome/.env`:

| Variable | Purpose |
|:---|:---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase authentication and persistence |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase browser client |
| `NEXT_PUBLIC_VANATOME_ATLAS_CATALOG_URL` | Optional hosted anatomy catalog |
| `OPENAI_API_KEY` | AI chat and teaching |
| `SERPAPI_KEY` | Anatomy learning-resource search |
| `ELEVENLABS_API_KEY` | Speech generation |
| `ELEVENLABS_VOICE_ID` | Optional speech voice selection |

Do not commit `.env` or expose secret keys in client-side code. See [`vendor/Vanatome/.env.example`](vendor/Vanatome/.env.example).

## Commands

Run from `vendor/Vanatome`:

```bash
npm run dev
npm run build
npm run lint
npm test
```

## Project documentation

- [Project overview and individual project write-up](dev.md)
- [User story and product scope](docs/user_story.md)
- [AI chat feature](docs/chat_feature.md)
- [Progress feature](docs/progress_feature.md)
- [Application and package README](vendor/Vanatome/README.md)
- [Atlas and asset contract](vendor/Vanatome/docs/atlas-contract.md)
- [Anatomy data pipeline](vendor/Vanatome/docs/anatomy-pipeline.md)
- [Model attribution notice](vendor/Vanatome/public/ATTRIBUTION.txt)
- [Asset license](vendor/Vanatome/ASSET-LICENSE.md)

The 3D atlas is adapted from [Z-Anatomy](https://github.com/Z-Anatomy/Models). Review the asset license and attribution notice before redistributing anatomy model files.
