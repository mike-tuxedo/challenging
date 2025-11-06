/**
 * @typedef {Object} Challenge
 * @property {string} id
 * @property {"onetime" | "easy" | "complex"} type
 * @property {string} title
 * @property {string} description
 * @property {number} weeks
 * @property {number} days_per_week
 * @property {null | string[]} fix_days
 * @property {boolean} published
 * @property {number} progress
 * @property {string} creator
 * @property {string[]} tags
 * @property {Week[]} weeks
 */

/**
 * @typedef {Object} Week
 * @property {Day[]} days
 */

/**
 * @typedef {Object} Day
 * @property {string} date
 * @property {null | string} weekday
 * @property {Exercise[]} exercises
 */

/**
 * @typedef {Object} Exercise
 * @property {string} name
 * @property {null | number} intervall
 * @property {null | number} reps
 * @property {null | number} break
 * @property {boolean} done
 */

const challengeTemplate = {
    "id": "",
    "type": "",
    "title": "",
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
}

export { challengeTemplate };