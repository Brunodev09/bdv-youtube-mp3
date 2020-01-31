import { queue } from "./Queue";

function asyncTimeout(t: number) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, t)
    });
}

queue.registerFunction(asyncTimeout, "time");
