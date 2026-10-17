import { unzipSync } from "fflate";
import { SaxesParser } from "saxes";

export type AllowedFileExtension =
  | "pdf" | "docx" | "xlsx" | "csv" | "txt"
  | "png" | "jpg" | "jpeg" | "webp";

export type FileValidationResult =
  | { ok: true; extension: AllowedFileExtension }
  | { ok: false; reason: string };

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const extensions = new Set<AllowedFileExtension>([
  "pdf", "docx", "xlsx", "csv", "txt",
  "png", "jpg", "jpeg", "webp",
]);

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

function validText(bytes: Uint8Array): boolean {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text);
  } catch {
    return false;
  }
}

const MAX_ZIP_ENTRIES = 256;
const MAX_ZIP_TOTAL_BYTES = 20 * 1024 * 1024;
const MAX_REQUIRED_XML_BYTES = 2 * 1024 * 1024;

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipCrcTable(bytes: Uint8Array): Map<string, number> {
  const view = new DataView(
    bytes.buffer, bytes.byteOffset, bytes.byteLength,
  );
  const u16 = (p: number) => view.getUint16(p, true);
  const u32 = (p: number) => view.getUint32(p, true);

  // EOCD must be at the end, except for its declared ZIP comment.
  let eocd = -1;
  for (
    let p = bytes.length - 22;
    p >= Math.max(0, bytes.length - 65557);
    p--
  ) {
    if (
      u32(p) === 0x06054b50 &&
      p + 22 + u16(p + 20) === bytes.length
    ) {
      eocd = p;
      break;
    }
  }

  if (eocd < 0) throw new Error("Missing ZIP directory");

  const entries = u16(eocd + 10);
  const dirSize = u32(eocd + 12);
  const dirOffset = u32(eocd + 16);

  if (
    u16(eocd + 4) !== 0 ||
    u16(eocd + 6) !== 0 ||
    u16(eocd + 8) !== entries ||
    entries === 0 ||
    entries > MAX_ZIP_ENTRIES ||
    dirOffset + dirSize > eocd ||
    entries === 0xffff ||
    dirSize === 0xffffffff ||
    dirOffset === 0xffffffff
  ) {
    throw new Error("Unsupported ZIP directory");
  }

  const result = new Map<string, number>();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let p = dirOffset;
  let totalSize = 0;

  for (let i = 0; i < entries; i++) {
    if (p + 46 > dirOffset + dirSize || u32(p) !== 0x02014b50) {
      throw new Error("Invalid ZIP directory entry");
    }

    const flags = u16(p + 8);
    const method = u16(p + 10);
    const crc = u32(p + 16);
    const compressed = u32(p + 20);
    const original = u32(p + 24);
    const nameLen = u16(p + 28);
    const extraLen = u16(p + 30);
    const commentLen = u16(p + 32);
    const localOffset = u32(p + 42);
    const next = p + 46 + nameLen + extraLen + commentLen;

    if (
      next > dirOffset + dirSize ||
      (flags & 1) !== 0 ||
      (method !== 0 && method !== 8) ||
      compressed === 0xffffffff ||
      original === 0xffffffff ||
      localOffset === 0xffffffff ||
      localOffset + 30 > dirOffset ||
      u32(localOffset) !== 0x04034b50
    ) {
      throw new Error("Invalid ZIP entry metadata");
    }

    const name = decoder.decode(bytes.subarray(p + 46, p + 46 + nameLen));

    // Cross-check the local header against the central directory.
    const localFlags = u16(localOffset + 6);
    const localMethod = u16(localOffset + 8);
    const localNameLength = u16(localOffset + 26);
    const localExtraLength = u16(localOffset + 28);

    const localNameStart = localOffset + 30;
    const localNameEnd = localNameStart + localNameLength;
    const dataStart = localNameEnd + localExtraLength;
    const dataEnd = dataStart + compressed;

    if (
      localNameEnd > dirOffset ||
      dataStart > dirOffset ||
      dataEnd > dirOffset ||
      localFlags !== flags ||
      localMethod !== method
    ) {
      throw new Error("Local header metadata mismatch");
    }

    const localName = decoder.decode(
      bytes.subarray(localNameStart, localNameEnd),
    );

    if (localName !== name) {
      throw new Error("Local header filename mismatch");
    }

    // With bit 3 set, CRC and sizes may be stored in a data
    // descriptor rather than the local header.
    if ((flags & 0x0008) === 0) {
      if (
        u32(localOffset + 14) !== crc ||
        u32(localOffset + 18) !== compressed ||
        u32(localOffset + 22) !== original
      ) {
        throw new Error("Local header CRC or size mismatch");
      }
    }

    if (result.has(name)) throw new Error("Duplicate ZIP entry");

    totalSize += original;
    if (totalSize > MAX_ZIP_TOTAL_BYTES) {
      throw new Error("ZIP size limit exceeded");
    }

    result.set(name, crc);
    p = next;
  }

  if (p !== dirOffset + dirSize) {
    throw new Error("ZIP directory size mismatch");
  }

  return result;
}

