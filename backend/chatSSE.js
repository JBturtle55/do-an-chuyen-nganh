// SSE registry cho chat
// userClients: Map<userId(string), Set<res>>
// adminClients: Set<res>

const userClients  = new Map();
const adminClients = new Set();

function addUserClient(userId, res) {
  if (!userClients.has(userId)) userClients.set(userId, new Set());
  userClients.get(userId).add(res);
}
function removeUserClient(userId, res) {
  const set = userClients.get(userId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) userClients.delete(userId);
}
function addAdminClient(res)    { adminClients.add(res); }
function removeAdminClient(res) { adminClients.delete(res); }

function broadcastToUser(userId, data) {
  const set = userClients.get(userId.toString());
  if (!set || !set.size) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of set) { try { res.write(payload); } catch (_) {} }
}
function broadcastToAdmins(data) {
  if (!adminClients.size) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of adminClients) { try { res.write(payload); } catch (_) {} }
}

module.exports = {
  addUserClient, removeUserClient,
  addAdminClient, removeAdminClient,
  broadcastToUser, broadcastToAdmins,
};
