import { challengeTemplate } from "../challengeTemplate.js";
import * as AR from "https://esm.sh/@automerge/automerge-repo@2.0.0-alpha.14/slim?bundle-deps"
import { BrowserWebSocketClientAdapter } from "https://esm.sh/@automerge/automerge-repo-network-websocket@2.0.0-alpha.14?bundle-deps"
import { IndexedDBStorageAdapter } from "https://esm.sh/@automerge/automerge-repo-storage-indexeddb@2.0.0-alpha.14"

await AR.initializeWasm(
    fetch("https://esm.sh/@automerge/automerge@2.2.8/dist/automerge.wasm")
)

const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const host = 'localhost:8080'; // oder window.location.host, wenn gleiche Domain
// const host = 'challenging-nqjj.onrender.com' // oder window.location.host, wenn gleiche Domain
const path = '/ws';
const wsUrl = `${protocol}://${host}${path}`;

const repo = new AR.Repo({
    storage: new IndexedDBStorageAdapter(),
    network: [new BrowserWebSocketClientAdapter(wsUrl)],
})

// Setup Private Challenges
let myChDocUrl = localStorage.getItem('myChDocUrl');
let myChHandle;
if (myChDocUrl) {
    myChHandle = repo.find(myChDocUrl);
    console.log('private challenges restored', myChHandle);
} else {
    rs.privateChallenges = [{ id: crypto.randomUUID(), ...challengeTemplate }];
    myChHandle = repo.create({ privateChallenges: rs.privateChallenges });

    localStorage.setItem('myChDocUrl', myChHandle.url);
    console.log('private challenges handle created:', myChHandle);
}

// Setup Public Challenges
let pubChDocUrl = 'automerge:2GJKvSG2BUZaFf4UcssRVp6S4Gi6';
let pubChHandle = repo.find(pubChDocUrl);
if (pubChHandle) {
    console.log('public challenges restored', pubChHandle);
} else {
    pubChHandle = repo.create();
    console.log('public challenges initiated', pubChHandle);
}

// Wait for document to load
await myChHandle.whenReady();
await pubChHandle.whenReady();

/** Core Automerge */
const pubDoc = pubChHandle.docSync();
rs.publicChallenges = Array.isArray(pubDoc?.publicChallenges)
    ? JSON.parse(JSON.stringify(pubDoc.publicChallenges))
    : [challengeTemplate];

const myDoc = myChHandle.docSync();
rs.privateChallenges = Array.isArray(myDoc?.privateChallenges)
    ? JSON.parse(JSON.stringify(myDoc.privateChallenges))
    : [challengeTemplate];

// Handle changes
pubChHandle.on('change', () => {
    console.log('change');
});

// Your existing event handlers work fine as-is:
$id('chInput')?.addEventListener('input', function (event) {
    const i = rs.publicChallenges.length - 1;
    if (i >= 0) rs.publicChallenges[i].title = event.target.value;
});

$id('myChInput')?.addEventListener('input', function (event) {
    const i = rs.privateChallenges.length - 1;
    if (i >= 0) rs.privateChallenges[i].title = event.target.value;
});

$id('chCreate')?.addEventListener('click', function () {
    rs.publicChallenges.push({ id: crypto.randomUUID(), ...challengeTemplate });
});

$id('myChCreate')?.addEventListener('click', function () {
    rs.privateChallenges.push({ id: crypto.randomUUID(), ...challengeTemplate });
});

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
    } else if (prop === 'privateChallenges') {
        // 1) Plain kopieren und fehlende IDs vergeben
        const next = (Array.isArray(newValue) ? toPlain(newValue) : []).map(item => {
            if (!item.id) item.id = crypto.randomUUID();
            return item;
        });
    
        myChHandle.change((doc) => {
            const curr = doc.myChHandle;
    
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

function deleteChallenge(index) {
    rs.publicChallenges.splice(index, 1);
    pubChHandle.change((doc) => doc.publicChallenges.splice(index, 1));
}

window.deleteChallenge = deleteChallenge;
