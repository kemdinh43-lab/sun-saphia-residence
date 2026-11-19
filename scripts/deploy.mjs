import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const config=JSON.parse(await fs.readFile(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
if(config.d1_databases.some(db=>db.database_id==='00000000-0000-0000-0000-000000000000'))throw new Error('Hãy tạo D1 thật và điền database_id trước khi deploy.');
if(!config.vars.ADMIN_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.vars.ADMIN_EMAIL))throw new Error('Hãy cấu hình ADMIN_EMAIL trong wrangler.jsonc.');
let site;try{site=new URL(config.vars.SITE_ORIGIN);}catch{}
if(!site || site.protocol!=='https:' || site.pathname!=='/' || site.search || site.hash)throw new Error('Hãy cấu hình SITE_ORIGIN bằng tên miền HTTPS đã chọn.');
const result=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','deploy'],{stdio:'inherit'});
process.exit(result.status??1);
