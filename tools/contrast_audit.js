/* ============================================================
   contrast_audit.js — WCAG-Kontrastprüfung im echten Render
   ------------------------------------------------------------
   Lädt eine der gebauten Seiten in Headless-Chrome, läuft mit echten
   Computed-Styles über jeden Text-Knoten, berechnet die effektive
   Hintergrundfarbe (Vorfahren hoch, Alpha kompositiert) und gibt alle
   Text/BG-Paare aus, die WCAG AA reißen.  Kein Screenshot, nur JSON.

   Aufruf:  node tools/contrast_audit.js mork.html
   ============================================================ */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const target = process.argv[2] || 'mork.html';
const winSize = process.argv[3] || '1280,1400';   // z.B. "390,2200" für Mobile
const OPEN_MODALS = process.argv.includes('modals');   // Modals aufklappen + mitprüfen
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// ---- in den Browser injizierter Audit-Code ---------------------------
const AUDIT = `(function(){
  ${OPEN_MODALS ? `['manual-modal','chat-modal','insta-modal'].forEach(function(b){
    var el=document.querySelector('.'+b); if(el) el.classList.add(b+'--open');
  });` : ''}
  function parseRGB(s){
    if(!s) return null;
    var m = s.match(/rgba?\\(([^)]+)\\)/); if(!m) return null;
    var p = m[1].split(',').map(function(x){return parseFloat(x);});
    return {r:p[0],g:p[1],b:p[2],a:p[3]===undefined?1:p[3]};
  }
  function lin(c){c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
  function lum(c){return 0.2126*lin(c.r)+0.7152*lin(c.g)+0.0722*lin(c.b);}
  function ratio(a,b){var L1=lum(a),L2=lum(b),hi=Math.max(L1,L2),lo=Math.min(L1,L2);return (hi+0.05)/(lo+0.05);}
  function over(fg,bg){var a=fg.a;return {r:fg.r*a+bg.r*(1-a),g:fg.g*a+bg.g*(1-a),b:fg.b*a+bg.b*(1-a),a:1};}
  var PAGE_BG = parseRGB(getComputedStyle(document.body).backgroundColor) || {r:14,g:16,b:20,a:1};
  if(PAGE_BG.a < 1) PAGE_BG = over(PAGE_BG,{r:14,g:16,b:20,a:1});

  function effectiveBg(el){
    var stack=[], hasImg=false, node=el;
    while(node && node.nodeType===1){
      var cs=getComputedStyle(node);
      if(cs.backgroundImage && cs.backgroundImage!=='none') hasImg=true;
      var bg=parseRGB(cs.backgroundColor);
      if(bg && bg.a>0){ stack.push(bg); if(bg.a>=1) break; }
      node=node.parentElement;
    }
    var result=PAGE_BG;
    for(var i=stack.length-1;i>=0;i--){ result=over(stack[i],result); }
    return {bg:result, hasImg:hasImg};
  }
  function pathOf(el){
    var p=el.tagName.toLowerCase();
    if(el.id) p+='#'+el.id;
    if(el.className && typeof el.className==='string') p+='.'+el.className.trim().split(/\\s+/).join('.');
    return p;
  }

  var out=[], seen={};
  var all=document.querySelectorAll('body *');
  for(var i=0;i<all.length;i++){
    var el=all[i];
    // nur Elemente mit direktem, sichtbarem Text
    var direct='';
    for(var n=0;n<el.childNodes.length;n++){ var ch=el.childNodes[n]; if(ch.nodeType===3) direct+=ch.nodeValue; }
    direct=direct.trim();
    if(!direct) continue;
    if(el.getClientRects().length===0) continue;
    var cs=getComputedStyle(el);
    if(cs.visibility==='hidden'||cs.display==='none') continue;
    if(parseFloat(cs.opacity)===0) continue;

    var fg=parseRGB(cs.color); if(!fg) continue;
    var eb=effectiveBg(el);
    var fgC = fg.a<1 ? over(fg, eb.bg) : fg;
    var r=ratio(fgC, eb.bg);

    var size=parseFloat(cs.fontSize), weight=parseInt(cs.fontWeight,10)||400;
    var large=(size>=24)||(size>=18.66 && weight>=700);
    var need=large?3.0:4.5;
    if(r>=need) continue;

    var key=pathOf(el)+'|'+Math.round(r*10);
    if(seen[key]) continue; seen[key]=1;
    out.push({
      kind:'text',
      sel:pathOf(el),
      text:direct.slice(0,42),
      color:'rgb('+Math.round(fgC.r)+','+Math.round(fgC.g)+','+Math.round(fgC.b)+')',
      bg:'rgb('+Math.round(eb.bg.r)+','+Math.round(eb.bg.g)+','+Math.round(eb.bg.b)+')',
      ratio:Math.round(r*100)/100,
      need:need,
      size:Math.round(size),
      img:eb.hasImg
    });
  }

  // --- Icon-Pass: SVG-Strokes/Fills interaktiver Icon-Buttons (WCAG 1.4.11,
  //     Nicht-Text-Kontrast, Schwelle 3:1). currentColor löst getComputedStyle
  //     bereits zur effektiven Farbe auf. ------------------------------------
  var icons=document.querySelectorAll('.btn-icon svg, .nav-toggle svg, [class*="close"] svg');
  for(var j=0;j<icons.length;j++){
    var svg=icons[j];
    if(svg.getClientRects().length===0) continue;
    var scs=getComputedStyle(svg);
    if(scs.visibility==='hidden'||scs.display==='none'||parseFloat(scs.opacity)===0) continue;
    var stroke=parseRGB(scs.stroke), fill=parseRGB(scs.fill);
    var ink=(scs.stroke!=='none' && stroke && stroke.a>0) ? stroke
           :(scs.fill!=='none'   && fill   && fill.a>0)   ? fill : null;
    if(!ink) continue;
    var ebI=effectiveBg(svg);
    var inkC = ink.a<1 ? over(ink, ebI.bg) : ink;
    var rI=ratio(inkC, ebI.bg);
    if(rI>=3.0) continue;
    var ikey='icon|'+pathOf(svg.parentElement||svg)+'|'+Math.round(rI*10);
    if(seen[ikey]) continue; seen[ikey]=1;
    out.push({
      kind:'icon',
      sel:pathOf(svg.parentElement||svg)+' > svg',
      text:(svg.parentElement&&svg.parentElement.getAttribute('aria-label'))||'(Icon)',
      color:'rgb('+Math.round(inkC.r)+','+Math.round(inkC.g)+','+Math.round(inkC.b)+')',
      bg:'rgb('+Math.round(ebI.bg.r)+','+Math.round(ebI.bg.g)+','+Math.round(ebI.bg.b)+')',
      ratio:Math.round(rI*100)/100,
      need:3.0,
      size:0,
      img:ebI.hasImg
    });
  }

  out.sort(function(a,b){return a.ratio-b.ratio;});
  var div=document.createElement('div');
  div.id='__contrast_report';
  // Marker zur Laufzeit zusammensetzen (sonst matcht der Quelltext im DOM-Dump);
  // Base64, damit HTML-Escaping die JSON nicht zerlegt.
  var payload=btoa(unescape(encodeURIComponent(JSON.stringify(out))));
  div.textContent='@@A'+'UD_START@@'+payload+'@@A'+'UD_END@@';
  document.body.appendChild(div);
})();`;

