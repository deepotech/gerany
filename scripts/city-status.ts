import fs from 'fs';
import path from 'path';
import { getAllCityRegistryEntries } from '../src/pipeline/city-registry';

const mosquesPath = path.join(process.cwd(), 'src', 'data', 'mosques.json');
let mosques = [];
try {
  mosques = JSON.parse(fs.readFileSync(mosquesPath, 'utf8'));
} catch (e) {
  console.warn('Could not read mosques.json');
}

const entries = getAllCityRegistryEntries();

console.log(`${'City'.padEnd(20)} | ${'State'.padEnd(20)} | ${'Status'.padEnd(15)} | ${'Records'.padEnd(10)} | ${'Indexable'}`);
console.log('-'.repeat(85));

for (const entry of entries) {
  const count = mosques.filter((m: any) => m.city === entry.canonical).length;
  console.log(
    `${entry.canonical.padEnd(20)} | ` +
    `${entry.state.padEnd(20)} | ` +
    `${entry.status.padEnd(15)} | ` +
    `${String(count).padEnd(10)} | ` +
    `${entry.seoIndexable ? 'Yes' : 'No'}`
  );
}
