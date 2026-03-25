import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { TriviaQuestion, InventoryItem } from '../types';

export async function getQuestionsForSession(category: string, difficulty: string, count: number = 10): Promise<TriviaQuestion[]> {
  const q = query(
    collection(db, 'questions'),
    where('category', '==', category),
    where('difficulty', '==', difficulty),
    where('validationStatus', '==', 'approved')
  );

  const snapshot = await getDocs(q);
  const questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TriviaQuestion));
  
  // Shuffle and pick
  return questions.sort(() => Math.random() - 0.5).slice(0, count);
}

export async function ensureQuestionInventory(category: string, difficulty: string, threshold: number = 20) {
  const q = query(
    collection(db, 'questions'),
    where('category', '==', category),
    where('difficulty', '==', difficulty),
    where('validationStatus', '==', 'approved')
  );

  const snapshot = await getDocs(q);
  if (snapshot.size < threshold) {
    console.log(`Inventory low for ${category}/${difficulty} (${snapshot.size} < ${threshold}). Triggering replenishment...`);
    // Trigger background replenishment
    fetch('/api/maintenance/top-up', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-maintenance-token': process.env.MAINTENANCE_TOKEN || ''
      },
      body: JSON.stringify({ category, difficulty })
    }).catch(err => console.error('Failed to trigger replenishment:', err));
  }
}

export async function getInventoryStatus(): Promise<InventoryItem[]> {
  const snapshot = await getDocs(collection(db, 'inventory'));
  return snapshot.docs.map(doc => ({ bucketId: doc.id, ...doc.data() } as InventoryItem));
}
