// api/debts.js
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(request, response) {
  if (request.method === 'GET') {
    try {
      const ledger = await redis.get('dart-ledger') || [];
      return response.status(200).json(ledger);
    } catch (error) {
      return response.status(500).json({ error: "Failed to load ledger" });
    }
  }

  if (request.method === 'POST') {
    try {
      // NEW: Extract history from the request body
      const { date, settlements, history } = request.body;
      const existingLedger = await redis.get('dart-ledger') || [];
      
      // NEW: Save the history alongside the date and settlements
      const updatedLedger = [{ date, settlements, history }, ...existingLedger];
      
      await redis.set('dart-ledger', updatedLedger);
      return response.status(200).json(updatedLedger);
    } catch (error) {
      return response.status(500).json({ error: "Failed to save ledger" });
    }
  }
}