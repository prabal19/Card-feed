import type { NextApiRequest, NextApiResponse } from 'next'
import clientPromise from '@/lib/mongodb'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Connecting to DB...')
    const client = await clientPromise
    const db = client.db('your-db') // use exact name as in MongoDB Atlas
    const posts = await db.collection('posts').find({}).toArray()
    console.log(`Fetched ${posts.length} posts`)
    res.status(200).json(posts)
  } catch (e) {
    console.error('API Error:', e)
    res.status(500).json({ message: 'Error fetching posts', error: e })
  }
}
