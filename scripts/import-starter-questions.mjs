import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function importQuestions(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const questionsCollection = db.collection('questions');
  
  let imported = 0;
  let skipped = 0;

  for (const q of data) {
    // Basic validation
    if (!q.category || !q.difficulty || !q.question || !q.choices || q.correctIndex === undefined || !q.explanation) {
      console.error('Skipping invalid question:', q.question);
      continue;
    }

    // Deduplication check
    const existing = await questionsCollection.where('question', '==', q.question).get();
    if (!existing.empty) {
      skipped++;
      continue;
    }

    const questionData = {
      ...q,
      validationStatus: q.questionStyled ? 'approved' : 'verified',
      source: 'manual',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    await questionsCollection.add(questionData);
    imported++;
  }

  console.log(`Import complete: ${imported} imported, ${skipped} skipped.`);
}

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node import-starter-questions.mjs <file.json>');
  process.exit(1);
}

importQuestions(filePath).catch(console.error);
