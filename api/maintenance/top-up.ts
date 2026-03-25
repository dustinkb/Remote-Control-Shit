import { runQuestionPipeline } from "../generate-questions";
import { db } from "../../src/firebase";
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";

export default async function handler(req: any, res: any) {
  const { category, difficulty } = req.body;
  const token = req.headers['x-maintenance-token'];

  if (token !== process.env.MAINTENANCE_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. Monitor inventory
    const inventoryQuery = query(
      collection(db, 'questions'),
      where('category', '==', category),
      where('difficulty', '==', difficulty),
      where('validationStatus', '==', 'approved')
    );

    const snapshot = await getDocs(inventoryQuery);
    const count = snapshot.size;

    if (count < 20) {
      console.log(`Inventory low for ${category}/${difficulty} (${count} < 20). Replenishing...`);
      
      // 2. Trigger replenishment batch
      const batchId = `replenish-${Date.now()}`;
      await runQuestionPipeline(category, difficulty, 10, batchId);
      
      // 3. Update metadata
      const systemDoc = doc(db, 'metadata', 'system');
      await setDoc(systemDoc, {
        status: 'Idle',
        lastReplenishRun: serverTimestamp(),
        lastError: null
      }, { merge: true });

      return res.status(200).json({ status: 'Replenished', count: 10 });
    }

    return res.status(200).json({ status: 'Inventory healthy', count });
  } catch (error) {
    console.error('Maintenance error:', error);
    
    // Update metadata with error
    const systemDoc = doc(db, 'metadata', 'system');
    await setDoc(systemDoc, {
      status: 'Idle',
      lastError: error instanceof Error ? error.message : String(error)
    }, { merge: true });

    return res.status(500).json({ error: 'Maintenance failed' });
  }
}
