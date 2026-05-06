// api/debts.js
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

  // NEW: DELETE method to wipe the database
  if (request.method === 'DELETE') {
    try {
      await redis.del('dart-ledger');
      return response.status(200).json({ message: "Ledger cleared" });
    } catch (error) {
      return response.status(500).json({ error: "Failed to clear ledger" });
    }
  }
}