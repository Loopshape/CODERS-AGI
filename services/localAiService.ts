
import { CodeReviewReport, ChatMessage, MessageSender } from '../types';
import { LogType } from '../types';

const OLLAMA_API_URL = 'http://127.0.0.1:11434/api/generate';
const OLLAMA_CHAT_API_URL = 'http://127.0.0.1:11434/api/chat';
const MODEL_NAME = 'gemma3:1b';

/**
 * Handles errors from the Local AI API and returns a user-friendly message.
 * @param error The error object caught from the API call.
 * @returns A string containing a clear, actionable error message.
 */
const handleLocalAiError = (error: unknown): string => {
    if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
            return 'Could not connect to the local AI service at ' + OLLAMA_API_URL + '. Please ensure the service is running and accessible.';
        }
        return `An error occurred with the Local AI API: ${error.message}`;
    }
    return 'An unknown error occurred while communicating with the Local AI service.';
};

/**
 * Calls the local AI model with a given prompt.
 * @param prompt The prompt to send to the model.
 * @param isJson Whether to ask for JSON output.
 * @returns The text response from the model.
 */
const callLocalAi = async (prompt: string, isJson: boolean = false): Promise<string> => {
    // Add artificial delay to simulate slower local model
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));

    try {
        const body = {
            model: MODEL_NAME,
            prompt: prompt,
            stream: false,
            ...(isJson && { format: 'json' }) // Add format if JSON is requested
        };

        const response = await fetch(OLLAMA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data.response.trim();
    } catch (error) {
        console.error("Error calling Local AI API:", error);
        throw new Error(handleLocalAiError(error));
    }
};

export const getLocalAiSuggestions = async (htmlContent: string, environmentInfo: string): Promise<string> => {
    const prompt = `
Act as an expert senior frontend engineer tasked with refactoring and enhancing the following code snippet. Your goal is to apply modern best practices to improve its structure, accessibility, and readability.

Use the following environment scan information to inform your enhancements. This context about the user's system may be relevant for file paths, permissions, or system-specific configurations mentioned in the code.

--- Environment Context ---
${environmentInfo}
--- End Environment Context ---

Please follow these instructions precisely:

1.  **Refactor to Semantic HTML**: Analyze the HTML structure. Replace non-semantic tags (like \`<div>\` used for layout) with appropriate semantic tags such as \`<header>\`, \`<footer>\`, \`<nav>\`, \`<main>\`, \`<section>\`, and \`<article>\` where applicable.
2.  **Improve Accessibility**: Enhance the code for screen readers and assistive technologies. Add necessary ARIA roles and attributes.
3.  **Add JSDoc Comments**: You MUST locate every JavaScript function within \`<script>\` tags. For each function, add a complete JSDoc comment block including description, @param, and @returns.

**ABSOLUTE OUTPUT CONSTRAINT**: You MUST return ONLY raw code. Do not include any surrounding text, explanations, apologies, or markdown formatting like \`\`\`html. The output must be nothing but the code itself.

Original Code Snippet to enhance:
\`\`\`html
${htmlContent}
\`\`\`
`;
    const suggestedCode = await callLocalAi(prompt, false);
    return suggestedCode.replace(/^```(html|xml|javascript)?\n/, '').replace(/\n```$/, '').trim();
};

export const getLocalAiCodeReview = async (codeContent: string): Promise<CodeReviewReport> => {
    const prompt = `
Act as an automated code review service. Analyze the following frontend code and generate a structured review report in JSON format.

**Review Directives:**
1.  **Overall Summary**: A concise, one-sentence summary of the code quality.
2.  **Potential Bugs**: Look for null references, race conditions, logical flaws.
3.  **Security Vulnerabilities**: Scrutinize for XSS, insecure references.
4.  **Performance Improvements**: Identify inefficient DOM queries, suggest optimizations.
5.  **Actionable Suggestions**: For every issue, provide a clear description and a concrete code suggestion.

Your final output must be a single JSON object matching this structure, with no other text:
{
  "reviewSummary": "string",
  "potentialBugs": [{"line": "number | null", "description": "string", "suggestion": "string"}],
  "securityVulnerabilities": [{"line": "number | null", "description": "string", "suggestion": "string"}],
  "performanceImprovements": [{"line": "number | null", "description": "string", "suggestion": "string"}]
}

Code for review:
\`\`\`
${codeContent}
\`\`\`
`;

    const jsonStr = await callLocalAi(prompt, true);
    try {
        // The model might still wrap the JSON in markdown, so we clean it up.
        const cleanedJsonStr = jsonStr.replace(/^```(json)?\n/, '').replace(/\n```$/, '');
        return JSON.parse(cleanedJsonStr) as CodeReviewReport;
    } catch (parseError) {
        console.error("Failed to parse JSON from Local AI:", parseError);
        console.error("Received string:", jsonStr);
        throw new Error("The local AI returned a response that was not valid JSON. Please check the model's output.");
    }
};

export const chatWithLocalAi = async (messages: ChatMessage[]): Promise<string> => {
    const ollamaMessages = messages
        .filter(msg => msg.sender === MessageSender.User || msg.sender === MessageSender.AI)
        .map(msg => ({
            role: msg.sender === MessageSender.User ? 'user' : 'assistant',
            content: msg.text
        }));

    try {
        const body = {
            model: MODEL_NAME,
            messages: ollamaMessages,
            stream: false,
        };

        const response = await fetch(OLLAMA_CHAT_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        if (data.message && data.message.content) {
            return data.message.content.trim();
        } else {
            throw new Error("Invalid response structure from local AI chat API.");
        }
    } catch (error) {
        console.error("Error calling Local AI chat API:", error);
        throw new Error(handleLocalAiError(error));
    }
};

export const getLocalAiBashExtension = async (): Promise<{ output: string; logs: { type: LogType; message:string }[]; fileName: string }> => {
    const prompt = `
    Generate a single, useful, and well-commented bash function that can be added to a .bashrc or .profile file.
    The function should be something a developer would find handy for daily tasks.
    Example ideas: an advanced search function using find/grep, a quick project setup script, or a git helper.
    
    CRITICAL CONSTRAINTS:
    1. Output ONLY the raw bash code.
    2. Do not include any explanations, markdown backticks (\`\`\`), or any text outside of the script itself.
    3. The script must be a single function block.
    
    Generate the function now.`;

    const scriptContent = await callLocalAi(prompt, false);

    return {
        output: scriptContent.replace(/^```(bash|sh)?\n/, '').replace(/\n```$/, '').trim(),
        logs: [
            { type: LogType.Info, message: "Prompting local AI for a new bash extension..." },
            { type: LogType.Success, message: "Successfully generated bash extension from local AI." }
        ],
        fileName: 'ai_extension.sh'
    };
};