const XML_NAMESPACES = {
  contentTypes: "http://schemas.openxmlformats.org/package/2006/content-types",
  relationships: "http://schemas.openxmlformats.org/package/2006/relationships",
  word: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
  spreadsheet: "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
};

function validRequiredXml(
  name: string,
  bytes: Uint8Array,
  extension: "docx" | "xlsx",
): boolean {
  const expected =
    name === "[Content_Types].xml"
      ? { local: "Types", uri: XML_NAMESPACES.contentTypes }
      : name === "_rels/.rels"
        ? { local: "Relationships", uri: XML_NAMESPACES.relationships }
        : extension === "docx"
          ? { local: "document", uri: XML_NAMESPACES.word }
          : { local: "workbook", uri: XML_NAMESPACES.spreadsheet };

  try {
    const xml = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const parser = new SaxesParser({ xmlns: true });

    let rootSeen = false;
    let rootValid = false;
    let invalid = false;

    parser.on("doctype", () => {
      invalid = true;
      throw new Error("DOCTYPE is not allowed");
    });

    parser.on("error", () => {
      invalid = true;
    });

    parser.on("opentag", (tag) => {
      if (!rootSeen) {
        rootSeen = true;
        rootValid =
          tag.local === expected.local &&
          tag.uri === expected.uri;
      }
    });

    parser.write(xml).close();
    return rootSeen && rootValid && !invalid;
  } catch {
    return false;
  }
}

function validZipDocument(
  bytes: Uint8Array,
  extension: "docx" | "xlsx",
): boolean {
  if (!startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) return false;

  const required = [
    "[Content_Types].xml",
    "_rels/.rels",
    extension === "docx" ? "word/document.xml" : "xl/workbook.xml",
  ];

  try {
    const checksums = zipCrcTable(bytes);

    for (const name of required) {
      if (!checksums.has(name)) return false;
    }

    let count = 0;
    let totalSize = 0;
    const seen = new Set<string>();

    const files = unzipSync(bytes, {
      filter: (entry) => {
        count++;
        if (count > MAX_ZIP_ENTRIES) {
          throw new Error("Too many entries");
        }

        const size = entry.originalSize;
        if (!Number.isSafeInteger(size) || size < 0) {
          throw new Error("Invalid uncompressed size");
        }

        totalSize += size;
        if (totalSize > MAX_ZIP_TOTAL_BYTES) {
          throw new Error("Uncompressed limit exceeded");
        }

        if (!required.includes(entry.name)) return false;

        if (
          seen.has(entry.name) ||
          size === 0 ||
          size > MAX_REQUIRED_XML_BYTES
        ) {
          throw new Error("Invalid XML entry");
        }

        seen.add(entry.name);
        return true;
      },
    });

    return required.every((name) => {
      const content = files[name];
      return (
        content instanceof Uint8Array &&
        content.length > 0 &&
        content.length <= MAX_REQUIRED_XML_BYTES &&
        crc32(content) === checksums.get(name)
        && validRequiredXml(name, content, extension)
      );
    });
  } catch {
    return false;
  }
}

export function validateFileContent(
  filename: string,
  bytes: Uint8Array,
): FileValidationResult {
  const extension = filename.split(".").pop()?.toLowerCase();

  if (!extension || !extensions.has(extension as AllowedFileExtension)) {
    return { ok: false, reason: "Unsupported file extension" };
  }

  if (bytes.length === 0 || bytes.length > MAX_FILE_BYTES) {
    return { ok: false, reason: "Invalid file size" };
  }

  const checks: Record<AllowedFileExtension, () => boolean> = {
    pdf: () => startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]),
    png: () => startsWith(bytes, [
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]),
    jpg: () => startsWith(bytes, [0xff, 0xd8, 0xff]),
    jpeg: () => startsWith(bytes, [0xff, 0xd8, 0xff]),
    webp: () =>
      bytes.length >= 12 &&
      startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
      startsWith(bytes.subarray(8), [0x57, 0x45, 0x42, 0x50]),
    docx: () => validZipDocument(bytes, "docx"),
    xlsx: () => validZipDocument(bytes, "xlsx"),
    txt: () => validText(bytes),
    csv: () => validText(bytes),
  };

  const allowed = extension as AllowedFileExtension;

  if (!checks[allowed]()) {
    return { ok: false, reason: "File content does not match extension" };
  }

  return { ok: true, extension: allowed };
}
