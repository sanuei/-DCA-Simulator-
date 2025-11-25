import { GoogleGenAI } from "@google/genai";
import { SimulationResult } from "../types";

const processEnvApiKey = process.env.API_KEY;

export const analyzePortfolio = async (results: SimulationResult[], years: number): Promise<string> => {
  if (!processEnvApiKey) {
    return "API Key not found. Please configure the environment variable.";
  }

  const ai = new GoogleGenAI({ apiKey: processEnvApiKey });

  // Prepare a summary string for the prompt
  const summary = results.map(r => 
    `${r.asset}: Total Value $${r.totalValue.toFixed(0)}, ROI ${r.roi.toFixed(1)}%, Max Drawdown ${r.maxDrawdown.toFixed(1)}%`
  ).join('\n');

  const prompt = `
    You are a senior financial analyst. 
    A user has performed a Dollar Cost Averaging (DCA) simulation of $100/month for ${years} years.
    
    Here are the results:
    ${summary}
    
    Please provide a concise, 2-3 sentence insight comparing the risk and reward of these assets based on this specific period. 
    Highlight which asset performed best and mention the volatility (drawdown) trade-off.
    Do not give financial advice, just analyze the historical data provided.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Could not generate analysis.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error analyzing data. Please try again later.";
  }
};
