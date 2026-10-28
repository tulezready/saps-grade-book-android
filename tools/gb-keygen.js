#!/usr/bin/env node
// SAPS Grade Book — activation code generator (Ready Digital Consultancy)
// Keep this file and gb-private.pem OFF GitHub. Needs only Node.js (Termux: pkg install nodejs).
//
//   node gb-keygen.js init                              make your signing key (once)
//   node gb-keygen.js issue GB-7K3M-Q9TX "Mr. Urai, St Paul's Mirap PS"
//   node gb-keygen.js check GB-7K3M-Q9TX <code>         confirm a code before sending it
//   node gb-keygen.js list                              show every code you have issued
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const DIR = __dirname;
const PRIV = path.join(DIR, 'gb-private.pem');
const PUB = path.join(DIR, 'gb-public.txt');
const LOG = path.join(DIR, 'licences.csv');
const b64u = b => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64u = s => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const die = m => { console.error('\n  ' + m + '\n'); process.exit(1); };
const DEV_RE = /^GB-[0-9A-Z]{4}-[0-9A-Z]{4}$/;

function rawPublic(pubKey) { return pubKey.export({ format: 'der', type: 'spki' }).subarray(-32); }
function loadPrivate() {
  if (!fs.existsSync(PRIV)) die('No signing key yet. Run:  node gb-keygen.js init');
  return crypto.createPrivateKey(fs.readFileSync(PRIV));
}
function sign(device, name) {
  const msg = Buffer.from(`SAPSGB1|${device}|${name}`, 'utf8');
  return `GB1.${b64u(Buffer.from(name, 'utf8'))}.${b64u(crypto.sign(null, msg, loadPrivate()))}`;
}
function verify(device, code) {
  const m = String(code).replace(/\s+/g, '').match(/^GB1\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]{86})$/);
  if (!m) return null;
  const name = fromB64u(m[1]).toString('utf8');
  const pub = crypto.createPublicKey(loadPrivate());
  return crypto.verify(null, Buffer.from(`SAPSGB1|${device}|${name}`, 'utf8'), pub, fromB64u(m[2])) ? name : null;
}

const [cmd, a, ...rest] = process.argv.slice(2);
if (cmd === 'init') {
  if (fs.existsSync(PRIV)) die('gb-private.pem already exists. Making a new key would stop every code you have issued from working. Delete it yourself only if you really mean to start over.');
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  fs.writeFileSync(PRIV, privateKey.export({ format: 'pem', type: 'pkcs8' }), { mode: 0o600 });
  const pk = b64u(rawPublic(publicKey));
  fs.writeFileSync(PUB, pk + '\n');
  console.log(`
  Signing key created.

  PRIVATE key: ${PRIV}
    - never share it, never upload it to GitHub
    - copy it to a flash drive and keep it somewhere safe.
      If you lose it you cannot make new codes for this app version.

  PUBLIC key (safe to share — goes into the app's index.html):

    ${pk}
`);
} else if (cmd === 'issue') {
  const device = String(a || '').trim().toUpperCase(), name = rest.join(' ').trim();
  if (!DEV_RE.test(device)) die('Usage: node gb-keygen.js issue GB-XXXX-XXXX "Teacher name, School"');
  if (!name) die('Add the teacher and school name, e.g. "Mr. Urai, St Paul\'s Mirap PS"');
  if (name.length > 80) die('Keep the name under 80 characters.');
  const code = sign(device, name);
  if (!fs.existsSync(LOG)) fs.writeFileSync(LOG, 'date,device_id,licensed_to,code\n');
  fs.appendFileSync(LOG, `${new Date().toISOString().slice(0, 10)},${device},"${name.replace(/"/g, '""')}",${code}\n`);
  console.log(`
  Activation code for ${device} — ${name}
  (send everything on the next line, it is one code)

${code}
`);
} else if (cmd === 'check') {
  const device = String(a || '').trim().toUpperCase();
  const name = verify(device, rest.join(''));
  console.log(name ? `\n  VALID for ${device} — licensed to: ${name}\n` : `\n  NOT valid for ${device}\n`);
} else if (cmd === 'list') {
  if (!fs.existsSync(LOG)) die('No codes issued yet.');
  fs.readFileSync(LOG, 'utf8').trim().split('\n').slice(1).forEach((l, i) => {
    const [d, dev] = l.split(','); const n = l.split('"')[1];
    console.log(`${String(i + 1).padStart(3)}. ${d}  ${dev}  ${n}`);
  });
} else {
  console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 8).map(l => l.replace(/^\/\/ ?/, '')).join('\n'));
}
