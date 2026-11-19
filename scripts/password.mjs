import { passwordHash } from '../server/auth.js';
// Read the password through stdin; never put it into command arguments or source code.
let input = '';
for await (const chunk of process.stdin) input += chunk;
const password = input.replace(/\r?\n$/, '');
if (password.length < 14 || password.length > 256) throw new Error('Mật khẩu cần từ 14 đến 256 ký tự.');
process.stdout.write(await passwordHash(password));
