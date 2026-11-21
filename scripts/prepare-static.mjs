import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const repo = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(repo,'dist');
const extensions = new Set(['.html','.css','.js','.json','.svg','.txt','.xml','.png','.jpg','.jpeg','.webp','.avif','.gif','.ico','.woff2','.woff','.ttf','.eot','.mp3','.mp4','.webm','.vtt','.webmanifest','.pdf','.csv']);
const skip = new Set(['.git','.vercel','node_modules','dist','scripts','tests','work','app','src','lib','components','api','_gen','__pycache__','brand-link-policy.json','brand-check-policy.json','package.json','package-lock.json','tsconfig.json','vercel.json']);
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
function copy(dir,dest) {
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
  if(skip.has(entry.name) || (entry.name.startsWith('.') && entry.name!=='.well-known')) continue;
  const from=path.join(dir,entry.name),to=path.join(dest,entry.name);
  if(entry.isDirectory()) {fs.mkdirSync(to,{recursive:true});copy(from,to);}
  else if(extensions.has(path.extname(entry.name))) fs.copyFileSync(from,to);
 }
}
copy(repo,out);
// Legacy section indexes contained only comments, so their navigation links
// opened blank pages. Build browseable hubs from the existing article files.
const home = fs.readFileSync(path.join(out,'index.html'),'utf8');
const sharedStyle = home.match(/<style>[\s\S]*?<\/style>/)?.[0] || '';
const sharedHeader = home.match(/<header\b[^>]*>[\s\S]*?<\/header>/)?.[0] || '';
const escape = text => String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
for (const [directory,label] of [['reviews','Reviews'],['comparisons','Comparisons'],['case-studies','Case studies']]) {
 const folder=path.join(out,directory), index=path.join(folder,'index.html');
 if(fs.existsSync(index) && /<h1\b/i.test(fs.readFileSync(index,'utf8'))) continue;
 const items=fs.readdirSync(folder).filter(name=>name.endsWith('.html')&&name!=='index.html').sort().map(name=>{
  const source=fs.readFileSync(path.join(folder,name),'utf8');
  const title=source.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]*>/g,'') || source.match(/<title>(.*?)<\/title>/i)?.[1] || name;
  return `<li><a href="/${directory}/${escape(name.replace(/\.html$/,''))}">${title}</a></li>`;
 });
 const url=`https://bnbacceleratorreviews-site.vercel.app/${directory}`;
 fs.writeFileSync(index,`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex, follow"><title>${label} | BNB Accelerator Preview</title><meta name="description" content="Browse ${items.length} existing ${label.toLowerCase()} in this preview publication."><link rel="canonical" href="${url}">${sharedStyle}</head><body>${sharedHeader}<main class="research-content section-index"><p class="research-kicker">Preview publication</p><h1>${label}</h1><p>Browse the existing articles in this section. This preview remains separate from the live review website.</p><ul>${items.join('')}</ul><p><a href="/">Return to the publication home</a></p></main></body></html>`);
 console.log(`Built ${directory} hub with ${items.length} existing articles.`);
}
// Keep the existing navigation usable on every page at phone widths.
function addMobileLayout(dir) {
 for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
  const file=path.join(dir,entry.name);
  if(entry.isDirectory()) addMobileLayout(file);
  else if(entry.name.endsWith('.html')) {
   const html=fs.readFileSync(file,'utf8');
   if(!html.includes('/mobile-layout.css')) fs.writeFileSync(file,html.replace('</head>','<link rel="stylesheet" href="/mobile-layout.css?v=20261120">\n</head>'));
  }
 }
}
addMobileLayout(out);
if(!fs.existsSync(path.join(out,'index.html'))) throw new Error('Static publish directory is missing index.html');
console.log('Prepared static publish directory without build sources or brand policy files.');
