console.log('app.js LOADED')

const challengeTemplate = {
    "id": "",
    "type": "",
    "title": "Challenge Titel",
    "description": "",
    "weeksAmount": 4,
    "days_per_week": 3,
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
}

const initStore = {
    pageTitle: ["Startpage", "Showcase", "Settings", "The Why"],
    activePage: 1,
    todos: [
        { title: "Buy bananas", checked: true },
        { title: "Change lightbulb", checked: "" },
        { title: "Call mum", checked: "" },
    ],
    themes: ["cyan", "amber", "blue"],
    theme: "cyan",
    editingChallenge: {},
    publicChallenges: [challengeTemplate],
    privateChallenges: [],
    publicChallengesHtml: ``,
    privateChallengesHtml: ``,
    testAttribute: 'testAttribute'
}
const store = new Store(initStore);
const rs = store.state;

store.on('change', (data) => console.log('Changed:', data));

            
function createChallenge() {
    console.log('add challenge')
    const challenge = {...challengeTemplate};
    challenge.id = crypto.randomUUID();
    rs.publicChallenges = [...store.state.publicChallenges, {...challenge}];
}

function updateChallenge(input) {
    const prop = input.getAttribute('data-prop');
    rs.publicChallenges[editingChallengeIdx][prop] = input.value;
}

function editChallenge(ch) {
    rs.editingChallenge = { ...ch };
}

function saveChallenge() {
    const updatedChallenges = rs.publicChallenges.map(ch => {
        return (ch.id === rs.editingChallenge.id) ? rs.editingChallenge : ch;
    });
    rs.publicChallenges = updatedChallenges;
}


function deleteChallenge(_id) {
    rs.publicChallenges.splice(_id,1);
}


/**
 * Toggles the checkbox state of a todo item.
 * 
 * @param {number} index - The index of the todo item in the `todos` array.
 */
function toggleTodo(index) {
    todos[index].checked = todos[index].checked === 'checked' ? '' : 'checked';
}

/**
 * Toggles the theme of the application.
 * 
 * @param {number} index - The index of the theme in the `themes` array.
 */
function toggleTheme(index) {
    theme = themes[index];
    document.documentElement.setAttribute('data-color', theme);
}

/**
 * Toggles the dark/light theme of the application.
 */
function darkLightToggle() {
    if (document.documentElement.getAttribute('data-theme') === 'light') {
        document.documentElement.setAttribute('data-theme', 'dark')
    } else {
        document.documentElement.setAttribute('data-theme', 'light')
    }
}

/**
 * Registers the service worker if supported by the browser.
 * Logs the registration status to the console.
 */
/*
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("sw.js")
            .then((registration) => {
                console.log(
                    "Service worker registered:",
                    registration
                );
            })
            .catch((registrationError) => {
                console.error(
                    "Service worker registration failed:",
                    registrationError
                );
            });
    });
} else {
    console.error("Service workers are not supported.");
}
*/
