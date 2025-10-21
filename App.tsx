// app/components/GeminiCodeReviewer.tsx
import React, { useState, useEffect, useRef } from "react";
import { marked } from "https://cdn.jsdelivr.net/npm/marked/marked.min.js";

const WS_URL = "ws://localhost:11434";

export default function GeminiCodeReviewer() {
  const [markdown, setMarkdown] = useState(`# Gemini Code Reviewer\n\nType Markdown and code here.`);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Initialize WebSocket
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        console.log("Agent response:", data.text);
      } catch {}
    };

    return () => ws.close();
  }, []);

  // Markdown rendering + highlight
  useEffect(() => {
    if (previewRef.current) {
      try {
        previewRef.current.innerHTML = marked.parse(markdown);
        document.querySelectorAll("pre code").forEach((block) => {
          // @ts-ignore
          hljs.highlightElement(block);
        });
      } catch {}
    }
  }, [markdown]);

  const sendToAgents = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      from: "frontend",
      text: markdown,
      tokens: markdown.split(/\s+/),
    }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center">Gemini Code Reviewer</h1>
      <div className="flex gap-4">
        <textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          placeholder="Type Markdown here..."
          className="w-1/2 h-64 p-4 bg-gray-800 text-gray-100 font-mono rounded-lg border border-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div
          ref={previewRef}
          className="w-1/2 prose prose-invert max-w-full bg-gray-900 p-4 rounded-lg border border-gray-700 overflow-x-auto"
        />
      </div>
      <button
        onClick={sendToAgents}
        className={`px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 ${
          wsConnected ? "opacity-100" : "opacity-50 cursor-not-allowed"
        }`}
        disabled={!wsConnected}
      >
        Send to Agents
      </button>
      <p className="text-sm text-gray-400">{wsConnected ? "WebSocket connected" : "Connecting..."}</p>
    </div>
  );
}
