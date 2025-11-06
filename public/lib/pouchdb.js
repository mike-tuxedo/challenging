import { challengeTemplate } from "../challengeTemplate.js";

const pubChallenges = new PouchDB('publicChallenges');
const pubChallengesRemote = new PouchDB('https://pouchserver.mike.fm-media-staging.at/publicChallenges');

// try {
//     const result = await pubChallenges.allDocs({
//       include_docs: true,
//       attachments: true,
//       startkey: 'bar',
//       endkey: 'quux'
//     });
//     console.log(result);
//   } catch (err) {
//     console.log(err);
//   }

pubChallenges.sync(pubChallengesRemote, { live: true, since: 'now' })
    .on('change', function (info) {
        // handle change
        console.log('Ch-Ch-Changes');
    }).on('paused', function (err) {
        // replication paused (e.g. replication up to date, user went offline)
    }).on('active', function () {
        // replicate resumed (e.g. new changes replicating, user went back online)
    }).on('denied', function (err) {
        // a document failed to replicate (e.g. due to permissions)
    }).on('complete', function (info) {
        // handle complete
    }).on('error', function (err) {
        // handle error
    });
    
document.addEventListener('DOMContentLoaded', () => {
    $id('pouchdbtest')?.addEventListener('input', function (event) {
        console.log(event.target.value);
    
        pubChallenges.put({
            _id: 'challengeTemplate',
            title: event.target.value
        });
    });
    
    $id('pouchdbdelete').addEventListener('click', function () {
        pubChallenges.remove('challengeTemplate');
    });
    
    $id('pouchdbcreate').addEventListener('click', function () {
        pubChallenges.put({
            _id: 'challengeTemplate',
            ...challengeTemplate
        });
    });
})

// pubChallenges.put({
//     _id: 'challengeTemplate',
//     ...challengeTemplate
// });

// pubChallenges.changes({ live: true, since: 'now' }).on('change', function () {
//     console.log('Ch-Ch-Changes');
// });
