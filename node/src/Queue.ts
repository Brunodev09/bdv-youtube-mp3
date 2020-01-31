export class Task {
    key: string;
    args: any[];
    constructor(key: string, args: any[]) {
        this.key = key;
        this.args = args;
    }
}


class Queue {
    length: number;
    tasks: Task[];
    running: boolean;
    funcMap: Map<string, any>;
    constructor() {
        this.tasks = [];
        this.length = this.tasks.length;
        this.running = false;
        this.funcMap = new Map();
    }

    async push(task: Task) {
        this.tasks.unshift(task);
        // if (!this.running) {
        //     await this.run();
        // }
    }

    registerFunction(f: Promise<any>, fId: string) {
        this.funcMap.set(fId, f);
    }

    async run() {
        this.running = true;
        while (this.tasks.length) {
            for (let i = this.tasks.length; i > 0; i--) {
                try {
                    if (!this.funcMap.get(this.tasks[i].key)) {
                        this.tasks.splice(i, 1);
                        continue;
                    }
                    await (this.funcMap.get(this.tasks[i].key))(this.tasks[i].args);
                    this.tasks.splice(i, 1);
                } catch (e) {
                    this.tasks.splice(i, 1);
                    continue;
                }
            }
        }
        this.running = false;
    }
}

export const queue = new Queue();