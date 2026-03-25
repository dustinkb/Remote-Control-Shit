import { GoogleGenAI, Type } from "@google/genai";
import { TriviaQuestion } from "../types";
import { getRandomSubdomain } from "./categorySubdomains";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateRawQuestions(category: string, difficulty: string, count: number = 10): Promise<Partial<TriviaQuestion>[]> {
  const subdomain = getRandomSubdomain(category);
  console.log(`Generating ${count} questions for ${category} (Subdomain: ${subdomain}) at ${difficulty} difficulty.`);
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate ${count} trivia questions for the category "${category}" focusing specifically on "${subdomain}" at "${difficulty}" difficulty. 
    Return a JSON array of objects with the following fields: question, choices (array of 4 strings), correctIndex (0-3), explanation.
    Ensure variety and avoid repetitive topics.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            choices: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
          },
          required: ["question", "choices", "correctIndex", "explanation"]
        }
      }
    }
  });

  return JSON.parse(response.text);
}

export async function verifyQuestions(questions: Partial<TriviaQuestion>[]): Promise<{ id: number, verified: boolean, reason?: string }[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Verify the following trivia questions for factual accuracy and distractor quality. 
    For each question, return whether it is verified (true/false) and a reason if rejected.
    Questions: ${JSON.stringify(questions)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            verified: { type: Type.BOOLEAN },
            reason: { type: Type.STRING }
          },
          required: ["id", "verified"]
        }
      }
    }
  });

  return JSON.parse(response.text);
}

export async function styleQuestions(questions: Partial<TriviaQuestion>[]): Promise<Partial<TriviaQuestion>[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are the host of a competitive trivia game. 
    Your job is to add light personality and tone to already verified, factual trivia content.
    You are NOT generating facts. You are ONLY styling existing content.

    PERSONALITY:
    You are: intelligent, composed, slightly smug, quietly amused.
    You are NOT: aggressive, insulting, loud, try-hard, overly sarcastic.

    STYLE RULES:
    1. The QUESTION must remain unchanged.
    2. hostLeadIn: 5–12 words, clever, thematic, or lightly teasing.
    3. explanationStyled: preserve ALL factual content, may add light commentary or framing, max 1 subtle joke, keep it concise.
    4. wrongAnswerQuips: short (5–10 words each), lightly teasing, not insulting.

    UNHINGED MODE ACTIVATED (Rarely):
    You may slightly exaggerate tone, lean into absurdity, or break normal delivery patterns. be unexpectedly dramatic, be oddly specific, momentarily “break character”, act overly invested in trivial facts.

    Questions: ${JSON.stringify(questions)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            hostLeadIn: { type: Type.STRING },
            explanationStyled: { type: Type.STRING },
            wrongAnswerQuips: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["hostLeadIn", "explanationStyled"]
        }
      }
    }
  });

  const styledData = JSON.parse(response.text);
  return questions.map((q, i) => ({
    ...q,
    ...styledData[i]
  }));
}
