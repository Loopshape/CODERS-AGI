import { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, limit, getDocs } from 'firebase/firestore';
import { Code, Send, Loader2, Link, Zap } from 'lucide-react';

// Globals from the Canvas Environment (MUST BE PRESENT)
declare const __app_id: string;
declare const __firebase_config: string;
declare const __initial_auth_token: string | undefined;

// --- State Management (Simple Store with useState) ---
const useAppState = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [outputCode, setOutputCode] = useState<string>('// Der generierte Code erscheint hier.');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [db, setDb] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  return { prompt, setPrompt, outputCode, setOutputCode, isLoading, setIsLoading, userId, setUserId, isAuthReady, setIsAuthReady, db, setDb, error, setError };
};


// --- Main Application Component ---

const App = () => {
  const { prompt, setPrompt, outputCode, setOutputCode, isLoading, setIsLoading, userId, setUserId, isAuthReady, setIsAuthReady, db, setDb, error, setError } = useAppState();
  
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

  // 1. Firebase Initialization and Authentication
  useEffect(() => {
    try {
      const firebaseConfig = JSON.parse(__firebase_config);
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const auth = getAuth(app);
      setDb(firestore);

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          // Attempt to sign in with custom token if available
          if (typeof __initial_auth_token !== 'undefined') {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            // Fallback to anonymous sign-in
            await signInAnonymously(auth);
          }
        }
        
        // Finalize user ID and readiness state
        const currentUserId = auth.currentUser?.uid || 'anonymous';
        setUserId(currentUserId);
        setIsAuthReady(true);
        console.log("Firebase initialized. User ID:", currentUserId);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Failed to initialize Firebase:", e);
      setError("Fehler bei der Firebase-Initialisierung.");
    }
  }, []);

  // 2. Fetch or Initialize User Data (Example: Last Prompt)
  useEffect(() => {
    if (isAuthReady && userId && db) {
      const fetchLastPrompt = async () => {
        try {
          const userDocRef = doc(db, `artifacts/${appId}/users/${userId}/state/last-prompt`);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists() && docSnap.data().prompt) {
            setPrompt(docSnap.data().prompt);
          }
        } catch (e) {
          console.error("Error fetching last prompt:", e);
        }
      };
      fetchLastPrompt();
    }
  }, [isAuthReady, userId, db, appId]);


  // 3. Code Generation Logic (Gemini API Integration)
  const generateCode = useCallback(async () => {
    if (!prompt || !db) return;

    const apiKey = ""; // API key is provided by the environment during fetch
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    setIsLoading(true);
    setOutputCode('// Code wird generiert...');
    setError(null);

    // Save current prompt to Firestore (private data)
    try {
      const userDocRef = doc(db, `artifacts/${appId}/users/${userId}/state/last-prompt`);
      await setDoc(userDocRef, { prompt, timestamp: new Date() }, { merge: true });
    } catch (e) {
      console.error("Error saving prompt to Firestore:", e);
      setError("Fehler beim Speichern der Eingabe.");
    }

    // System instruction to guide the LLM's coding behavior
    const systemPrompt = "You are an expert software engineer specializing in single-file web applications (HTML/CSS/JS or React/TSX). Your task is to write clean, complete, and runnable code based on the user's request. Only output the final, self-contained code block. DO NOT include any explanatory text, comments outside of the code block, or markdown wrapping (e.g., ```language). Just the final code content.";

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      // Use Google Search for up-to-date knowledge needed for modern frameworks/libraries
      tools: [{ "google_search": {} }], 
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      // Request a structured response to ensure we get a code block
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            "language": { "type": "STRING", "description": "The programming language of the code (e.g., html, react, python)." },
            "title": { "type": "STRING", "description": "A short, descriptive title for the generated file." },
            "filepath": { "type": "STRING", "description": "A relevant filename including extension (e.g., index.html, App.tsx)." },
            "code": { "type": "STRING", "description": "The complete, self-contained code content." }
          },
          required: ["language", "title", "filepath", "code"]
        }
      }
    };

    try {
      let response;
      let attempt = 0;
      const maxRetries = 3;

      // Exponential backoff retry loop
      while (attempt < maxRetries) {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) break;

        attempt++;
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(res => setTimeout(res, delay));
        } else {
           throw new Error(`API call failed after ${maxRetries} attempts.`);
        }
      }

      const result = await response.json();
      const textPart = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (textPart) {
        // Since we asked for JSON output, we parse it
        const parsedJson = JSON.parse(textPart);
        const { language, title, filepath, code } = parsedJson;
        
        // Re-generate the file block format for the UI to display the code.
        const fileBlock = `\`\`\`${language}:${title}:${filepath}\n${code}\n\`\`\`eof`;
        setOutputCode(fileBlock);

      } else {
        throw new Error("API returned no text content or failed.");
      }
    } catch (e: any) {
      console.error("Gemini API Error:", e);
      setOutputCode(`// Fehler bei der Codegenerierung: ${e.message}`);
      setError("Fehler bei der KI-Kommunikation. Versuchen Sie es erneut.");
    } finally {
      setIsLoading(false);
    }
  }, [prompt, appId, userId, db]);


  // --- UI Rendering ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4 sm:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-blue-800 flex items-center justify-center space-x-3">
          <Zap className="w-8 h-8 text-yellow-500" />
          <span>CODERS-AGI</span>
        </h1>
        <p className="text-gray-600 mt-2">Geben Sie eine detaillierte Aufgabe ein, um sofort Code zu generieren.</p>
        <p className="text-xs text-gray-400 mt-1 flex items-center justify-center">
            <Link className="w-3 h-3 mr-1" />
            UserID: {isAuthReady ? (userId || 'N/A') : 'Authentifizierung läuft...'}
        </p>
      </header>

      <div className="max-w-4xl w-full mx-auto">
        
        {/* Error Message Display */}
        {error && (
            <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm" role="alert">
                {error}
            </div>
        )}

        {/* Prompt Input Area */}
        <div className="bg-white p-6 shadow-xl rounded-2xl border border-gray-200">
          <textarea
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-gray-800 resize-none h-32 text-sm"
            placeholder="Beschreiben Sie die Anwendung, die Sie erstellen möchten (z. B. 'Eine einfache HTML-Seite mit einem Taschenrechner-Widget, gestylt mit Tailwind CSS')."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
          />
          <button
            onClick={generateCode}
            disabled={isLoading || !isAuthReady}
            className={`mt-4 w-full flex items-center justify-center px-4 py-2 text-white font-semibold rounded-xl transition duration-200 shadow-md ${
              (isLoading || !isAuthReady)
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-500/50'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Send className="w-5 h-5 mr-2" />
            )}
            {isLoading ? 'Generiere Code...' : 'Code generieren'}
          </button>
        </div>

        {/* Output Code Block */}
        <div className="mt-8 bg-gray-800 p-6 rounded-2xl shadow-xl">
          <h2 className="text-xl font-bold text-gray-100 mb-4 flex items-center">
            <Code className="w-5 h-5 mr-2 text-cyan-400" />
            Generierter Code
          </h2>
          <pre className="overflow-x-auto text-sm bg-gray-900 p-4 rounded-lg border border-gray-700 text-green-300">
            {outputCode}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default App;

