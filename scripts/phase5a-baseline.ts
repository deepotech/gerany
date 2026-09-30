import fs from 'fs';
import path from 'path';

const allEntitiesPath = path.join(process.cwd(), 'src', 'data', 'all-entities.json');
const mosquesPath = path.join(process.cwd(), 'src', 'data', 'mosques.json');

const allEntities = JSON.parse(fs.readFileSync(allEntitiesPath, 'utf8'));
const publishedEntities = JSON.parse(fs.readFileSync(mosquesPath, 'utf8'));

const baseline = {
  totalEntities: allEntities.length,
  publishedEntities: publishedEntities.length,
  timestamp: new Date().toISOString()
};

fs.writeFileSync(path.join(process.cwd(), 'PHASE5A_BASELINE.json'), JSON.stringify(baseline, null, 2));

console.log('--- Phase 5A Baseline Summary ---');
console.log(`Total Entities (all-entities.json): ${baseline.totalEntities}`);
console.log(`Published Entities (mosques.json): ${baseline.publishedEntities}`);
console.log(`Baseline data written to PHASE5A_BASELINE.json`);
