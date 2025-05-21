
import { GoogleGenAI } from "@google/genai";

// IMPORTANT: Assume process.env.API_KEY is set in the environment.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("Gemini API Key (process.env.API_KEY) is not set. Please configure it in your environment.");
  // To prevent app from crashing in environments where process.env is not fully available or key is missing,
  // but functionalities requiring API_KEY will fail.
}

// Initialize GoogleGenAI only if API_KEY is available.
// Operations will fail if ai is null.
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const fetchLocationInfo = async (locationName: string): Promise<string> => {
  if (!ai) {
    return Promise.reject(new Error("Gemini API client is not initialized. Check API_KEY."));
  }

  try {
    const model = 'gemini-2.5-flash-preview-04-17';
    const prompt = `Tell me two distinct, interesting, and concise facts about "${locationName}". Format each fact as a bullet point. If the location is very obscure or fictional, state that you couldn't find specific information.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      // config: { // Optional: Add config if needed, e.g., temperature for creativity
      //   temperature: 0.7, 
      // }
    });
    
    const text = response.text;

    if (!text) {
      return `No specific information found for "${locationName}" or there was an issue fetching details.`;
    }
    return text;
  } catch (error) {
    console.error(`Error fetching location info for "${locationName}" from Gemini:`, error);
    if (error instanceof Error) {
      // Provide a more user-friendly error message
      if (error.message.includes("API key not valid")) {
         return "Error: The provided API key is not valid. Please check your configuration.";
      }
      return `Error fetching information: ${error.message}. Please try again later.`;
    }
    return "An unexpected error occurred while fetching information. Please try again later.";
  }
};
