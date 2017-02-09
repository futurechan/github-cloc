const Promise = require('bluebird')
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
        return client({
            path: 'orgs/' + orgName + '/repos?page=' + page
        }).then(function(response) {
            return response.entity;
        });
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
            return client({
                path: 'repos/' + orgName + '/' + repoName + '/languages'
            }).then(response => {
                return {
                    repoName: repoName,
                    counts: response.entity
                };
            });
    }
}