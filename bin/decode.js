const fs = require('fs-extra');
const path = require('path');
const argv = require('yargs').argv;
const { getDatFiles, decodeFile } = require('../src/decode');
const id = 'WechatDatDecoder';

if (!argv.input) {
    console.error(`[${id}] Can not find input.`);
    process.exit(-1);
}

if (argv.output) fs.ensureDirSync(path.resolve(argv.output));

Promise
    .all(getDatFiles(argv.input).map(filepath => decodeFile(filepath, argv.output)))
    .then(() => console.log(`[${id}] Done.`))
    .catch(err => console.error(`[${id}]`, err));
