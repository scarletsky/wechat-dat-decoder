const fs = require('fs');
const path = require('path');
const { Transform } = require('stream');

// NOTE:
// ext: [firstbyte, secondbyte]
const SUPPORT_FORMATS = {
    jpg: [0xff, 0xd8],
    png: [0x89, 0x50],
    gif: [0x47, 0x49],
};

class DecodeStream extends Transform {
    constructor(decodeKey) {
        super();
        this.decodeKey = decodeKey;
    }

    _transform(chunk, encoding, callback) {
        for (let i = 0; i < chunk.length; i++)  {
            chunk[i] ^= this.decodeKey;
        }

        this.push(chunk);
        callback();
    }
}

function getDatFiles(inputPath) {

    try {
        const stat = fs.lstatSync(inputPath);

        if (stat.isDirectory()) {
            return fs
                .readdirSync(inputPath)
                .filter(filename => path.extname(filename).toLowerCase() === '.dat')
                .map(filename => path.resolve(inputPath, filename));
        } else {
            return [inputPath];
        }

    } catch(err) {
        console.error(err);
        return [];
    }

}

function getDecodeMeta(buffer) {
    for (const ext in SUPPORT_FORMATS) {
        const head2 = SUPPORT_FORMATS[ext];
        const xor0 = buffer[0] ^ head2[0];
        const xor1 = buffer[1] ^ head2[1];
        if (xor0 === xor1) return [ext, xor0];
    }

    return [null, null];
}

function decodeFile(inputFilePath, outputDirPath) {
    return new Promise((resolve, reject) => {
        outputDirPath = outputDirPath ? outputDirPath : path.dirname(inputFilePath);
        const basename = path.basename(inputFilePath, path.extname(inputFilePath));
        const fd = fs.openSync(inputFilePath);
        const head2 = Buffer.alloc(2);
        fs.readSync(fd, head2)
        const [ ext, decodeKey ] = getDecodeMeta(head2);

        if (!ext || !decodeKey) {
            return reject(`Do not support decoding ${inputFilePath}.`);
        }

        const outputFileName = basename + '.' + ext;
        const decode = new DecodeStream(decodeKey);

        fs.createReadStream(inputFilePath)
            .pipe(decode)
            .pipe(fs.createWriteStream(path.resolve(outputDirPath, outputFileName)))
            .on('finish', resolve)
            .on('error', reject);
    });
}

module.exports = {
    decodeFile,
    getDatFiles,
}
