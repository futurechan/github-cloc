const parallelLimit = require('async/parallelLimit');

class Cloc {

    constructor(githubApi) {
        this.githubApi = githubApi;
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
                        return githubApi.getRepoLanguageCount(repoName)
                            .then(result => {

                                callback(null, result)
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
            .then(clocs => {
                clocs = clocs.map(cloc => {
                    cloc.counts.repoName = cloc.repoName;

                    let res = {
                        repoName: cloc.repoName
                    }

                    Object.keys(cloc.counts).forEach(key => {
                        res[key] = cloc.counts[key]
                    })

                    return res;
                })

                return clocs
            })
    }
}

module.exports = Cloc;