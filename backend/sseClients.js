/**
 * SSE client registry — maps tripId -> Set of response objects
 */
const clients = new Map();

function addClient(tripId, res) {
  if (!clients.has(tripId)) clients.set(tripId, new Set());
  clients.get(tripId).add(res);
}

function removeClient(tripId, res) {
  const set = clients.get(tripId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clients.delete(tripId);
}

function broadcast(tripId, data) {
  const set = clients.get(tripId);
  if (!set || set.size === 0) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of set) {
    try { res.write(payload); } catch (_) {}
  }
}

module.exports = { addClient, removeClient, broadcast };
