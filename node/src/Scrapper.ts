import os from "os";
import util from "util";
import ffmpeg from "fluent-ffmpeg";
import ytdl from "ytdl-core";
import pgStream from "progress-stream";
import sanitize from "sanitize-filename";

import { CONSTANTS } from "./Constants";
import { queue, Task } from "./Queue";
import Video from "./Video";
import Output from "./Output";
const EventEmitter = require("events").EventEmitter;

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

    async streamDownload(...args) {

        return new Promise((resolve, reject) => {

            let [videoId, fileName] = args;
            const url = this.baseURL + videoId;
            let result = new Output(videoId, null, null, null, null, null, null);

            ytdl.getInfo(url, (err, info) => {

                if (err) reject(err.message);

                let videoDetailsResponse = info.player_response.videoDetails;
                const video = new Video(this.cleanFileName(videoDetailsResponse.title), "Unknown", "Unknown", videoDetailsResponse.thumbnail.thumbnails[0].url || null);

                if (video.videoTitle.indexOf("-") > -1) {
                    var temp = video.videoTitle.split("-");
                    if (temp.length >= 2) {
                        video.artist = temp[0].trim();
                        video.title = temp[1].trim();
                    }
                } else {
                    video.title = video.videoTitle;
                }

                video.videoTitle = video.videoTitle.replace(/[^\w\s]/gi, '').replace(/'/g, '').replace(' ', '-');
                video.title = video.title.replace(/[^\w\s]/gi, '').replace(/'/g, '').replace(' ', '-');
                video.artist = video.artist.replace(/[^\w\s]/gi, '').replace(/'/g, '').replace(' ', '-');

                fileName = (fileName ? this.out + "/" + fileName : this.out + "/" + (sanitize(video.videoTitle) || videoDetailsResponse.videoId) + ".mp3");

                ytdl.getInfo(url, { quality: this.quality }, (err, infoNested) => {

                    if (err) reject(err.message);

                    const stream = ytdl.downloadFromInfo(infoNested, {
                        quality: this.quality,
                        requestOptions: { maxRedirects: 5 }
                    });


                    stream.on("response", (httpResponse) => {

                        const pStream = pgStream({
                            length: parseInt(httpResponse.headers["content-length"]),
                            time: this.timeout
                        });

                        pStream.on("progress", (progress) => {
                            if (progress.percentage === 100) {
                                result.stats = {
                                    transferredBytes: progress.transferred,
                                    runtime: progress.runtime,
                                    averageSpeed: parseFloat(progress.speed.toFixed(2))
                                }
                            }
                            this.emit("progress", { videoId, progress });
                        });
                        const outputOptions = [
                            "-id3v2_version", "4",
                            "-metadata", "title=" + video.title,
                            "-metadata", "artist=" + video.artist
                        ];
                        new ffmpeg({
                            source: stream.pipe(pgStream)
                        })
                            .audioBitrate((<any>infoNested.formats[0]).audioBitrate)
                            .withAudioCodec("libmp3lame")
                            .toFormat("mp3")
                            .outputOptions(outputOptions)
                            .on("error", (err) => {
                                reject(err.message);
                            })
                            .on("end", function () {
                                result.fileName = fileName;
                                result.url = url;
                                result.title = video.videoTitle;
                                result.artist = video.artist;
                                result.title = video.title;
                                result.thumbnail = video.thumbnail;
                                resolve(result);
                            })
                            .saveToFile(fileName);
                    });
                });
            });
        });
    }
}