/**
 * Reading a list of people from a spreadsheet, with no spreadsheet library.
 *
 * CSV is parsed directly. An .xlsx file is a zip of XML files; only the first
 * sheet and the shared-string table are needed, so this reads the zip's
 * central directory, inflates those two entries with the browser's own
 * DecompressionStream and reads cell values out of the XML. Formulas, dates
 * and styles are ignored - a list of addresses and roles has none.
 */

export type Sheet = string[][];

/** RFC 4180 CSV, also accepting `;` (what Excel writes in many locales) and a UTF-8 BOM. */
export const parseCsv = (input: string): Sheet => {
  const text = input.replace(/^\uFEFF/, '');
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: Sheet = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((value) => value.trim() !== ''));
};

interface ZipEntry {
  name: string;
  method: number;
  compressedSize: number;
  offset: number;
}

const zipEntries = (bytes: Uint8Array): ZipEntry[] => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error('not a zip file');

  const count = view.getUint16(end + 10, true);
  let cursor = view.getUint32(end + 16, true);
  const entries: ZipEntry[] = [];
  const decoder = new TextDecoder();
  for (let n = 0; n < count; n += 1) {
    if (view.getUint32(cursor, true) !== 0x02014b50) throw new Error('broken zip directory');
    const method = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const offset = view.getUint32(cursor + 42, true);
    const name = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
    entries.push({ name, method, compressedSize, offset });
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
};

const readEntry = async (bytes: Uint8Array, entry: ZipEntry): Promise<string> => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const start = entry.offset + 30 + view.getUint16(entry.offset + 26, true) + view.getUint16(entry.offset + 28, true);
  const data = bytes.slice(start, start + entry.compressedSize);
  if (entry.method === 0) return new TextDecoder().decode(data);
  if (entry.method !== 8) throw new Error('unsupported zip compression');
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Response(stream).text();
};

const columnIndex = (reference: string) =>
  [...reference.replace(/\d+$/, '')].reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;

/** The first worksheet of an .xlsx file, as rows of cell text. */
export const readXlsx = async (buffer: ArrayBuffer): Promise<Sheet> => {
  const bytes = new Uint8Array(buffer);
  const entries = zipEntries(bytes);
  const find = (name: string) => entries.find((entry) => entry.name === name);
  const sheetEntry =
    find('xl/worksheets/sheet1.xml') ?? entries.find((entry) => /^xl\/worksheets\/[^/]+\.xml$/.test(entry.name));
  if (!sheetEntry) throw new Error('no worksheet');

  const parser = new DOMParser();
  const shared: string[] = [];
  const sharedEntry = find('xl/sharedStrings.xml');
  if (sharedEntry) {
    const doc = parser.parseFromString(await readEntry(bytes, sharedEntry), 'application/xml');
    for (const item of Array.from(doc.getElementsByTagName('si'))) {
      shared.push(Array.from(item.getElementsByTagName('t')).map((node) => node.textContent ?? '').join(''));
    }
  }

  const doc = parser.parseFromString(await readEntry(bytes, sheetEntry), 'application/xml');
  const rows: Sheet = [];
  for (const rowNode of Array.from(doc.getElementsByTagName('row'))) {
    const row: string[] = [];
    for (const cellNode of Array.from(rowNode.getElementsByTagName('c'))) {
      const type = cellNode.getAttribute('t');
      const raw =
        type === 'inlineStr'
          ? cellNode.getElementsByTagName('t')[0]?.textContent ?? ''
          : cellNode.getElementsByTagName('v')[0]?.textContent ?? '';
      const value = type === 's' ? shared[Number(raw)] ?? '' : raw;
      const reference = cellNode.getAttribute('r');
      const index = reference ? columnIndex(reference) : row.length;
      while (row.length < index) row.push('');
      row[index] = value;
    }
    if (row.some((value) => value.trim() !== '')) rows.push(row);
  }
  return rows;
};

/** Through FileReader, which every browser (and jsdom) has, rather than Blob.text(). */
const readFile = (file: File, as: 'text' | 'buffer') =>
  new Promise<string | ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string | ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    if (as === 'text') reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  });

/** A CSV or .xlsx file, by its name. */
export const readSheet = async (file: File): Promise<Sheet> =>
  /\.xlsx$/i.test(file.name)
    ? readXlsx((await readFile(file, 'buffer')) as ArrayBuffer)
    : parseCsv((await readFile(file, 'text')) as string);

const ROLE_WORDS: Record<string, string> = {
  ажилтан: 'user',
  хэрэглэгч: 'user',
  employee: 'user',
  staff: 'user',
  менежер: 'manager',
  удирдлага: 'manager',
  админ: 'admin',
  администратор: 'admin',
  'харах эрхтэй': 'viewer',
  ажиглагч: 'viewer',
};

const HEADER = {
  email: /^(e-?mail|и-?мэйл|имэйл|цахим шуудан)$/i,
  role: /^(role|эрх|үүрэг)$/i,
};

/**
 * Rows of email and role. A header row is found by its words (Mongolian or
 * English); without one the first column is the address and the second the
 * role. A missing role means an ordinary member.
 */
export const invitesFromSheet = (sheet: Sheet): Array<{ email: string; role: string }> => {
  if (!sheet.length) return [];
  const header = sheet[0].map((value) => value.trim());
  const emailAt = header.findIndex((value) => HEADER.email.test(value));
  const hasHeader = emailAt >= 0;
  const roleAt = hasHeader ? header.findIndex((value) => HEADER.role.test(value)) : 1;
  const body = hasHeader ? sheet.slice(1) : sheet;

  return body.map((row) => {
    const word = (row[roleAt] ?? '').trim().toLowerCase();
    return {
      email: (row[hasHeader ? emailAt : 0] ?? '').trim(),
      role: ROLE_WORDS[word] ?? (word || 'user'),
    };
  });
};
