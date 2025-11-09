declare module 'pdf-parse' {
  import type { Buffer } from 'node:buffer';

  interface PDFInfo {
    PDFFormatVersion: string;
    IsAcroFormPresent: boolean;
    IsXFAPresent: boolean;
    Title?: string;
    Author?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: string;
    ModDate?: string;
    Metadata?: string;
  }

  interface PDFMetadata {
    text: string;
    metadata?: PDFInfo;
    version?: string;
    numpages?: number;
    numrender?: number;
    info?: PDFInfo;
  }

  function pdfParse(data: Buffer | Uint8Array, options?: Record<string, unknown>): Promise<PDFMetadata>;

  export = pdfParse;
}
