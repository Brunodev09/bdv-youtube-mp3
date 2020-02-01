import { EventEmitter } from "events";
import Streamer from "./Streamer";
export class Task {
    key: string;
    args: any[];
    ref: Streamer;
    constructor(key: string, args: any[], reference: Streamer) {
        this.key = key;
        this.args = args;
        this.ref = reference;
    }
}


class Queue extends EventEmitter {
    length: number;
    tasks: Task[];
    running: boolean;
    funcMap: Map<string, any>;
    constructor() {
        super();

        this.tasks = [];
        this.length = this.tasks.length;
        this.running = false;
        this.funcMap = new Map();
    }

    async push(task: Task) {
        this.tasks.unshift(task);
    }

    registerFunction(f: (...args) => Promise<any>, fId: string) {
        this.funcMap.set(fId, f);
    }

    async run() {
        this.running = true;
        const initialLength = this.tasks.length;
        let pCounter = 1;

        while (this.tasks.length) {
            for (let i = this.tasks.length - 1; i >= 0; i--) {
                try {
                    if (!this.funcMap.get(this.tasks[i].key)) {
                        pCounter++;
                        this.tasks.splice(i, 1);
                        continue;
                    }
                    await (this.funcMap.get(this.tasks[i].key))(this.tasks[i].args, this.tasks[i].ref);
                    this.emit("progress", { progress: (pCounter / initialLength) * 100 });
                    pCounter++;
                    this.tasks.splice(i, 1);
                } catch (e) {
                    this.emit("error", { error: e.message });
                    this.tasks.splice(i, 1);
                    pCounter++;
                    continue;
                }
            }
        }
        this.running = false;
    }
}

export const queue = new Queue();