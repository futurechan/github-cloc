const json2csv = require('json2csv');
const GithubApi = require('./githubApi')
const fs = require('fs')

module.exports = function(creds, orgName) {

    const githubApi = new GithubApi(creds, orgName);

    this.runCLoC = function() {

        githubApi.getRepos()
            .then(repos => {

                var repoNames = repos.map(repo => {
                    return repo.name
                })

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
                fs.writeFile('cloc.csv', csv, function(err) {
                    if (err) throw err;
                    console.log('file saved');
                });
            });
    }
}