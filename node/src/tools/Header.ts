export type Color = string;

export enum COLORS {
    RED = 1,
    GREEN,
    BLUE
}

type functionInstance = () => {};

export class Question {
    type: string;
    name: string;
    message: string;
    validate?: functionInstance;
    constructor(type, name, message, validate) {
        this.type = type;
        this.name = name;
        this.message = message;
        this.validate = validate;
    }
}

export class Checkbox {
    type: string;
    name: string;
    message: string;
    choices: string[];
    default: string[];
    constructor(type, name, message, choices, defaultOpts) {
        this.type = type;
        this.name = name;
        this.message = message;
        this.choices = choices;
        this.default = defaultOpts;
    }
}