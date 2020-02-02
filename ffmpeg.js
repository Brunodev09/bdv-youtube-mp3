
const Streamer = require("./tsc/Streamer");
const fs = require('fs');
const _ = process.argv.slice(2);

if (!_ || !_.length) {
    console.error("Missing required parameters!");
    process.exit(1);
}

try {
    [pathToCodec, outPath, link, format, quality] = String(_).split('__');
    const ytStream = new Streamer.default(format, quality, outPath, 1000, pathToCodec);
    ytStream.download(link);
    ytStream.runQueue();
    
    ytStream.on("finished", (err, data) => {
        console.log(JSON.stringify(data));
    });

    ytStream.on("error", (error) => {
        console.log(error);
    });

    ytStream.on("progress", (progress) => {
        console.log(JSON.stringify(progress));
    });
} catch (e) {
    console.error(e)
    console.error("NO_CODEC_ERR");
    process.exit(1);
}


