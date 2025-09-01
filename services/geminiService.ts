import { GoogleGenAI } from "@google/genai";

// The API key is obtained exclusively from the environment variable `process.env.API_KEY`.
// This is a hard requirement and the execution environment must provide it.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGeminiSuggestions = async (htmlContent: string): Promise<string> => {
  const prompt = `
You are an expert frontend developer. Your task is to analyze the following HTML/JS code and provide an enhanced version.
Apply these enhancements:
1.  **Semantic HTML**: Replace non-semantic tags with appropriate semantic tags.
2.  **Accessibility (ARIA)**: Add necessary ARIA roles and attributes.
3.  **JavaScript Comments**: Add clear, concise comments to JavaScript functions.
4.  **Best Practices**: Apply any other modern best practices.

IMPORTANT: Respond ONLY with the complete, enhanced code block. Do not include any explanations, greetings, or markdown formatting.

Here is the code to enhance:
\`\`\`html
${htmlContent}
\`\`\`
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let suggestedCode = response.text;
    
    // Clean up markdown backticks that the model might add
    suggestedCode = suggestedCode.replace(/^```(html|xml)?\n/, '').replace(/\n```$/, '');

    return suggestedCode.trim();

  } catch (error) {
    console.error("Error calling Google GenAI API:", error);
    if (error instanceof Error) {
        // Provide a more user-friendly message
        return `Error from Gemini AI: ${error.message}. This could be due to an invalid API key, network issues, or content safety policies.`;
    }
    return "An unknown error occurred while fetching suggestions from the Gemini AI service.";
  }
};
