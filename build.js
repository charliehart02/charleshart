const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const WRITING_DIR = path.join(ROOT, 'writing');

function esc(s='') { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c])); }
function slugify(s='') { return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function parseFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return {data:{}, body:src};
  const data = {}; let key = null;
  for (const line of m[1].split('\n')) {
    const hit = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (hit) { key = hit[1]; let v = hit[2].trim(); if (v === 'true') v=true; else if(v==='false') v=false; data[key]=v; }
    else if (key && /^\s+/.test(line)) data[key] += ' ' + line.trim();
  }
  return {data, body:m[2].trim()};
}
function inline(s) {
  return esc(s).replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<img src="$2" alt="$1">').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>').replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2">$1</a>');
}
function markdown(md) {
  const lines=md.split(/\n/), out=[]; let para=[];
  const flush=()=>{if(para.length){out.push('<p>'+inline(para.join(' '))+'</p>');para=[];}};
  for(const line of lines){
    if(!line.trim()){flush();continue;}
    let m;
    if((m=line.match(/^##\s+(.+)/))){flush();out.push('<h2>'+inline(m[1])+'</h2>');}
    else if((m=line.match(/^>\s*(.+)/))){flush();out.push('<blockquote>'+inline(m[1])+'</blockquote>');}
    else if((m=line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/))){flush();out.push('<figure class="inline-photo"><img src="'+esc(m[2])+'" alt="'+esc(m[1])+'"></figure>');}
    else para.push(line.trim());
  } flush(); return out.join('\n');
}
function fmtDate(v){ const d=new Date(v+'T12:00:00'); return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase(); }
function articleTemplate(p){
 const hero=p.data.hero ? `<figure class="wide-photo"><img src="${esc(p.data.hero)}" alt="${esc(p.data.title)}"></figure>`:'';
 const engagement=`<div class="engagement" data-engagement-slug="${esc(p.slug)}"><span><b data-reads>—</b> READS</span><button type="button" data-useful-button aria-label="Mark article as useful">♡ <b data-useful>—</b> FOUND THIS USEFUL</button></div>`;
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${esc(p.data.summary)}"><title>${esc(p.data.title)} | Charles William Hart</title><link rel="stylesheet" href="../styles.css"></head><body><header class="nav"><a class="brand" href="../index.html">CWH</a><nav><a href="../index.html#about">About</a><a href="../index.html#experience">Experience</a><a href="../index.html#research">Research</a><a href="../index.html#writing">Writing</a><a href="../index.html#contact">Contact</a></nav></header><main><section class="article-hero wrap"><a class="back" href="../index.html#writing">← Writing</a><p class="eyebrow">${esc(String(p.data.category||'').toUpperCase())} · ${fmtDate(p.data.date)}</p><h1>${esc(p.data.title)}</h1><div class="article-deck"><p>${esc(p.data.subtitle||p.data.summary||'')}</p><div class="article-meta">CHARLES WILLIAM HART</div></div></section>${hero}<article class="article-body">${markdown(p.body)}${engagement}<div class="disclaimer"><b>Note</b><p>This article reflects my personal views and is provided for general informational purposes only. It does not represent the views of my employer and should not be considered investment, trading or financial advice.</p></div></article><section class="article-author wrap"><img src="../295EACEA-FC03-4FA1-9DA4-9B2DF4EC6A1F.png" alt="Charles William Hart"><div><p class="eyebrow">WRITTEN BY</p><h3>Charles William Hart</h3><p>Economics graduate working in commodity markets, interested in physical commodities, energy, trading and risk.</p><a href="../index.html#writing">More writing →</a></div></section></main><footer class="wrap"><span>© <span id="year"></span> Charles William Hart</span><span>charles-hart.com</span></footer><script src="../script.js"></script><script src="../engagement.js"></script></body></html>`;
}

const posts=fs.readdirSync(POSTS_DIR).filter(f=>f.endsWith('.md')).map(file=>{
 const parsed=parseFrontmatter(fs.readFileSync(path.join(POSTS_DIR,file),'utf8'));
 const slug=path.basename(file,'.md') || slugify(parsed.data.title);
 return {...parsed,slug,url:`writing/${slug}.html`};
}).sort((a,b)=>String(b.data.date).localeCompare(String(a.data.date)));

fs.mkdirSync(WRITING_DIR,{recursive:true});
for(const p of posts) fs.writeFileSync(path.join(WRITING_DIR,p.slug+'.html'),articleTemplate(p));
const data=posts.map(p=>({title:p.data.title,category:String(p.data.category||'').toUpperCase(),date:fmtDate(p.data.date),summary:p.data.summary,url:p.url}));
fs.writeFileSync(path.join(ROOT,'posts-data.js'),'window.CMS_POSTS='+JSON.stringify(data,null,2)+';\n');
console.log(`Generated ${posts.length} article(s).`);
