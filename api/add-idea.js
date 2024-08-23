import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const newIdea = req.body;

        const filePath = path.join(process.cwd(), 'ideaslist.json');
        try {
            const fileData = await fs.readFile(filePath, 'utf-8');
            const ideasData = JSON.parse(fileData);
            
            newIdea.id = ideasData.ideas.length + 1; // Assign an ID
            ideasData.ideas.push(newIdea);

            await fs.writeFile(filePath, JSON.stringify(ideasData, null, 2));

            res.status(200).json({ message: 'Idea added successfully!' });
        } catch (error) {
            res.status(500).json({ message: 'Error reading or writing file', error });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}
