import { GoogleGenAI, Type } from "@google/genai";

/**
 * The Google GenAI SDK initialization and operational assessment function.
 * Following strict guidelines: direct access to process.env.API_KEY.
 */
export const getOperationalAssessment = async (userInput: string) => {
  try {
    // Initialize AI instance with the provided environment variable
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze these business needs and suggest the best Tegemea retainer model: "${userInput}"
      
      Available Models:
      - Core (£35/hr, 20-40h): For founders moving from ad-hoc to consistency.
      - Growth (£33/hr, 60-80h): For established firms needing operational ownership.
      - Partnership (£30/hr, 100+h): For high-volume, long-term embedded support.
      - Bespoke: For complex team-based requirements.
      
      Return the analysis strictly in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            packageId: { 
              type: Type.STRING,
              description: "The ID of the recommended package: core, growth, partnership, or bespoke."
            },
            reasoning: { 
              type: Type.STRING,
              description: "A professional, 2-sentence explanation of why this fit is correct."
            },
            strategicInsight: { 
              type: Type.STRING,
              description: "A high-level strategic tip for the user's specific operations."
            }
          },
          required: ["packageId", "reasoning", "strategicInsight"]
        },
        systemInstruction: "You are a senior operational consultant at Tegemea, a premium UK virtual assistant firm. Your tone is elite, calm, and highly professional. You prioritize long-term infrastructure over short-term task completion."
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from strategic model.");

    return JSON.parse(text);
  } catch (error) {
    console.error("Tegemea Assessment Error:", error);
    throw error;
  }
};