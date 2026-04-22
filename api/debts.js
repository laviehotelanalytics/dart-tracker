// api/debts.js
import { Redis } from '@upstash/redis';

// This automatically connects using the passwords Vercel added to your .env file
const redis = Redis.fromEnv();

export default async function handler(request, response) {
  // GET: Fetch the history ledger when the app loads
  if (request.method === 'GET') {
    try {
      const ledger = await redis.get('dart-ledger') || [];
      return response.status(200).json(ledger);
    } catch (error) {
      return response.status(500).json({ error: "Failed to load ledger" });
    }
  }

  // POST: Save the night's final settlements
  if (request.method === 'POST') {
    try {
      const { date, settlements } = request.body;
      const existingLedger = await redis.get('dart-ledger') || [];
      
      const updatedLedger = [{ date, settlements }, ...existingLedger];
      
      await redis.set('dart-ledger', updatedLedger);
      return response.status(200).json(updatedLedger);
    } catch (error) {
      return response.status(500).json({ error: "Failed to save ledger" });
    }
  }
}