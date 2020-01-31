import { CONSTANTS } from "./Constants";
import { queue, Task } from "./Queue";

const os = require("os");
const util = require("util");
const EventEmitter = require("events").EventEmitter;
const ffmpeg = require("fluent-ffmpeg");
const ytdl = require("ytdl-core");
const progress = require("progress-stream");
const sanitize = require("sanitize-filename");

export class Scrapper extends EventEmitter {
    baseURL: string;
    fileNameReplacements: (string | RegExp)[][];
    quality: string = "highest";
    timeout: number = 1000;
    queue: number = 1;
    out: string;
    codecPath: string;
    constructor(quality: string, out: string, timeout: number, queue: number, codecPath: string, conversionType: string) {
        super();
        
        this.baseURL = CONSTANTS.DEFAULT_YT_BASE_LINK;
        this.quality = quality;
        this.out = out;
        this.queue = queue
        this.timeout = timeout;
        this.fileNameReplacements = [[/"/g, ""], [/\|/g, ""], [/'/g, ""], [/\//g, ""], [/\?/g, ""], [/:/g, ""], [/;/g, ""]];
        if (!codecPath && conversionType.toUpperCase() === CONSTANTS.MP3) throw new Error("Codec binaries path is mandatory for mp3 conversion.");
        ffmpeg.setFfmpegPath(codecPath);

        this.registerToQueue(this.streamDownload, "download");
    }

    cleanFileName(fileName: string) {
        for (let replacementArr of this.fileNameReplacements) {
            fileName = fileName.replace(replacementArr[0], String(replacementArr[1]));
        }
        return fileName;
    }

    pushToQueue(task: Task) {
        queue.push(task);
    }

    registerToQueue(func: any, fid: string) {
        queue.registerFunction(func, fid);
    }

    download(videoId, fileName) {
        this.pushToQueue(new Task("download", [videoId, fileName]));
    }

    async runQueue() {
        await queue.run();
    }

    streamDownload() {

    }
    
}