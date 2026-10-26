import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');
const rawRecords = JSON.parse(fs.readFileSync(path.join(ROOT, 'muenster,germany.json'), 'utf8'));

const r1 = rawRecords.find((r: any) => r.placeId === 'ChIJd58rTou7uUcRllSptiif6u0');
console.log('--- Palace Square Prayer Room Mosque Details ---');
console.log(JSON.stringify(r1, null, 2));
