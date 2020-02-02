
const Streamer = require("./tsc/Streamer");
const fs = require('fs');
const _ = process.argv.slice(2);

if (!_ || !_.length) {
    console.error("Missing required parameters!");
    process.exit(1);
}

try {
    [pathToCodec, outPath, link] = String(_).split('__');
    try {
        fs.exists(outPath);
    } catch (NOT_EXISTS_ERR) {
        console.error("NOT_EXISTS_ERR")
        fs.mkdir(outPath, () => {
            console.log("Dir created.");
        });
    }
    const ytStream = new Streamer.default("highest", "/home/bgiannoti/Work/bdv-youtube-mp3/videos", 1000,
    "/snap/bin/ffmpeg", "MP3");
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


