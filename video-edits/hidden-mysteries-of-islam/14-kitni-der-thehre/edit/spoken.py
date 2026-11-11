"""script.json -> spoken.json : the script as actually spoken (final takes). key = script sentence id (+ letter for ad-libs)."""
import json
S = json.load(open('edit/script.json'))
MOD = {          # id -> [text as spoken]
 37: ["Woh kya hai — yeh bhi aakhir mein bataunga."],
 39: ["Surah Al-Baqarah, ayat number 259."],
 40: ["Ek shakhs — mashhoor qaul ke mutabiq Hazrat Uzair (alayhis-salam) — apne gadhe par sawar ho kar ek ujdi hui basti se guzarta hai."],
 41: ["Chhatein zameen par giri hui hain."],
 48: ["Phir usay dobara zinda karta hai."],
 50: ['"Kam labitht?" — Tum kitni der thehre?'],
 51: ["Woh suraj ko dekhta hai — abhi ghuroob nahi hua."],
 56: ['Tum SAU SAAL thehre."'],
 57: ["Aur saboot us ke saamne rakh diya jata hai:"],
 58: ['"Apne khane ko dekho — is par saal guzre hi nahi.'],
 74: ["Newton ke nazdeek waqt poori kainat mein ek hi raftaar se behta hai — mera ek second, aapka ek second, sab barabar hai."],
 79: ["Doosra:"],
 101: ["Oonchi wali tez chali — kyunke zameen se zara door, gravity zara kam thi."],
 112: ["Jis ka naam hai:"],
 129: ["Waqt ke sust hone ka zinda saboot hai."],
 130: ["Aur abhi bhi shak ho — phone nikaliye."],
 144: ["Surah Al-Hajj ki ayat number 47, jis ka tarjuma hai:"],
 159: ["Aur sirf do raaste:"],
 160: ["imaan chhod do — ya jaan de do."],
 182: ['"Woh apne ghaar mein teen sau saal rahe — aur nau aur badha diye gaye."'],
 202: ["yeh farq us zamane ke hisaab-daanon ko maloom tha, aur Imam Ibn Kathir ne saat sau saal pehle yehi likha."],
 259: ["Phir bhi Quran isay aise sunata hai — jaise ho chuka."],
 266: ['jis ne waqt ko paida kiya — us ke saamne "hoga" aur "ho chuka" mein farq...'],
 308: ['"Din ki ghadi." Phir:'],
 316: ["Phir chaubees se zarb dijiye."],
 324: ["Yeh hisaab tafsir nahi — sirf andaza lagane ke liye."],
 345: ["Aur wazan kaise badhta hai — is ke liye Allah ne poori ek surat utari hai."],
 346: ["Aur us ki ibtida mein khud waqt ki qasam khayi hai:"],
 372: ["Aapke paas waqt nahi."],
 181: ["Surah Al-Kahf ki ayat number pachees, jis ka tarjuma hai:"],
 193: ["teen sau chauwan point saintees."],
 302: ['"Tum thodi der thehre.'],
 380: ["ek sau taintalees."],
 375: ['jis kaam ko — ya jis insaan ko — aap ne "kabhi fursat mein" keh ke taal rakha hai...'],
 376: ["aaj hi kar lijiye."],
 377: ["Aur agli video mein baat waqt ki nahi — tarteeb ki hogi."],
 383: ['"darmiyan."'],
 384: ["Aur yeh to sirf pehli parat hai."],
 385: ["Screen par mulaqat hogi."],
}
ADD = {          # id -> extra spoken sentence right after it (key "<id>b")
 49: "Surah Al-Baqarah ki ayat number 259 ka tarjuma:",
 57: "Surah Al-Baqarah ki ayat number 259, jis ka tarjuma hai:",
 301: "Surah Al-Mu'minun mein aata hai:",
 337: "Surah Al-Qadr ki ayat hai, jis ka tarjuma:",
 346: "Surah Al-Asr, jis ka tarjuma:",
}
DROP = {357, 219} # 357 = the "(3 second ki khamoshi)" stage direction; 219 was mis-spoken ("naapta hai") and is cut out of the voice track
out = []
for s in S:
    i = s['id']
    if i in DROP: continue
    out.append(dict(key=str(i), part=s['part'], text=MOD[i][0] if i in MOD else s['text']))
    if i in ADD: out.append(dict(key=f"{i}b", part=s['part'], text=ADD[i]))
for n, o in enumerate(out): o['id'] = n
json.dump(out, open('edit/spoken.json', 'w'), ensure_ascii=False, indent=1)
print(len(out), 'lines')
