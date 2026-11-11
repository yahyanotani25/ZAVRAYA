import re, subprocess, os, sys, urllib.parse
fams = ["Bebas+Neue","Oswald:wght@400;500;600;700","Montserrat:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,500;1,600","Cinzel:wght@400;600;700;900",
        "Playfair+Display:ital,wght@0,500;0,700;1,500;1,700","Space+Mono:wght@400;700","Amiri+Quran","Amiri:ital,wght@0,400;0,700;1,400","Reem+Kufi:wght@400;600;700",
        "Aref+Ruqaa:wght@400;700","Noto+Nastaliq+Urdu:wght@400;700","Anton","Archivo+Black","Cormorant+Garamond:ital,wght@0,500;0,700;1,500;1,600","Noto+Naskh+Arabic:wght@400;600;700","Scheherazade+New:wght@400;700"]
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
out = []
os.makedirs('fonts', exist_ok=True)
for f in fams:
    url = f"https://fonts.googleapis.com/css2?family={f}&display=block"
    css = subprocess.run(["curl","-sSL","-A",UA,url],capture_output=True,text=True).stdout
    if '@font-face' not in css: print("FAIL", f, css[:100]); continue
    n=0
    for m in set(re.findall(r'url\((https://[^)]+\.woff2)\)', css)):
        name = re.sub(r'[^A-Za-z0-9._-]','_', m.split('/s/')[-1])
        p = os.path.join('fonts', name)
        if not os.path.exists(p): subprocess.run(["curl","-sSL","-A",UA,"-o",p,m],check=True)
        css = css.replace(m, 'fonts/'+name); n+=1
    out.append(css); print("ok", f, n)
open('fonts.css','w').write("\n".join(out))
