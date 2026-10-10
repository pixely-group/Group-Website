import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';

const root = path.resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const esbuild = require('/tmp/pixely-wp-build/node_modules/esbuild');
const out = path.join(root, 'wordpress/dist/pixely-landing');
await fs.mkdir(`${out}/assets`, {recursive:true});
const common = {
  absWorkingDir:root, bundle:true, minify:process.env.PIXELY_DEBUG !== '1', jsx:'automatic',
  tsconfig:path.join(root,'tsconfig.json'),
  define:{'process.env.NODE_ENV':JSON.stringify(process.env.PIXELY_DEBUG === '1' ? 'development' : 'production')},
  alias:Object.fromEntries(['image','link','dynamic','navigation'].map(name => [`next/${name}`,path.join(root,`wordpress/${name}.${name === 'navigation' ? 'js' : 'jsx'}`)])),
  plugins:[{name:'wordpress-waitlist',setup(build){
    build.onLoad({filter:/WaitlistForm\.tsx$/},async ({path:file}) => ({
      contents:(await fs.readFile(file,'utf8')).replace('fetch("/api/waitlist",','fetch(window.PixelyLanding.endpoint,'),loader:'tsx',resolveDir:path.dirname(file)
    }));
  }}]
};
await esbuild.build({...common,entryPoints:['wordpress/entry.jsx'],outdir:`${out}/assets`,entryNames:'app',chunkNames:'chunks/[name]-[hash]',splitting:true,format:'esm',platform:'browser'});
await esbuild.build({...common,entryPoints:['wordpress/render.jsx'],outfile:path.join(root,'wordpress/dist/render.cjs'),format:'cjs',platform:'node',external:['react','react-dom/server']});
const {html} = require('./dist/render.cjs');
await fs.writeFile(`${out}/hero.html`,html);
const cssFiles = await fs.readdir(path.join(root,'.next/static/css'));
let fonts = '';
for (const file of cssFiles) {
  const css = await fs.readFile(path.join(root,'.next/static/css',file),'utf8');
  fonts += (css.match(/@font-face\{[^}]+\}/g) || []).join('');
}
for (const match of fonts.matchAll(/url\(\/_next\/static\/media\/([^)]*)\)/g)) {
  await fs.copyFile(path.join(root,'.next/static/media',match[1]),`${out}/assets/${match[1]}`);
}
fonts = fonts.replaceAll('/_next/static/media/','./');
const css = await postcss([tailwind({base:root,optimize:true})]).process(await fs.readFile(`${root}/src/app/globals.css`,'utf8'),{from:`${root}/src/app/globals.css`});
const variables = 'html{--font-archivo:Archivo,Arial,sans-serif;--font-fraunces:Fraunces,Georgia,serif;--font-plex-mono:"IBM Plex Mono",monospace;--font-martian:"Martian Mono",monospace;--font-nunito:Nunito,sans-serif;height:100%}';
await fs.writeFile(`${out}/assets/app.css`,fonts+variables+css.css);
for (const width of [960,1920,3200,5120]) {
  await sharp(`${root}/public/images/hero-identity.jpeg`).resize(width).webp({quality:90,effort:6}).toFile(`${out}/assets/hero-${width}.webp`);
}
await fs.copyFile(`${root}/wordpress/pixely-landing.php`,`${out}/pixely-landing.php`);
execFileSync('/usr/bin/zip',['-qr',path.join(root,'wordpress/dist/pixely-landing.zip'),'pixely-landing'],{cwd:path.join(root,'wordpress/dist')});
console.log('Built WordPress package:',path.join(root,'wordpress/dist/pixely-landing.zip'));
