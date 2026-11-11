"""script.json -> spoken.json : the script as actually spoken (final takes). key = script sentence id (+ letter for ad-libs)."""
import json
S = json.load(open('edit/script.json'))
MOD = {
 62: ["woh ayat suniye jo us waqt Quran mein terah sau saal pehle nazil ho chuki thi."],
 95: ["thirteen point eight billion years peeche."],
 104: ["Ab Surah Al-Anbiya ki ayat number tees:"],
 168: ["Aur usi ayat ka agla hissa, jis ka tarjuma hai:"],
 190: ["Aap sallallahu alaihi wa aalihi wasallam Surah Tur ki tilawat farma rahe hain."],
 192: ["Aur phir yeh ayat aati hai, Surah Tur ki, jis ka tarjuma hai:"],
 244: ["is silsile ke peeche koi ek aisa zaroor hai"],
}
ADD = {62: "Surah Adh-Dhariyat ki ayat number saintalees:", 160: "jis ka tarjuma hai:", 249: "Surah Al-Ikhlas ki ayat hai, jis ka tarjuma:",
       272: "Surah Al-Anbiya mein aata hai, jis ka tarjuma hai:", 294: "Surah Fussilat mein aata hai, jis ka tarjuma:"}
DROP = {132, 303, 304}
out = []
for s in S:
    i = s['id']
    if i in DROP: continue
    out.append(dict(key=str(i), part=s['part'], text=MOD[i][0] if i in MOD else s['text']))
    if i in ADD: out.append(dict(key=f"{i}b", part=s['part'], text=ADD[i]))
for n, o in enumerate(out): o['id'] = n
json.dump(out, open('edit/spoken.json', 'w'), ensure_ascii=False, indent=1)
print(len(out), 'lines')
