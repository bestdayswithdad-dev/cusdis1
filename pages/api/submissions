import prisma from '../../lib/prisma';

// Project ID for "Best Days With Dad"
const PROJECT_ID = 'cbcd61ec-f2ef-425c-a952-30034c2de4e1';

// BigInt serializer helper to prevent JSON.stringify crashes on Postgres BigSerial IDs
function serialize(data) {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

export default async function handler(req, res) {
  // Enable CORS so Blogger can submit directly to this endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. POST: Handle incoming public submissions from Blogger
  if (req.method === 'POST') {
    try {
      const {
        type = 'spot',
        name,
        email,
        suburb,
        title,
        ...details
      } = req.body;

      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required fields.' });
      }

      const newSubmission = await prisma.submission.create({
        data: {
          projectId: PROJECT_ID,
          type: type, // "spot" or "contact"
          name: name.trim(),
          email: email.trim(),
          suburb: suburb ? suburb.trim() : null,
          title: title ? title.trim() : null,
          details: details || {},
          status: 'pending'
        }
      });

      return res.status(201).json(serialize(newSubmission));
    } catch (error) {
      console.error('Submission creation error:', error);
      return res.status(500).json({ error: 'Failed to record submission.' });
    }
  }

  // 2. GET: Retrieve submissions for your Moderator Dashboard
  if (req.method === 'GET') {
    try {
      const { status } = req.query;

      const whereClause = {
        projectId: PROJECT_ID
      };

      if (status && status !== 'all') {
        whereClause.status = status;
      }

      const submissions = await prisma.submission.findMany({
        where: whereClause,
        orderBy: {
          created_at: 'desc'
        }
      });

      return res.status(200).json(serialize(submissions));
    } catch (error) {
      console.error('Submissions fetch error:', error);
      return res.status(500).json({ error: 'Failed to retrieve submissions.' });
    }
  }

  // 3. PATCH: Update submission status (e.g. mark done or archive)
  if (req.method === 'PATCH') {
    try {
      const { id, status } = req.body;

      if (!id || !status) {
        return res.status(400).json({ error: 'Missing ID or status.' });
      }

      const updated = await prisma.submission.update({
        where: {
          id: BigInt(id)
        },
        data: {
          status: status
        }
      });

      return res.status(200).json(serialize(updated));
    } catch (error) {
      console.error('Submission update error:', error);
      return res.status(500).json({ error: 'Failed to update submission status.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
