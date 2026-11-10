"""Export the Attack sheet of the CalHack workbook to calhack/cases.json.

Usage: python3 -I scripts/calhack/export_cases.py <workbook.xlsx> [out.json]

Standard library only. The tests read payloads from cases.json so the sheet
stays the single source of truth for untrusted_text.
"""
import json
import sys
import zipfile
import xml.etree.ElementTree as ET

M = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
R = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'


def col_index(ref):
    letters = ''.join(c for c in ref if c.isalpha())
    n = 0
    for c in letters:
        n = n * 26 + (ord(c) - 64)
    return n - 1


def main():
    src = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else 'calhack/cases.json'
    with zipfile.ZipFile(src) as z:
        shared = []
        if 'xl/sharedStrings.xml' in z.namelist():
            for si in ET.fromstring(z.read('xl/sharedStrings.xml')):
                shared.append(''.join(t.text or '' for t in si.iter(M + 't')))
        wb = ET.fromstring(z.read('xl/workbook.xml'))
        rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        target = None
        for sh in wb.iter(M + 'sheet'):
            if sh.get('name') == 'Attack':
                rid = sh.get(R + 'id')
                for rel in rels:
                    if rel.get('Id') == rid:
                        target = 'xl/' + rel.get('Target').lstrip('/').replace('xl/', '', 1)
        if not target:
            sys.exit('Attack sheet not found')
        sheet = ET.fromstring(z.read(target))
        rows = []
        for row in sheet.find(M + 'sheetData'):
            vals = {}
            for c in row:
                t = c.get('t')
                v = c.findtext(M + 'v')
                if t == 's' and v is not None:
                    v = shared[int(v)]
                elif t == 'inlineStr':
                    v = ''.join(x.text or '' for x in c.iter(M + 't'))
                vals[col_index(c.get('r'))] = v or ''
            rows.append(vals)
    header = [rows[0].get(i, '') for i in range(max(rows[0]) + 1)]
    cases = []
    for r in rows[1:]:
        rec = {h: r.get(i, '') for i, h in enumerate(header)}
        if rec.get('case_id'):
            cases.append(rec)
    with open(out, 'w', encoding='utf-8') as f:
        json.dump({'source': 'CALHACK-102-Attack.xlsx / Attack', 'cases': cases}, f, indent=2, ensure_ascii=False)
        f.write('\n')
    print(f'wrote {len(cases)} cases to {out}')


if __name__ == '__main__':
    main()
