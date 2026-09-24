import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { bookId, questionIndex, action } = req.body;
    if (!bookId || questionIndex === undefined || !action) {
      return res.status(400).json({ error: 'bookId, questionIndex, and action required' });
    }

    const client = await clientPromise;
    const db = client.db('booknaija');

    const trivia = await db.collection('book_trivia').findOne({ bookId });
    if (!trivia || !trivia.questions[questionIndex]) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const update = {};
    if (action === 'approve') {
      update[`questions.${questionIndex}.approved`] = true;
      update[`questions.${questionIndex}.flagged`] = false;
    } else if (action === 'reject') {
      update[`questions.${questionIndex}.approved`] = false;
      update[`questions.${questionIndex}.flagged`] = true;
    }

    await db.collection('book_trivia').updateOne({ bookId }, { $set: update });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: error.message });
  }
}
