const GithubApi = require('./lib/githubApi')
const JobRunner = require('./lib/jobRunner')

var argv = require('minimist')(process.argv.slice(2));

const creds = {
    username: argv.u,
    password: argv.p
};

const orgName = argv.o;

const githubApi = new GithubApi(creds, orgName);

const Job = require('./lib/jobs/' + argv.j);

const job = new Job(githubApi);

new JobRunner(job).run();