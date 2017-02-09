const Lib = require('./lib')

var argv = require('minimist')(process.argv.slice(2));

const instance = new Lib({
    username: argv.u,
    password: argv.p
}, argv.o)

instance.runCLoC();