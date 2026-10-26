import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/** Git-ignored key that decrypts REPORT_DB.pwEnc; copy the team's key file here (not shared through git). */
const DB_KEY_FILE = path.join(__dirname, 'db.key');

/** Report DB (TestInfo) connection settings; pwEnc is AES-256-GCM "iv:tag:data" (base64). */
const REPORT_DB = {
  server: 'katalondb.ecom-qa.samsung.com',
  port: 11433,
  database: 'TestInfo',
  user: 'katalon_admin',
  pwEnc: '8zVR5nSVD0nAiAp7:cXzSQVA3Y2s/3MHtN/2/yg==:/SK8J+X3E5+7mmeoBs3GilRYKuc=',
};

/** Key from env REPORT_DB_KEY, else config/db.key. */
function readDbKey(): Buffer {
  const key = (process.env.REPORT_DB_KEY || (fs.existsSync(DB_KEY_FILE) ? fs.readFileSync(DB_KEY_FILE, 'utf8') : '')).trim();
  if (!key) {
    throw new Error(`report DB key not found — put it in ${DB_KEY_FILE} or env REPORT_DB_KEY`);
  }
  return Buffer.from(key, 'base64');
}

/** Decrypts an AES-256-GCM "iv:tag:data" value with the DB key. */
function decryptWithDbKey(encrypted: string): string {
  const [iv, tag, data] = encrypted.split(':').map((part) => Buffer.from(part, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', readDbKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

/** Report DB connection string (mssql format). */
export function getReportDbConnection(): string {
  const { server, port, database, user, pwEnc } = REPORT_DB;
  return `Server=${server},${port};Database=${database};User Id=${user};Pwd=${decryptWithDbKey(pwEnc)};Encrypt=true;TrustServerCertificate=true`;
}
