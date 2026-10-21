import { describe, expect, it } from 'vitest';
import { invitesFromSheet, parseCsv, readXlsx } from './sheetImport';

/** A zip with stored (uncompressed) entries - enough to stand in for an .xlsx. */
const storedZip = (files: Record<string, string>): ArrayBuffer => {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(content);
    const local = new Uint8Array(30 + nameBytes.length + data.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    local.set(data, 30 + nameBytes.length);
    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }
  const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, centrals.length, true);
  ev.setUint16(10, centrals.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  const all = new Uint8Array(offset + centralSize + 22);
  let at = 0;
  for (const part of [...locals, ...centrals, end]) {
    all.set(part, at);
    at += part.length;
  }
  return all.buffer;
};

describe('reading people from a spreadsheet', () => {
  it('parses CSV with quotes, a BOM and semicolons', () => {
    expect(parseCsv('﻿email;role\r\n"a@x.mn";"менежер"\r\n\r\nb@x.mn;\n')).toEqual([
      ['email', 'role'],
      ['a@x.mn', 'менежер'],
      ['b@x.mn', ''],
    ]);
    expect(parseCsv('a,"b, ""c"""\n')).toEqual([['a', 'b, "c"']]);
  });

  it('maps Mongolian headers and role words, defaulting the role to member', () => {
    const sheet = parseCsv('И-мэйл,Эрх\nbat@x.mn,Ажилтан\nsara@x.mn,Менежер\nold@x.mn,\nodd@x.mn,pilot\n');
    expect(invitesFromSheet(sheet)).toEqual([
      { email: 'bat@x.mn', role: 'user' },
      { email: 'sara@x.mn', role: 'manager' },
      { email: 'old@x.mn', role: 'user' },
      // Unknown words pass through, so the server can report the row.
      { email: 'odd@x.mn', role: 'pilot' },
    ]);
  });

  it('reads a sheet without a header as address, role', () => {
    expect(invitesFromSheet([['a@x.mn', 'admin']])).toEqual([{ email: 'a@x.mn', role: 'admin' }]);
  });

  it('reads the first sheet of an .xlsx file, shared and inline strings', async () => {
    const buffer = storedZip({
      'xl/sharedStrings.xml':
        '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><si><t>Email</t></si><si><t>Role</t></si><si><t>bat@x.mn</t></si></sst>',
      'xl/worksheets/sheet1.xml':
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' +
        '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>' +
        '<row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2" t="inlineStr"><is><t>manager</t></is></c></row>' +
        '<row r="3"><c r="B3" t="inlineStr"><is><t>user</t></is></c></row>' +
        '</sheetData></worksheet>',
    });

    const sheet = await readXlsx(buffer);

    expect(sheet).toEqual([
      ['Email', 'Role'],
      ['bat@x.mn', 'manager'],
      ['', 'user'],
    ]);
  });

  it('refuses a file that is not a zip', async () => {
    await expect(readXlsx(new TextEncoder().encode('hello').buffer)).rejects.toThrow('not a zip file');
  });
});
