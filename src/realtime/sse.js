const { randomUUID } = require("crypto");

const clients = new Map();

const createSseResponse = (res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });
  res.write("\n");
};

const addClient = ({ userId, role, res }) => {
  const id = randomUUID();
  clients.set(id, { id, userId, role, res, createdAt: Date.now() });
  return id;
};

const removeClient = (id) => {
  const client = clients.get(id);
  if (!client) return;
  clients.delete(id);
  try {
    client.res.end();
  } catch (err) {
  }
};

const send = (client, event, data) => {
  try {
    client.res.write(`event: ${event}\n`);
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch (err) {
    removeClient(client.id);
  }
};

const broadcastEvent = ({ event, payload, userId }) => {
  for (const client of clients.values()) {
    const canSeeAll = client.role === "SEKRETARIS_CABANG";
    const isOwner = userId ? client.userId === userId : false;
    if (!canSeeAll && !isOwner) continue;
    send(client, event, payload);
  }
};

const broadcastLogActivity = ({ activity }) => {
  for (const client of clients.values()) {
    const canSeeAll = client.role === "SEKRETARIS_CABANG";
    const isOwner = client.userId === activity.userId;
    if (!canSeeAll && !isOwner) continue;
    send(client, "log_activity", activity);
  }
};

const heartbeat = () => {
  for (const client of clients.values()) {
    send(client, "ping", { ts: Date.now() });
  }
};

setInterval(heartbeat, 25000).unref?.();

module.exports = {
  createSseResponse,
  addClient,
  removeClient,
  broadcastEvent,
  broadcastLogActivity,
};
