"""Extract narration sentences of script 01 -> edit/script.json  (id, part, text)"""
import re, json, sys
src = "/home/user/ZAVRAYA/video-scripts/hidden-mysteries-of-islam/01-kainat-ka-pehla-lamha.md"
t = open(src, encoding="utf8").read()
body = t.split("## 2. Script", 1)[1].split("## 3. Fact-check", 1)[0]
out = []; part = ""
for line in body.splitlines():
    s = line.strip()
    if not s or s == "---": continue
    if s.startswith("###"): part = s.lstrip("# ").strip(); continue
    if s.startswith(">"): continue
    s = s.replace("*(pause)*", " ")
    # split into sentences on . ? ! … : ; and em-dash kept inside
    for sent in re.split(r'(?<=[.?!…:])\s+', s):
        sent = sent.strip()
        if len(re.sub(r'[^A-Za-z0-9]', '', sent)) < 2: continue
        out.append(dict(id=len(out), part=part, text=sent))
json.dump(out, open("edit/script.json", "w"), ensure_ascii=False, indent=1)
print(len(out), "sentences;", sum(len(o['text'].split()) for o in out), "words")
