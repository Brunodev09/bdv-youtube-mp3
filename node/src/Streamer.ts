import ffmpeg from "fluent-ffmpeg";
import ytdl from "ytdl-core";
import pgStream from "progress-stream";
import sanitize from "sanitize-filename";

import { CONSTANTS } from "./Constants";
import { queue, Task } from "./Queue";
import Video from "./Video";
import Output from "./Output";
import { EventEmitter } from "events";
import fs from "fs";

export default class Streamer extends EventEmitter {
    baseURL: string;
    fileNameReplacements: (string | RegExp)[][];
    quality: string = "highest";
    timeout: number = 1000;
    out: string;
    codecPath: string;
    ext: string;
    constructor(format: string, quality: string, out: string, timeout: number, codecPath?: string) {
        super();

        this.baseURL = CONSTANTS.DEFAULT_YT_BASE_LINK;
        this.quality = quality.toLowerCase();
        this.out = out;
        this.timeout = timeout;
        this.fileNameReplacements = [[/"/g, ""], [/\|/g, ""], [/'/g, ""], [/\//g, ""], [/\?/g, ""], [/:/g, ""], [/;/g, ""]];
        if (codecPath && format.toLowerCase() === CONSTANTS.MP3) ffmpeg.setFfmpegPath(codecPath);
        if (format.toLowerCase().includes(CONSTANTS.AUDIO)) this.ext = ".mp3";
        else if (format.toLowerCase().includes(CONSTANTS.VIDEO)) this.ext = ".flv";

        try {
            fs.exists(out, () => {});
        } catch (NOT_EXISTS_ERR) {
            console.error("NOT_EXISTS_ERR")
            fs.mkdir(out, () => {
                console.log("Dir created.");
            });
        }

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

    download(videoId, fileName?) {
        this.pushToQueue(new Task("download", [videoId], this));
    }

    async runQueue() {
        await queue.run();
    }

    async streamDownload(...args) {
        return new Promise((resolve, reject) => {
            let [videoId, _this, fileName] = args;
            const url = _this.baseURL + videoId;
            let result = new Output(videoId, null, null, null, null, null, null);

            ytdl.getInfo(url, (err, info) => {

                if (err) reject(err.message);

                let videoDetailsResponse = info.player_response.videoDetails;
                const video = new Video(_this.cleanFileName(videoDetailsResponse.title), "Unknown", "Unknown", videoDetailsResponse.thumbnail.thumbnails[0].url || null);

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
                fileName = (fileName ? _this.out + "/" + fileName : _this.out + "/" + (sanitize(video.videoTitle) || videoDetailsResponse.videoId) + _this.ext);

                result.fileName = fileName;
                result.url = url;
                result.title = video.videoTitle;
                result.artist = video.artist;
                result.title = video.title;
                result.thumbnail = video.thumbnail;

                ytdl.getInfo(url, { quality: _this.quality }, (err, infoNested) => {

                    if (err) reject(err.message);
                    const stream = ytdl.downloadFromInfo(infoNested, {
                        quality: _this.quality,
                        requestOptions: { maxRedirects: 5 }
                    });

                    stream.on("response", (httpResponse) => {

                        const pStream = pgStream({
                            length: parseInt(httpResponse.headers["content-length"]),
                            time: _this.timeout
                        });

                        pStream.on("progress", (progress) => {
                            if (progress.percentage === 100) {
                                result.stats = {
                                    transferredBytes: progress.transferred,
                                    runtime: progress.runtime,
                                    averageSpeed: parseFloat(progress.speed.toFixed(2))
                                }

                            }
                            _this.emit("progress", { videoId, progress });
                        });

                        if (_this.ext.includes(CONSTANTS.FLV)) {
                            stream
                                .pipe(pStream)
                                .pipe(fs.createWriteStream(fileName));
                        }
                        else {
                            const outputOptions = [
                                "-id3v2_version", "4",
                                "-metadata", "title=" + video.title,
                                "-metadata", "artist=" + video.artist
                            ];
                            new ffmpeg({
                                source: stream.pipe(pStream)
                            })
                                .audioBitrate((<any>infoNested.formats[0]).audioBitrate)
                                .withAudioCodec("libmp3lame")
                                .toFormat(CONSTANTS.MP3)
                                .outputOptions(outputOptions)
                                .on("error", (err) => {
                                    reject(err.message);
                                })
                                .on("end", () => {
                                    resolve(result);
                                })
                                .saveToFile(fileName);
                        }
                    });
                });
            });
        });
    }
}