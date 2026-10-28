# -*- coding: utf-8 -*-
"""Lit une Pfändungsfreigrenzenbekanntmachung (texte brut extrait du PDF du BGBl.) et écrit
la table officielle en JSON pour tests/engine.test.ts.

Usage :
    pdftotext -layout bgbl-2027.pdf .cache-raw/bek2027.txt
    python3 scripts/tabelle-einlesen.py .cache-raw/bek2027.txt tests/fixtures/tabelle-2027.json

Format de sortie : {"monat": [[von, bis, [p0..p5]], ...], "woche": [...], "tag": [...]},
une ligne par palier ; « – » (rien de saisissable) devient 0. Le texte brut reste dans
.cache-raw/ (ignoré par git) : on ne garde que les nombres.
"""
import json
import re
import sys

N = r'(\d{1,3}(?: \d{3})*,\d{2})'
V = r'(\d{1,3}(?: \d{3})*,\d{2}|–)'


def num(s: str) -> float:
    return round(float(s.replace(' ', '').replace(',', '.')), 2)


def parse(path: str) -> dict:
    out = {'monat': [], 'woche': [], 'tag': []}
    cur = None
    for line in open(path, encoding='utf-8').read().splitlines():
        if 'Auszahlung für Monate' in line:
            cur = 'monat'
        elif 'Auszahlung für Wochen' in line:
            cur = 'woche'
        elif 'Auszahlung für Tage' in line:
            cur = 'tag'
        if not cur:
            continue
        line = line.strip()
        m = re.match(rf'^bis {N}\s+' + r'\s+'.join([V] * 6) + '$', line)
        if m:
            out[cur].append([0, num(m.group(1)), [0 if x == '–' else num(x) for x in m.groups()[1:]]])
            continue
        m = re.match(rf'^{N} bis {N}\s+' + r'\s+'.join([V] * 6) + '$', line)
        if m:
            out[cur].append([num(m.group(1)), num(m.group(2)), [0 if x == '–' else num(x) for x in m.groups()[2:]]])
    return out


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    tab = parse(sys.argv[1])
    print({k: len(v) for k, v in tab.items()})
    if not all(tab.values()):
        sys.exit('Tabelle unvollständig gelesen : vérifier le texte extrait.')
    json.dump(tab, open(sys.argv[2], 'w', encoding='utf-8'))
