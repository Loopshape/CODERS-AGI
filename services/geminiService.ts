import { GoogleGenAI, Type } from "@google/genai";
import { CodeReviewReport } from '../types';

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

export const getGeminiCodeReview = async (codeContent: string): Promise<CodeReviewReport> => {
    const prompt = `
You are an expert code reviewer specializing in frontend development (HTML, CSS, JavaScript). 
Your task is to analyze the following code and provide a structured review report in JSON format.
Focus on identifying potential bugs, security vulnerabilities, and performance improvements.
For each issue, provide the line number if applicable, a clear description of the issue, and a concrete suggestion for fixing it.
Also, provide a brief, one-sentence summary of the code quality.

Here is the code to review:
\`\`\`
${codeContent}
\`\`\`
`;
    const reviewSchema = {
        type: Type.OBJECT,
        properties: {
            reviewSummary: {
                type: Type.STRING,
                description: 'A brief, one-sentence summary of the code quality.'
            },
            potentialBugs: {
                type: Type.ARRAY,
                description: 'A list of potential bugs found in the code.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        line: { type: Type.INTEGER, description: 'The line number where the issue occurs.' },
                        description: { type: Type.STRING, description: 'A description of the potential bug.' },
                        suggestion: { type: Type.STRING, description: 'A suggestion to fix the bug.' }
                    },
                    required: ['description', 'suggestion']
                }
            },
            securityVulnerabilities: {
                type: Type.ARRAY,
                description: 'A list of potential security vulnerabilities.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        line: { type: Type.INTEGER, description: 'The line number where the vulnerability is.' },
                        description: { type: Type.STRING, description: 'A description of the vulnerability.' },
                        suggestion: { type: Type.STRING, description: 'A suggestion to mitigate the vulnerability.' }
                    },
                    required: ['description', 'suggestion']
                }
            },
            performanceImprovements: {
                type: Type.ARRAY,
                description: 'A list of potential performance improvements.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        line: { type: Type.INTEGER, description: 'The line number where the improvement can be made.' },
                        description: { type: Type.STRING, description: 'A description of the performance issue.' },
                        suggestion: { type: Type.STRING, description: 'A suggestion for improvement.' }
                    },
                    required: ['description', 'suggestion']
                }
            }
        },
        required: ['reviewSummary', 'potentialBugs', 'securityVulnerabilities', 'performanceImprovements']
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: reviewSchema
            }
        });

        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr) as CodeReviewReport;

    } catch (error) {
        console.error("Error calling Google GenAI API for code review:", error);
        if (error instanceof Error) {
            throw new Error(`Error from Gemini AI: ${error.message}. This could be due to an invalid API key, network issues, or content safety policies.`);
        }
        throw new Error("An unknown error occurred while fetching a code review from the Gemini AI service.");
    }
};
