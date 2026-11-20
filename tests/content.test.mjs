import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, validateContent, imageUrl, videoId, serialize } from '../server/content.js';
import { passwordHash, equal } from '../server/auth.js';
test('Content accepts the existing site and rejects unsafe image/video sources', () => {
  assert.deepEqual(validateContent(defaults), defaults);
  for (const value of ['javascript:alert(1)','data:image/svg+xml,<svg onload=alert(1)>','//evil.test/image.png','assets/../admin/index.html']) assert.equal(imageUrl(value), false);
  assert.throws(() => validateContent({ ...defaults, 'film.youtube': 'https://youtube.com.evil.test/watch?v=dU6ceuNIdXI' }));
  assert.throws(() => validateContent({ ...defaults, unauthorized: 'value' }));
  assert.equal(videoId('https://youtu.be/dU6ceuNIdXI'), 'dU6ceuNIdXI');
  assert.equal(videoId('https://www.youtube.com/watch?v=dU6ceuNIdXI'), 'dU6ceuNIdXI');
  assert.throws(() => validateContent({ ...defaults, 'advisor.phone': 'javascript:alert(1)' }));
  assert.equal(validateContent({ ...defaults, 'advisor.phone': '0818188885' })['advisor.phone'], '0818188885');
});
test('Embedded content cannot break out of its JSON script', () => {
  const attack = '</script><script>alert("x")</script>';
  const output = serialize({ value: attack });
  assert(!output.includes('<')); assert.equal(JSON.parse(output).value, attack);
});
test('Password hashes are salted and verify deterministically with the same salt', async () => {
  const a = await passwordHash('integration-test-password');
  const b = await passwordHash('integration-test-password');
  assert.notEqual(a,b);
  assert(equal(a,await passwordHash('integration-test-password',a.split('$')[2])));
  assert(!equal(a,await passwordHash('incorrect-password',a.split('$')[2])));
});
