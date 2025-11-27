declare module 'adm-zip' {
  import type { Buffer } from 'node:buffer';

  interface IZipEntry {
    entryName: string;
    isDirectory: boolean;
    getData(): Buffer;
    getDataAsText(): string;
    getDataAsText(encoding: string): string;
  }

  class AdmZip {
    constructor(inputFilePath?: string);
    constructor(rawInput: Buffer);
    constructor(rawInput: Buffer, fileName?: string);

    getEntries(): IZipEntry[];
    getEntry(entryName: string): IZipEntry | null;
    addFile(entryName: string, data: Buffer, comment?: string, attr?: number): void;
    addLocalFile(localPath: string, zipPath?: string): void;
    addLocalFolder(localPath: string, zipPath?: string): void;
    extractAllTo(targetPath: string, overwrite?: boolean): void;
    extractEntryTo(entryName: string, targetPath: string, maintainEntryPath?: boolean, overwrite?: boolean): boolean;
    writeZip(targetPath: string, callback?: (error: Error | null) => void): void;
    toBuffer(): Buffer;
  }

  export = AdmZip;
}

