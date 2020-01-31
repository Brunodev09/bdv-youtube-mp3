const fs = require('fs');
const path = require('path');
const touch = require('touch');

export default class Files {
    static getDir = (): string => {
        return path.basename(process.cwd());
    }

    static isDir = async (filePath): Promise<boolean> => {
        try {
            return await fs.existsSync(filePath);

        } catch (e) {
            throw e;
        }
    }

    static createDir = async (path) => {
        try {
            return await fs.mkdirSync(path);
        } catch (e) {
            throw e;
        }
    }

    static touch = async (path: string, fileName: string, buffer: string) => {
        try {
            return await fs.writeFileSync(`${path}/${fileName}`, buffer);
        } catch (e) {
            throw e;
        }
    }

    static read = async (path: string): Promise<any> => {
        try {
            let contents = await fs.readFileSync(path, 'utf8');
            return contents;
        } catch (e) {
            throw e;
        }
    }

    static readDir = async (filePath): Promise<string[]> => {
        if (!filePath) return null;
        try {
            return await fs.readdirSync(filePath);
            // return await path.basename(path.dirname(fs.realpathSync(__filename)));
        } catch (e) {
            throw e;
        }
    }
};