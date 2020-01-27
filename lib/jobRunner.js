const json2csv = require('json2csv');
const fs = require('fs')

class JobRunner {

    constructor(job) {
        this.job = job;
    }

    run () {
        this.job.run()
            .then(results => {

                let fields = results.reduce((carr, res) => {
                    let keys = Object.keys(res)

                    keys.forEach(key => carr[key] = key)

                    return carr;
                }, {})

                fields = Object.keys(fields)

                // fields.splice(fields.indexOf("repoName"), 1)
                // fields.unshift("repoName")

                console.log(results)

                return json2csv({ data: results, fields: fields })
            })
            .then(csv => {
                console.log("Writing to file")
                fs.writeFile('report.csv', csv, function(err) {
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

module.exports = JobRunner;