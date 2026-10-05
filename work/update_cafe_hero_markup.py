from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'studio.html'
s=p.read_text(encoding='utf-8')
s=s.replace('href="assets/cafe/host-cutout.png"','href="assets/cafe/host-v3.webp"')
s=s.replace('src="assets/cafe/host-cutout.png" alt="" width="1536" height="1024"','src="assets/cafe/host-v3.webp" alt="" width="1585" height="992"')
start=s.index('  <div class="cafe-counter"')
end=s.index('  <button id="cafeArchive"',start)
s=s[:start]+'''  <div class="cafe-counter" aria-hidden="true"><img src="assets/cafe/foreground-v3.webp" alt="" width="2379" height="840" draggable="false" fetchpriority="high"><div class="cafe-counter-type"><span>EST. 2024<br>PER GLI AMANTI DEL CAFFÈ</span><b>PIÙ CAFFÈ<br>PIÙ VITA</b></div></div>
'''+s[end:]
p.write_text(s,encoding='utf-8')
