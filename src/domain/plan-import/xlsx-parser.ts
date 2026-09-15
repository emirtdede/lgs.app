import zlib from "node:zlib";

/**
 * Pure Node.js zero-dependency XLSX parser.
 * Handles PKZIP decompression and OpenXML worksheet parsing.
 */

export interface SheetRow<T = Record<string, string>> {
  rowNum: number;
  data: T;
}

function parseXmlAttrs(tagContent: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /([a-zA-Z0-9_:-]+)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(tagContent)) !== null) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

export class XlsxParser {
  private files: Record<string, Buffer> = {};
  private sheetPaths: Record<string, string> = {};
  private sharedStrings: string[] = [];

  constructor(xlsxBuffer: Buffer) {
    this.extractZip(xlsxBuffer);
    this.parseSharedStrings();
    this.parseWorkbookStructure();
  }

  private extractZip(buf: Buffer): void {
    let idx = 0;
    while (idx < buf.length - 4) {
      if (buf.readUInt32LE(idx) === 0x04034b50) {
        const compMethod = buf.readUInt16LE(idx + 8);
        const compSize = buf.readUInt32LE(idx + 18);
        const nameLen = buf.readUInt16LE(idx + 26);
        const extraLen = buf.readUInt16LE(idx + 28);
        const name = buf.toString("utf8", idx + 30, idx + 30 + nameLen);
        const dataStart = idx + 30 + nameLen + extraLen;
        const compData = buf.subarray(dataStart, dataStart + compSize);

        if (compMethod === 0) {
          this.files[name] = compData;
        } else if (compMethod === 8) {
          this.files[name] = zlib.inflateRawSync(compData);
        }
        idx = dataStart + compSize;
      } else {
        idx++;
      }
    }
  }

  private parseSharedStrings(): void {
    const sstBuffer = this.files["xl/sharedStrings.xml"];
    if (!sstBuffer) return;

    const sstXml = sstBuffer.toString("utf8");
    const siRegex = /<si\b[^>]*>(.*?)<\/si>/gs;
    let match: RegExpExecArray | null;

    while ((match = siRegex.exec(sstXml)) !== null) {
      const inner = match[1];
      const tRegex = /<t\b[^>]*>(.*?)<\/t>/gs;
      let text = "";
      let tMatch: RegExpExecArray | null;
      while ((tMatch = tRegex.exec(inner)) !== null) {
        text += tMatch[1];
      }
      text = text
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
      this.sharedStrings.push(text);
    }
  }

  private parseWorkbookStructure(): void {
    const wbBuffer = this.files["xl/workbook.xml"];
    const relsBuffer = this.files["xl/_rels/workbook.xml.rels"];
    if (!wbBuffer || !relsBuffer) return;

    const relsXml = relsBuffer.toString("utf8");
    const rels: Record<string, string> = {};
    const relRegex = /<Relationship\b([^>]*)\/?>/g;
    let rMatch: RegExpExecArray | null;
    while ((rMatch = relRegex.exec(relsXml)) !== null) {
      const attrs = parseXmlAttrs(rMatch[1]);
      if (attrs.Id && attrs.Target) {
        let target = attrs.Target;
        if (target.startsWith("/")) target = target.slice(1);
        if (!target.startsWith("xl/")) target = `xl/${target}`;
        rels[attrs.Id] = target;
      }
    }

    const wbXml = wbBuffer.toString("utf8");
    const sheetRegex = /<(?:[a-zA-Z0-9]+:)?sheet\b([^>]*)\/?>/g;
    let sMatch: RegExpExecArray | null;
    while ((sMatch = sheetRegex.exec(wbXml)) !== null) {
      const attrs = parseXmlAttrs(sMatch[1]);
      const sheetName = attrs.name;
      const relId = attrs["r:id"] || attrs.id;
      if (sheetName && relId && rels[relId]) {
        this.sheetPaths[sheetName] = rels[relId];
      }
    }
  }

  public getSheetNames(): string[] {
    return Object.keys(this.sheetPaths);
  }

  private colToIdx(col: string): number {
    let n = 0;
    for (let i = 0; i < col.length; i++) {
      n = n * 26 + col.charCodeAt(i) - 64;
    }
    return n - 1;
  }

  public parseSheet<T = Record<string, string>>(sheetName: string): SheetRow<T>[] {
    const sheetPath = this.sheetPaths[sheetName];
    if (!sheetPath || !this.files[sheetPath]) {
      throw new Error(`Worksheet not found: ${sheetName}`);
    }

    const xml = this.files[sheetPath].toString("utf8");
    const rowRegex =
      /<(?:[a-zA-Z0-9]+:)?row\b[^>]*\br="(\d+)"[^>]*>(.*?)<\/(?:[a-zA-Z0-9]+:)?row>/gs;
    const rows: { rowNum: number; cells: Record<number, string> }[] = [];

    let rowMatch: RegExpExecArray | null;
    while ((rowMatch = rowRegex.exec(xml)) !== null) {
      const rowNum = parseInt(rowMatch[1], 10);
      const cellXml = rowMatch[2];
      const cells: Record<number, string> = {};

      const cRegex =
        /<(?:[a-zA-Z0-9]+:)?c\b([^>]*)>(?:<(?:[a-zA-Z0-9]+:)?v>(.*?)<\/(?:[a-zA-Z0-9]+:)?v>)?(?:<(?:[a-zA-Z0-9]+:)?is><(?:[a-zA-Z0-9]+:)?t[^>]*>(.*?)<\/(?:[a-zA-Z0-9]+:)?t><\/(?:[a-zA-Z0-9]+:)?is>)?<\/(?:[a-zA-Z0-9]+:)?c>/gs;
      let cMatch: RegExpExecArray | null;

      while ((cMatch = cRegex.exec(cellXml)) !== null) {
        const attrs = parseXmlAttrs(cMatch[1]);
        const rAttr = attrs.r;
        if (!rAttr) continue;

        const colStr = rAttr.replace(/\d+$/, "");
        const colIdx = this.colToIdx(colStr);
        const type = attrs.t;
        const val = cMatch[2];
        const inlineStr = cMatch[3];

        if (inlineStr !== undefined) {
          cells[colIdx] = inlineStr;
        } else if (val !== undefined) {
          if (type === "s") {
            const strIdx = parseInt(val, 10);
            cells[colIdx] = this.sharedStrings[strIdx] ?? "";
          } else {
            cells[colIdx] = val;
          }
        }
      }
      rows.push({ rowNum, cells });
    }

    if (rows.length === 0) return [];

    // Header is row 1
    const headerRow = rows[0];
    const headerCols: Record<number, string> = {};
    for (const [idxStr, headerName] of Object.entries(headerRow.cells)) {
      headerCols[parseInt(idxStr, 10)] = headerName.trim();
    }

    const result: SheetRow<T>[] = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const data: Record<string, string> = {};
      for (const [idxStr, header] of Object.entries(headerCols)) {
        const colIdx = parseInt(idxStr, 10);
        data[header] = r.cells[colIdx] ?? "";
      }
      result.push({
        rowNum: r.rowNum,
        data: data as unknown as T,
      });
    }

    return result;
  }
}
