import { build } from 'esbuild';
await build({entryPoints:['admin/posts-editor.js'],bundle:true,format:'iife',target:['es2022'],outfile:'public/admin/posts-editor.js',minify:true,legalComments:'eof'});
console.log('Built the self-hosted article editor.');
