// server.js
import http from 'http';
import { WebSocketServer } from 'ws';
import * as AR from '@automerge/automerge-repo';
import { NodeWSServerAdapter } from '@automerge/automerge-repo-network-websocket';
import { NodeFSStorageAdapter } from "@automerge/automerge-repo-storage-nodefs";

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;

// Minimaler HTTP-Server (Passenger hängt hier dran; wichtig für WS-Upgrade)
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('OK');
});
server.listen(PORT, () => console.log('HTTP listening on', PORT));

// Persistenz
const storage = new NodeFSStorageAdapter();

// WebSocket auf Pfad /ws
const wss = new WebSocketServer({ server, path: '/ws' });

// Repo
const repo = new AR.Repo({
  storage,
  network: [new NodeWSServerAdapter(wss)],
});

console.log('Automerge WS ready at path /ws');