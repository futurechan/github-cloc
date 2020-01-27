const rest = require('rest');
const mime = require('rest/interceptor/mime');
const pathPrefix = require('rest/interceptor/pathPrefix')
const basicAuth = require('rest/interceptor/basicAuth')
const defaultRequest = require('rest/interceptor/defaultRequest')


module.exports = function(creds, orgName) {

    let self = this;

    let client = rest
        .wrap(mime)
        .wrap(defaultRequest, {
            headers: {
                "User-Agent": "Github-CLoC"
            }
        })
        .wrap(basicAuth, creds)
        .wrap(pathPrefix, { prefix: 'https://api.github.com/'});

    self.getPageOfRepos = function(page) {
        console.log("Fetching page " + page + " or repos")
        return client({
                path: 'orgs/' + orgName + '/repos?page=' + page
            })
            .then(function(response) {
                return response.entity;
            })
            .catch(err => {
                console.error("Failed to gather page " + page + " of repos", err);
            });;
    }

    self.getRepos = function(page) {

        if (!page) page = 1;

        return self.getPageOfRepos(page)
            .then(repos => {

                if (!repos.length) return [];

                return self.getRepos(++page)
                    .then(more => {
                        return repos.concat(more);
                    })
            })
    }

    self.getRepoLanguageCount = function(repoName){
        console.log("Gathering language count for " + repoName);
        return client({
                path: 'repos/' + orgName + '/' + repoName + '/languages'
            })
            .then(response => {
                console.log("Gathered language count for " + repoName);
                return {
                    repoName: repoName,
                    counts: response.entity
                };
            })
            .catch(err => {
                console.error("Failed to gather language count for " + repoName, err);
            });
    }

    self.getCommitStats = function(repoName){
        console.log("Gathering commit stats for " + repoName);
        return client({
                // /repos/zimperium/svc-trm/stats/contributors
                path: 'repos/' + orgName + '/' + repoName + '/stats/contributors'
            })
            .then(function(response) {
                console.log("Gathered commit stats for " + repoName);
                return {
                    repoName: repoName,
                    commitStats: response.entity
                };
            })
            .catch(err => {
                console.error("Failed to gather commit stats for " + repoName, err);
            });
    }

    self.getUser = function(username) {

        return client({
            path: 'users/' + username
        })
            .then(function(response) {
                console.log("Get user details for " + username);
                return {
                    username: username,
                    user: response.entity
                };
            })
            .catch(err => {
                console.error("Failed to get user details for " + username, err);
            });
    }
}