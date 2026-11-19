import fs from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { passwordHash } from '../server/auth.js';
const path = new URL('../.dev.vars', import.meta.url);
try { await fs.access(path); console.log('Đã có .dev.vars; giữ nguyên tài khoản cục bộ hiện tại.'); }
catch {
  const password = randomBytes(18).toString('base64url'), email = 'admin@sun-saphia.local';
  await fs.writeFile(path, `ADMIN_EMAIL="${email}"\nADMIN_PASSWORD_HASH="${await passwordHash(password)}"\nSITE_ORIGIN=""\n`, { mode: 0o600 });
  await fs.writeFile(new URL('../.local-login.json',import.meta.url),JSON.stringify({email,password},null,2)+'\n',{mode:0o600});
  console.log('Đã tạo tài khoản cục bộ. Thông tin đăng nhập nằm trong .local-login.json (không được đưa vào Git).');
}
