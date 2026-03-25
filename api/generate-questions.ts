import { generateRawQuestions, verifyQuestions, styleQuestions } from "../src/services/aiService";
import { TriviaQuestion } from "../src/types";
import { db } from "../src/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function runQuestionPipeline(category: string, difficulty: string, batchSize: number = 10, batchId?: string) {
  console.log(`Starting pipeline for ${category}/${difficulty} (Batch: ${batchId || 'N/A'})`);
  
  // Stage 1: Raw Generation
  const rawQuestions = await generateRawQuestions(category, difficulty, batchSize);
  
  // Stage 2: Factual Verification
  const verificationResults = await verifyQuestions(rawQuestions);
  const verifiedQuestions = rawQuestions.filter((_, i) => verificationResults[i].verified);
  
  console.log(`Verified ${verifiedQuestions.length}/${rawQuestions.length} questions`);
  
  // Stage 3: Personality Styling
  const styledQuestions = await styleQuestions(verifiedQuestions);
  
  // Stage 4: Storage
  const questionsCollection = collection(db, 'questions');
  const results = await Promise.all(styledQuestions.map(async (q) => {
    const questionData: TriviaQuestion = {
      ...q as any,
      category,
      difficulty: difficulty as any,
      validationStatus: 'approved',
      source: 'ai',
      batchId,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any
    };
    
    return addDoc(questionsCollection, questionData);
  }));
  
  console.log(`Stored ${results.length} questions in the bank.`);
  return results.length;
}
