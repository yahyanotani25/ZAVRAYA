"""quran-uthmani.json -> film14/src/quran.js  (machine copy; never hand-edit the Arabic)"""
import json
d = json.load(open('../quran/quran-uthmani.json', encoding='utf-8'))
def A(s, a, i=None, j=None):
    w = d['data']['surahs'][s-1]['ayahs'][a-1]['text'].split(' ')
    return ' '.join(w if i is None else w[i:j+1])
Q = {
 '2:259q': A(2,259,25,26), '2:259a': A(2,259,29,33), '2:259b': A(2,259,36,39), '2:259c': A(2,259,40,49),
 'ans': A(2,259,30,33), 'q': A(18,19,8,9),
 '22:47': A(22,47,7,14), 'w:taudDun': A(22,47,13,14),
 '18:19': A(18,19,5,16), 'w:wariq': A(18,19,25,25), '18:25': A(18,25), 'w:tisa': A(18,25,6,7), 'w:300': A(18,25,3,5),
 '23:99': A(23,99,5,7), '23:100': A(23,100,0,4), 'w:kalla': A(23,100,6,6),
 '23:112': A(23,112), '23:113': A(23,113), '23:114': A(23,114), '23:115': A(23,115), 'w:qalu': A(23,113,0,0),
 'w:law': A(23,114,6,9), 'w:qalil': A(23,114,4,4), 'w:abath': A(23,115,3,3), 'w:50k': A(70,4,8,10), 'w:alf': A(22,47,11,12), 'w:illa': A(103,3,0,0),
 '97:3': A(97,3), '103:1': A(103,1,4,4), '103:2': A(103,2), '103:3': A(103,3),
 '20:103': A(20,103,2,5), '20:104': A(20,104,8,11), '10:45': A(10,45,2,8), '79:46': A(79,46,3,8),
}
REF = {'2:259': 'Surah Al-Baqarah · 2:259', '22:47': 'Surah Al-Hajj · 22:47', '18:19': 'Surah Al-Kahf · 18:19', '18:25': 'Surah Al-Kahf · 18:25',
       '23:99': "Surah Al-Mu'minun · 23:99-100", '23:112': "Surah Al-Mu'minun · 23:112-113", '23:114': "Surah Al-Mu'minun · 23:114", '23:115': "Surah Al-Mu'minun · 23:115",
       '97:3': 'Surah Al-Qadr · 97:3', '70:4': "Surah Al-Ma'arij · 70:4", '103': "Surah Al-'Asr · 103:1-3"}
AR = {'hasan': 'الحسن البصري', 'shafii': 'الإمام الشافعي', 'ibn_kathir': 'ابن كثير', 'saw': 'ﷺ'}
js = '// AUTO-GENERATED from the verified Uthmani text (api.alquran.cloud / Tanzil). Never hand-edit the Arabic.\n'
js += 'export const Q = ' + json.dumps(Q, ensure_ascii=False, indent=1) + ';\nexport const REF = ' + json.dumps(REF, ensure_ascii=False, indent=1) + ';\n// vetted non-Quranic Arabic strings (names only)\nexport const AR = ' + json.dumps(AR, ensure_ascii=False, indent=1) + ';\n'
open('../film14/src/quran.js', 'w', encoding='utf-8').write(js)
for k, v in Q.items(): print(k, '|', v)
