import { db } from '../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const newIdea = req.body;

    try {
      const docRef = await addDoc(collection(db, 'ideas'), newIdea);
      res.status(200).json({ message: 'Idea added successfully!', id: docRef.id });
    } catch (e) {
      console.error('Error adding document: ', e.message);  // Log error message
      res.status(500).json({ message: 'Error adding idea', error: e.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
