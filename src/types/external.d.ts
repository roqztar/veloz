// Type declarations for external packages

declare module 'pdfjs-dist' {
  export const version: string;
  
  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
  }
  
  export interface PDFPageProxy {
    getTextContent(): Promise<TextContent>;
    cleanup(): void;
  }
  
  export interface TextContent {
    items: Array<TextItem | TextMarkedContent>;
  }
  
  export interface TextItem {
    str: string;
    dir: string;
    width: number;
    height: number;
    transform: number[];
    fontName: string;
    hasEOL: boolean;
  }
  
  export interface TextMarkedContent {
    type: 'beginMarkedContent' | 'endMarkedContent';
    id?: string;
  }
  
  export interface GetDocumentParams {
    data: ArrayBuffer;
    url?: string;
  }
  
  export function getDocument(params: GetDocumentParams): { promise: Promise<PDFDocumentProxy> };
  
  export namespace GlobalWorkerOptions {
    let workerSrc: string;
  }
}

declare module 'mammoth' {
  export interface ExtractResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }
  
  export interface ExtractOptions {
    arrayBuffer: ArrayBuffer;
  }
  
  export function extractRawText(options: ExtractOptions): Promise<ExtractResult>;
  export function extractInnerText(options: ExtractOptions): Promise<ExtractResult>;
}

declare module 'jszip' {
  export interface JSZipObject {
    name: string;
    dir: boolean;
    date: Date;
    comment: string;
    unixPermissions: number | null;
    dosPermissions: number | null;
    options: JSZipObjectOptions;
    async<T extends string | ArrayBuffer | Uint8Array>(type: T): Promise<T extends 'string' ? string : T extends 'arraybuffer' ? ArrayBuffer : T extends 'uint8array' ? Uint8Array : never>;
  }
  
  export interface JSZipObjectOptions {
    compression: string;
  }
  
  export interface JSZip {
    files: { [name: string]: JSZipObject };
    loadAsync(data: ArrayBuffer | Uint8Array | Blob | string, options?: JSZipLoadOptions): Promise<JSZip>;
    file(name: string): JSZipObject | null;
    folder(name: string): JSZip | null;
    filter(predicate: (relativePath: string, file: JSZipObject) => boolean): JSZipObject[];
    remove(name: string): JSZip;
    generateAsync<T>(options?: JSZipGeneratorOptions<T>): Promise<T>;
  }
  
  export interface JSZipLoadOptions {
    base64?: boolean;
    checkCRC32?: boolean;
    optimizedBinaryString?: boolean;
    createFolders?: boolean;
    decodeFileName?: (bytes: string[] | Uint8Array | Buffer) => string;
  }
  
  export interface JSZipGeneratorOptions<T> {
    type?: 'base64' | 'binarystring' | 'array' | 'uint8array' | 'arraybuffer' | 'blob' | 'nodebuffer';
    compression?: 'STORE' | 'DEFLATE';
    compressionOptions?: { level: number };
    comment?: string;
    mimeType?: string;
    platform?: 'DOS' | 'UNIX' | string;
    encodeFileName?: (name: string) => string;
    streamFiles?: boolean;
  }
  
  export default class JSZip implements JSZip {
    constructor();
    static loadAsync(data: ArrayBuffer | Uint8Array | Blob | string, options?: JSZipLoadOptions): Promise<JSZip>;
  }
}
