import { GoogleGenAI, Type } from "@google/genai";
import { CodeReviewReport } from '../types';

// The API key is obtained exclusively from the environment variable `process.env.API_KEY`.
// This is a hard requirement and the execution environment must provide it.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGeminiSuggestions = async (htmlContent: string): Promise<string> => {
  const prompt = `
Act as an expert senior frontend engineer tasked with refactoring and enhancing the following code snippet. Your goal is to apply modern best practices to improve its structure, accessibility, and readability. This refactored code will be used as training data to improve our local AI model's understanding of high-quality code.

Please follow these instructions precisely:

1.  **Refactor to Semantic HTML**: Analyze the HTML structure. Replace non-semantic tags (like \`<div>\` used for layout) with appropriate semantic tags such as \`<header>\`, \`<footer>\`, \`<nav>\`, \`<main>\`, \`<section>\`, and \`<article>\` where applicable.

2.  **Improve Accessibility**: Enhance the code for screen readers and assistive technologies. Add necessary ARIA roles (e.g., \`role="navigation"\`, \`role="main"\`) and attributes (e.g., \`aria-label\`, \`aria-labelledby\`) to interactive elements and landmarks.

3.  **CRITICAL - Add JSDoc Comments**: You MUST locate every JavaScript function within \`<script>\` tags. For each function, add a complete JSDoc comment block. This must include a description of the function, a \`@param\` tag for every parameter (with type and description), and a \`@returns\` tag if the function returns a value.

**ABSOLUTE OUTPUT CONSTRAINT**: You MUST return ONLY raw code. Do not include any surrounding text, explanations, apologies, or markdown formatting like \`\`\`html. The output must be nothing but the code itself.

Original Code Snippet to enhance:
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
    suggestedCode = suggestedCode.replace(/^```(html|xml|javascript)?\n/, '').replace(/\n```$/, '');

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
Act as an automated code review service powered by an expert AI. Your analysis must be meticulous, objective, and focused on providing actionable feedback.

Your task is to analyze the following frontend code (HTML/JS/CSS) and generate a structured review report in the required JSON format.

**Review Directives:**

1.  **Overall Summary**: Begin with a concise, one-sentence summary that captures the overall quality and main areas for improvement.
2.  **Potential Bugs**:
    - Look for null reference errors, race conditions, off-by-one errors, and logical flaws.
    - Check for incorrect event handling or DOM manipulation that could lead to unexpected behavior.
3.  **Security Vulnerabilities**:
    - Scrutinize for Cross-Site Scripting (XSS) vulnerabilities (e.g., use of \`innerHTML\` with user-provided content).
    - Check for insecure direct object references or missing validation on inputs.
    - Look for usage of deprecated or insecure APIs.
4.  **Performance Improvements**:
    - Identify inefficient DOM queries inside loops.
    - Suggest optimizations for event listeners (e.g., event delegation).
    - Look for large, unoptimized assets or blocking JavaScript operations.
5.  **Actionable Suggestions**: For every issue identified, provide a clear description and a concrete, practical code suggestion for how to fix it. If a line number is relevant, include it.

Your final output must strictly adhere to the provided JSON schema. Do not add any text outside of the JSON object.

Code for review:
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