// ---- Temp-HTML mit injiziertem Script bauen --------------------------
const src = fs.readFileSync(path.join(ROOT, target), 'utf8');
if (!src.includes('</body>')) { console.error('kein </body> in ' + target); process.exit(1); }
const tmpName = '__audit_tmp.html';
const tmpPath = path.join(ROOT, tmpName);
fs.writeFileSync(tmpPath, src.replace('</body>', '<script>' + AUDIT + '</script></body>'));

// ---- Chrome headless --dump-dom --------------------------------------
const fileUrl = 'file:///' + tmpPath.replace(/\\/g, '/');
let dom = '';
try {
  dom = execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox',
    '--window-size=' + winSize,
    '--virtual-time-budget=5000', '--dump-dom', fileUrl
  ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
} catch (e) {
  dom = (e.stdout || '').toString();
} finally {
  fs.unlinkSync(tmpPath);
}

const m = dom.match(/@@AUD_START@@([\s\S]*?)@@AUD_END@@/);
if (!m) { console.error('Kein Audit-Report im DOM gefunden. Lief Chrome durch?'); process.exit(1); }
const report = JSON.parse(Buffer.from(m[1], 'base64').toString('utf8'));

console.log('\n=== Kontrast-Audit: ' + target + '  @ ' + winSize + ' ===');
console.log('WCAG AA: Normaltext ≥ 4.5,  Großtext ≥ 3.0\n');
if (report.length === 0) { console.log('  Keine Verstöße. ✅'); process.exit(0); }
console.log('  ' + report.length + ' Verstöße (schlechtester zuerst):\n');
for (const v of report) {
  const flag = v.img ? '  [BG-Bild/Verlauf — Wert ungenau]' : '';
  const tag = v.kind === 'icon' ? '[ICON] ' : '';
  const meta = v.kind === 'icon' ? '' : '  (' + v.size + 'px)';
  console.log('  ' + tag + String(v.ratio).padEnd(5) + ' / ' + v.need +
    '   ' + v.color + ' auf ' + v.bg + flag);
  console.log('        ' + v.sel);
  console.log('        “' + v.text + '”' + meta + '\n');
}
