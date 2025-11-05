import { challengeTemplate } from "../challengeTemplate.js";
import * as AR from "https://esm.sh/@automerge/automerge-repo@2.0.0-alpha.14/slim?bundle-deps"
import { BrowserWebSocketClientAdapter } from "https://esm.sh/@automerge/automerge-repo-network-websocket@2.0.0-alpha.14?bundle-deps"
import { IndexedDBStorageAdapter } from "https://esm.sh/@automerge/automerge-repo-storage-indexeddb@2.0.0-alpha.14"

await AR.initializeWasm(
    fetch("https://esm.sh/@automerge/automerge@2.2.8/dist/automerge.wasm")
)

const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
const host = 'automergeserver.mike.fm-media-staging.at'; // oder window.location.host, wenn gleiche Domain
const path = '/ws';
const wsUrl = `${proto}://${host}${path}`;

const repo = new AR.Repo({
    storage: new IndexedDBStorageAdapter(),
    network: [new BrowserWebSocketClientAdapter(wsUrl)],
})

window.repo = repo;

// Save/retrieve document URL for persistence
let docUrl = localStorage.getItem('pubChDocUrl');
let pubChHandle;

if (docUrl) {
    // Reload existing document
    pubChHandle = repo.find(docUrl);
    console.log('restored handle', pubChHandle);
} else {
    // Create new document only once
    rs.publicChallenges = [{ id: crypto.randomUUID(), ...challengeTemplate }];
    pubChHandle = repo.create({ publicChallenges: rs.publicChallenges });
    
    // CRITICAL: Save URL for next reload
    localStorage.setItem('pubChDocUrl', pubChHandle.url);
    console.log('new handle:', pubChHandle);
}

// Wait for document to load
await pubChHandle.whenReady();

// Set initial reactive value from document
const doc = pubChHandle.docSync();
rs.publicChallenges = Array.isArray(doc?.publicChallenges)
    ? JSON.parse(JSON.stringify(doc.publicChallenges))
    : [challengeTemplate];

// Handle changes
pubChHandle.on('change', () => {
    console.log('change');
    const doc = pubChHandle.docSync();
});

// Your existing event handlers work fine as-is:
$id('pouchdbtest')?.addEventListener('input', function (event) {
    const i = rs.publicChallenges.length - 1;
    if (i >= 0) rs.publicChallenges[i].title = event.target.value;
});

$id('pouchdbdelete')?.addEventListener('click', function () {
    rs.publicChallenges.splice(rs.publicChallenges.length - 1, 1);
});

$id('pouchdbcreate')?.addEventListener('click', function () {
    rs.publicChallenges.push({ id: crypto.randomUUID(), ...challengeTemplate });
});

function deleteChallenge(index) {
    rs.publicChallenges.splice(index, 1);
    pubChHandle.change((doc) => doc.publicChallenges.splice(index, 1));
}

console.log('Document URL:', pubChHandle.url);
setTimeout(() => {
    console.log('Connected peers:', repo.peers);
}, 2000);

// Hilfsfunktion für Plain‑Clone
const toPlain = (v) => JSON.parse(JSON.stringify(v));

store.on('change', (prop, oldValue, newValue) => {
    if (prop === 'publicChallenges') {
        // 1) Plain kopieren und fehlende IDs vergeben
        const next = (Array.isArray(newValue) ? toPlain(newValue) : []).map(item => {
            if (!item.id) item.id = crypto.randomUUID();
            return item;
        });

        pubChHandle.change((doc) => {
            const curr = doc.publicChallenges;

            // 2) Delete: entferne alle, deren ID nicht mehr in next vorhanden ist
            const nextIdSet = new Set(next.map(x => x.id));
            for (let i = curr.length - 1; i >= 0; i--) {
                if (!nextIdSet.has(curr[i].id)) {
                    curr.splice(i, 1);
                }
            }

            // 3) Insert/Update: für jede next-Card einfügen oder Felder aktualisieren
            for (const incoming of next) {
                let idx = curr.findIndex(c => c.id === incoming.id);
                if (idx === -1) {
                    curr.push(incoming); // Plain-Objekt
                } else {
                    const dst = curr[idx];
                    // entfernte Keys löschen
                    Object.keys(dst).forEach((k) => {
                        if (!(k in incoming)) delete dst[k];
                    });
                    // Werte kopieren
                    Object.keys(incoming).forEach((k) => {
                        dst[k] = incoming[k];
                    });
                }
            }

            // 4) Reorder: bringe curr in die Reihenfolge von next
            for (let i = 0; i < next.length; i++) {
                const wantId = next[i].id;
                const curPos = curr.findIndex(c => c.id === wantId);
                if (curPos !== i) {
                    const [moved] = curr.splice(curPos, 1);
                    curr.splice(i, 0, moved);
                }
            }
        });
    }
});