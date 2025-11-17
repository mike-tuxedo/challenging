console.log('pouchdb.js LOADED')

let challengeTemplate = {
    "id": "",
    "type": "",
    "title": "Challenge Titel",
    "description": "",
    "weeks": 0,
    "days_per_week": 0,
    "fix_days": null,
    "published": false,
    "progress": 0,
    "creator": "",
    "tags": [],
    "weeks": [
        {
            "days": [
                {
                    "date": "",
                    "weekday": null,
                    "exercises": [
                        {
                            "name": "",
                            "intervall": null,
                            "reps": null,
                            "break": null,
                            "done": false
                        }
                    ]
                }
            ]
        }
    ]
};

const pubChallenges = new PouchDB('publicChallenges');
// const pubChallengesRemote = new PouchDB('http://127.0.0.1:5984/publicChallenges');

const init = async () => {
    const docs = await pubChallenges.allDocs({
        include_docs: true,
        descending: true
    });
    rs.publicChallenges = docs['rows'].map(row => row.doc);
};
init();

let lastDoc;
const opts = { live: true, retry: true };
PouchDB.sync('publicChallenges', 'http://127.0.0.1:5984/publicChallenges', opts)
    .on('change', async function (info) {
        const docs = await pubChallenges.allDocs({
            include_docs: true,
            descending: true
        });
        rs.publicChallenges = docs['rows'].map(row => row.doc);

    }).on('paused', function (err) {
        // replication paused (e.g. replication up to date, user went offline)
    }).on('active', function () {
        // replicate resumed (e.g. new changes replicating, user went back online)
    }).on('denied', function (err) {
        // a document failed to replicate (e.g. due to permissions)
    }).on('complete', function (info) {
        console.log(info);
        // handle complete
    }).on('error', function (err) {
        // handle error
    });

    window.addEventListener('pagesReady', async () => {
        $id('chInput')?.addEventListener('input', async function (e) {
            rs.publicChallenges[rs.publicChallenges.length - 1]['title'] = e.target.value;
        });
    })



async function getLast() {
    const docs = await pubChallenges.allDocs({
        include_docs: true,
        descending: true,
        limit: 1
    });
    return docs.rows[0].doc;
}

async function deleteChallenge(id) {
    console.log(id)
    // Find challenge by _id (id can be either a string _id or a numeric index)
    let challenge  = await pubChallenges.get(id);

    if (!challenge) {
        console.error('Challenge not found:', id);
        return;
    }

    try {
        const response = await pubChallenges.remove(challenge);
    } catch (err) {
        console.log(err);
    }
}

async function createChallenge() {
    try {
        challengeTemplate._id = crypto.randomUUID();
        const response = await pubChallenges.put(challengeTemplate);
    } catch (err) {
        console.log(err);
    }
}

async function changeTitle(index, title) {
    rs.publicChallenges[index]['title'] = title.replace("'", "");

}

async function saveChallenge() {
    try {
        const response = await pubChallenges.put(rs.publicChallenges[rs.publicChallenges.length - 1]);
    } catch (err) {
        console.log(err);
    }
}

window.deleteChallenge = deleteChallenge;
window.createChallenge = createChallenge;
window.saveChallenge = saveChallenge;
window.changeTitle = changeTitle;
