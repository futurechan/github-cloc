const _ = require('lodash')
const parallelLimit = require('async/parallelLimit');


class Commits {

    constructor(githubApi) {
        this.githubApi = githubApi
    }

    run() {

        let githubApi = this.githubApi;

        return githubApi.getRepos()
            .then(repos => {

                let repoNames = repos.map(repo => {
                    return repo.name
                })

                console.log("Repos: ", repoNames)

                return repoNames;
            })
            .then(repoNames => {

                let tasks = repoNames.map(repoName => {
                    return function(callback) {
                        return githubApi.getCommitStats(repoName)
                            .then(result => callback(null, result))
                            .catch(err => callback(err))
                    }
                })

                return new Promise((resolve, reject) => {

                    parallelLimit(tasks, 20, function(err, results) {

                        if (err) return reject(err);

                        resolve(results);
                    })

                })
            })
            .then(allRepoCommitStats => {

                console.log('mapping results')

                return allRepoCommitStats
                    .map(repoCommitStats => {

                        let repoName = repoCommitStats.repoName;
                        let commitStats = repoCommitStats.commitStats;

                        console.log('mapping results for ' + repoName)

                        if (!Array.isArray(commitStats)) {
                            console.error("Invalid commit stats", commitStats)
                            return []
                        }

                        return commitStats
                            .map(cs => {

                                if (cs.weeks.length < 2) return { commits: 0 }

                                let lastWeek = cs.weeks[cs.weeks.length-2]

                                return {
                                    repoName: repoName,
                                    author: cs.author.login,
                                    added: lastWeek.a,
                                    deleted: lastWeek.d,
                                    commits: lastWeek.c,
                                    timestamp: new Date(lastWeek.w*1000)
                                }
                            })
                            .filter(cs => {
                                return cs.commits > 0
                            })
                    })
            })
            .then(res => {
                return _.flatten(res);
            })
            .then(commitStats => {

                let authors = {}
                commitStats.forEach(cs => authors[cs.author] = cs);

                let tasks = Object.keys(authors).map(username => {
                    return function(callback) {
                        return githubApi.getUser(username)
                            .then(result => {

                                let stat = authors[username]
                                stat.authorName = result.user.name;

                                callback(null, stat)
                            })
                            .catch(err => callback(err))
                    }
                })

                return new Promise((resolve, reject) => {

                    parallelLimit(tasks, 20, function(err, results) {

                        if (err) return reject(err);

                        resolve(results);
                    })

                })
            })
            .then(stats => {

                return stats.map(s => {

                    return {
                        authorName: s.authorName,
                        author: s.author,
                        repoName: s.repoName,
                        added: s.added,
                        deleted: s.deleted,
                        commits: s.commits,
                        timestamp: s.timestamp
                    }
                })
            })
    }
}

module.exports = Commits