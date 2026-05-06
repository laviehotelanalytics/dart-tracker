import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(request, response) {
  // GET: Fetch the history ledger
  if (request.method === 'GET') {
    try {
      const ledger = await redis.get('dart-ledger') || [];
      return response.status(200).json(ledger);
    } catch (error) {
      return response.status(500).json({ error: "Failed to load ledger" });
    }
  }

  // POST: Save new night
  if (request.method === 'POST') {
    try {
      const { date, settlements, history } = request.body;
      const existingLedger = await redis.get('dart-ledger') || [];
      const updatedLedger = [{ date, settlements, history }, ...existingLedger];
      
      await redis.set('dart-ledger', updatedLedger);
      return response.status(200).json(updatedLedger);
    } catch (error) {
      return response.status(500).json({ error: "Failed to save ledger" });
    }
  }

  // DELETE: Wipe all or specific index
  if (request.method === 'DELETE') {
    try {
      const body = request.body || {};
      
      // If we passed a specific index, just delete that one
      if (body.index !== undefined) {
        const existingLedger = await redis.get('dart-ledger') || [];
        existingLedger.splice(body.index, 1); // Remove the item at this index
        await redis.set('dart-ledger', existingLedger);
        return response.status(200).json(existingLedger);
      } else {
        // Otherwise, wipe the whole database
        await redis.del('dart-ledger');
        return response.status(200).json([]);
      }
    } catch (error) {
      return response.status(500).json({ error: "Failed to delete" });
    }
  }
}