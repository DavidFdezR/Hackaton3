"""Append calhack/new-cases.json rows to the Attack sheet of the CalHack workbook.

Usage: python3 -I scripts/calhack/add_rows_to_workbook.py <workbook.xlsx>

Edits only xl/worksheets/<Attack>.xml, xl/sharedStrings.xml and the filter range in
xl/workbook.xml; every other part is copied byte for byte. Skips case_ids already present.
"""
import json
import re
import shutil
import sys
import tempfile
import zipfile
from xml.sax.saxutils import escape

COLS = ['team', 'kind', 'case_id', 'situation', 'expected_result', 'rationale', 'author', 'reviewer',
        'environment', 'difficulty', 'untrusted_text', 'safe_response']
LETTERS = 'ABCDEFGHIJKL'


def main():
    src = sys.argv[1]
    new = json.load(open('calhack/new-cases.json', encoding='utf-8'))
    rows = [dict(new['defaults'], **c) for c in new['cases']]

    with zipfile.ZipFile(src) as z:
        parts = {i.filename: (i, z.read(i.filename)) for i in z.infolist()}
    wb = parts['xl/workbook.xml'][1].decode('utf-8')
    rels = parts['xl/_rels/workbook.xml.rels'][1].decode('utf-8')
    rid = re.search(r'<sheet [^>]*name="Attack"[^>]*r:id="(rId\d+)"', wb).group(1)
    target = re.search(r'<Relationship [^>]*Id="%s"[^>]*Target="([^"]+)"' % rid, rels) or \
        re.search(r'<Relationship [^>]*Target="([^"]+)"[^>]*Id="%s"' % rid, rels)
    sheet_name = 'xl/' + target.group(1).lstrip('/').replace('xl/', '', 1)
    sheet = parts[sheet_name][1].decode('utf-8')
    sst = parts['xl/sharedStrings.xml'][1].decode('utf-8')

    strings = [re.sub(r'<[^>]+>', '', m) for m in re.findall(r'<si>(.*?)</si>', sst, re.S)]
    present = set()
    for m in re.finditer(r'<c r="C\d+"[^>]*t="s"[^>]*><v>(\d+)</v>', sheet):
        present.add(strings[int(m.group(1))])
    last_row = max(int(r) for r in re.findall(r'<row r="(\d+)"', sheet))

    new_si, xml_rows, added = [], [], []
    count_refs = 0
    idx = len(strings)
    lookup = {s: i for i, s in enumerate(strings)}
    for row in rows:
        if row['case_id'] in present:
            continue
        last_row += 1
        cells = []
        for col, letter in zip(COLS, LETTERS):
            value = row.get(col, '')
            if value == '':
                continue
            if value in lookup:
                si = lookup[value]
            else:
                si = idx
                lookup[value] = idx
                idx += 1
                new_si.append('<si><t xml:space="preserve">%s</t></si>' % escape(value))
            count_refs += 1
            cells.append('<c r="%s%d" t="s"><v>%d</v></c>' % (letter, last_row, si))
        xml_rows.append('<row r="%d" spans="1:12" x14ac:dyDescent="0.2">%s</row>' % (last_row, ''.join(cells)))
        added.append(row['case_id'])

    if not added:
        print('nothing to add; all case_ids already present')
        return

    sheet = sheet.replace('</sheetData>', ''.join(xml_rows) + '</sheetData>', 1)
    sheet = re.sub(r'<dimension ref="A1:L\d+"/>', '<dimension ref="A1:L%d"/>' % last_row, sheet, 1)
    sheet = re.sub(r'<autoFilter ref="A1:L\d+"', '<autoFilter ref="A1:L%d"' % last_row, sheet, 1)
    wb = re.sub(r"(Attack'?!\$A\$1:\$L\$)\d+", r'\g<1>%d' % last_row, wb, 1)

    m = re.search(r'<sst [^>]*count="(\d+)"[^>]*uniqueCount="(\d+)"', sst)
    sst = sst.replace('</sst>', ''.join(new_si) + '</sst>', 1)
    sst = re.sub(r'count="\d+"', 'count="%d"' % (int(m.group(1)) + count_refs), sst, 1)
    sst = re.sub(r'uniqueCount="\d+"', 'uniqueCount="%d"' % idx, sst, 1)

    replaced = {sheet_name: sheet.encode('utf-8'), 'xl/sharedStrings.xml': sst.encode('utf-8'), 'xl/workbook.xml': wb.encode('utf-8')}
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx').name
    with zipfile.ZipFile(tmp, 'w') as out:
        for name, (info, data) in parts.items():
            out.writestr(info, replaced.get(name, data))
    shutil.move(tmp, src)
    print('added %d rows (%s .. %s) at rows %d..%d' % (len(added), added[0], added[-1], last_row - len(added) + 1, last_row))


if __name__ == '__main__':
    main()
