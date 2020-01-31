import { Color, COLORS, Question, Checkbox } from "./Header";

const chalk = require('chalk');
const cls = require('clear');
const figlet = require('figlet');
const inquirer = require('inquirer');

const CLI = require('clui');
const Spinner = CLI.Spinner;

class Terminal {
    defaultColor: Color;
    spinner: any;

    constructor() {
        this.defaultColor = this.color(COLORS.GREEN);
        this.spinner;
    }

    color(n: number): string {
        switch (n) {
            case 1: return 'red';
            case 2: return 'green';
            case 3: return 'blue';
        }
    }

    say(text: string, color?: string): void {
        if (!color) color = this.defaultColor;
        console.log(chalk[color](text));
    }

    super(text: string, color: string): void {
        if (!color) color = this.defaultColor;
        console.log(chalk[color](figlet.textSync(text, { horizontalLayout: 'full' })));
    }

    clear(): void {
        cls();
    }

    async ask(questions: Question[]): Promise<any> {
        return await inquirer.prompt(questions);
    }

    async checkbox(questions: Checkbox[]): Promise<any> {
        return await inquirer.prompt(questions);
    }

    loading(text: string) {
        this.spinner = new Spinner(text);
    }

    loadingStart(): void {
        this.spinner.start();
    }

    loadingStop(): void {
        this.spinner.stop();
    }

};

export default new Terminal();