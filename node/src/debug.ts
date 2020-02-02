import Streamer from "./Streamer";

function asyncTimeout(t: any): Promise<string> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log("Resolved" + t);
            resolve();
        }, t)
    });
}

// queue.registerFunction(asyncTimeout, "time");

// queue.push(new Task("time", [1000]));
// queue.push(new Task("time", [1000]));
// queue.push(new Task("time", [1000]));
// queue.push(new Task("time", [1000]));
// queue.push(new Task("time", [1000]));

// queue.on("progress", (data) => {
//     console.log(data, 'oi')
// })

// await queue.run();

(async () => {

    const ytStream = new Streamer("highest", "/home/bgiannoti/Work/bdv-youtube-mp3/videos", 1000,
        "/snap/bin/ffmpeg", "MP3");
    const link = "4oMJIyVOWL4";

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


})();
