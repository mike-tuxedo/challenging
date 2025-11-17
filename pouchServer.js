// server.js
import http from 'http';
import { WebSocketServer } from 'ws';
import * as AR from '@automerge/automerge-repo';
import { NodeWSServerAdapter } from '@automerge/automerge-repo-network-websocket';
import { NodeFSStorageAdapter } from "@automerge/automerge-repo-storage-nodefs";

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
const wss = new WebSocketServer({ port: PORT });
const adapter = new NodeWSServerAdapter(wss);
const storage = new NodeFSStorageAdapter();

const repo = new AR.Repo({
  storage,
  network: [adapter],
});

console.log(`Server is running on port ${PORT}`);