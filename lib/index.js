const json2csv = require('json2csv');
const GithubApi = require('./githubApi')
const fs = require('fs')
const _ = require('lodash')
const parallelLimit = require('async/parallelLimit');

module.exports = function(creds, orgName) {

    const githubApi = new GithubApi(creds, orgName);

    this.runCLoC = function() {

        githubApi.getRepos()
            .then(repos => {

                var repoNames = repos.map(repo => {
                    return repo.name
                })

                console.log("Repos: ", repoNames)

                return repoNames;
            })
            .then(repoNames => {

                let promises = repoNames.map(repoName => {

                    return githubApi.getRepoLanguageCount(repoName)
                })

                return Promise.all(promises)
            })
            .then(clocs => {
                clocs = clocs.map(cloc => {
                    cloc.counts.repoName = cloc.repoName

                    return cloc.counts;
                })

                return clocs
            })
            .then(clocs => {

                let fields = clocs.reduce((carr, cloc) => {
                    let keys = Object.keys(cloc)

                    keys.forEach(key => carr[key] = key)

                    return carr;
                }, {})

                fields = Object.keys(fields)

                fields.splice(fields.indexOf("repoName"), 1)
                fields.unshift("repoName")

                console.log(clocs)

                return json2csv({ data: clocs, fields: fields })
            })
            .then(csv => {
                console.log("Writing to file")
                fs.writeFile('cloc.csv', csv, function(err) {
                    if (err) throw err;
                    console.log('file saved');
                });
            })
            .catch(err => {
                console.error(err)
                throw err;
            });
    }

    this.runCommitCounts = function() {

        githubApi.getRepos()
            .then(repos => {

                var repoNames = repos.map(repo => {
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

                                if (cs.weeks.length < 1) return { commits: 0 }

                                let lastWeek = cs.weeks[cs.weeks.length-1]

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
                console.log('extracting fields')

                let fields = commitStats.reduce((carr, stat) => {
                    let keys = Object.keys(stat)

                    keys.forEach(key => carr[key] = key)

                    return carr;
                }, {})

                fields = Object.keys(fields)

                console.log('converting to csv format')

                return json2csv({ data: commitStats, fields: fields })
            })
            .then(csv => {
                console.log("Writing to file")
                fs.writeFile('commits.csv', csv, function(err) {
                    if (err) throw err;
                    console.log('file saved');
                });
            })
            .catch(err => {
                console.error(err)
                throw err;
            });

    }
}