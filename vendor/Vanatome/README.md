authoritative.
# AnatomyLens

An AI-powered anatomy learning lab for exploring the human body in 3D. Select a
structure, ask questions, make study notes, practice with quizzes, and review
your saved learning progress.

<p>
  <a href="https://anato-lens.vercel.app/"><strong>Open the live app</strong></a> ·
  <a href="https://anato-lens.vercel.app/progress">Learning progress</a> ·
  <a href="https://github.com/dhanyaboyapally/AnatoLens">GitHub repository</a>
</p>

## Links

| Resource | Link |
|:---|:---|
| Live application | [anato-lens.vercel.app](https://anato-lens.vercel.app/) |
| Progress dashboard | [anato-lens.vercel.app/progress](https://anato-lens.vercel.app/progress) |
| GitHub repository | [github.com/dhanyaboyapally/AnatoLens](https://github.com/dhanyaboyapally/AnatoLens) |
| Individual project overview | [dev.md](../../dev.md) |
| User story and product scope | [user_story.md](../../docs/user_story.md) |
| AI chat feature | [chat_feature.md](../../docs/chat_feature.md) |
| Progress feature | [progress_feature.md](../../docs/progress_feature.md) |
| Atlas and asset contract | [atlas-contract.md](docs/atlas-contract.md) |
| Anatomy pipeline | [anatomy-pipeline.md](docs/anatomy-pipeline.md) |
| Model attribution | [ATTRIBUTION.txt](public/ATTRIBUTION.txt) |

## Features

- Explore a selectable 3D human anatomy atlas and browse its structure hierarchy.
- Ask anatomy questions with the selected structure and visible systems as context.
- Use AI-guided explanations, Mermaid diagrams, learning resources, and speech.
- Create and format sticky notes attached to anatomical structures.
- Take interactive quizzes and review saved notes, chats, and quiz activity in
  the progress dashboard.
- Switch between light and dark themes and use the interface on desktop or mobile.

## Technology

- Next.js, React, and TypeScript
- Three.js with React Three Fiber and the Vanatome atlas/viewer packages
- OpenAI through the Vercel AI SDK
- Supabase authentication and saved learning data
- ElevenLabs text-to-speech

## Run locally

The application lives in `vendor/Vanatome` within the repository. Node.js
`22.13` or later is required.

```bash
git clone https://github.com/dhanyaboyapally/AnatoLens.git
cd AnatoLens/vendor/Vanatome
npm install
cp .env.example .env
npm run dev
```

Add the credentials for the services you want to use to `.env`:

| Variable | Used for |
|:---|:---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase authentication and saved data |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase browser client |
| `NEXT_PUBLIC_VANATOME_ATLAS_CATALOG_URL` | Optional hosted anatomy catalog |
| `OPENAI_API_KEY` | AI chat and teaching features |
| `SERPAPI_KEY` | Anatomy learning-resource search |
| `ELEVENLABS_API_KEY` | Speech generation |
| `ELEVENLABS_VOICE_ID` | Optional voice selection |

Never commit `.env` or put secret keys in client-side code. The example file is
[`vendor/Vanatome/.env.example`](.env.example).

## Useful commands

Run these from `vendor/Vanatome`:

```bash
npm run dev       # Start the local app
npm run build     # Build the production app
npm run lint      # Lint the project
npm test          # Run package, build, and project tests
```

## Anatomy data and attribution

The 3D atlas is adapted from [Z-Anatomy](https://github.com/Z-Anatomy/Models).
Review the [asset license](ASSET-LICENSE.md) and [attribution notice](public/ATTRIBUTION.txt)
before redistributing model assets. The upstream atlas license and attribution
terms apply to those assets.

The application code and embedded Vanatome packages have their own licenses;
see [`LICENSE`](LICENSE) and the package-specific documentation in
[`packages/react`](packages/react/README.md) and
[`packages/atlas`](packages/atlas/README.md).
