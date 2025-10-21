// app/routes/index.tsx
import type { V2_MetaFunction } from "@remix-run/node";
import GeminiCodeReviewer from "./App";

export const meta: V2_MetaFunction = () => [
  { title: "Gemini Code Reviewer" },
  { name: "description", content: "Code + Markdown reviewer with Ollama agents in Termux" },
];

export default function Index() {
  return (
    <main className="bg-gray-900 min-h-screen text-gray-100 antialiased">
      <GeminiCodeReviewer />
    </main>
  );
}
