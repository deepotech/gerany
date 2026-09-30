import fs from 'fs';
import path from 'path';
import { validateCityForLaunch } from '../src/pipeline/city-gates';
import { getCityRegistryEntry } from '../src/pipeline/city-registry';
import { MosqueEntity } from '../src/pipeline/types';

const args = process.argv.slice(2);
let targetCitySlug = '';
let isDryRun = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--city' && args[i + 1]) {
    targetCitySlug = args[i + 1].toLowerCase();
    i++;
  } else if (args[i] === '--dry-run') {
    isDryRun = true;
  }
}

if (!targetCitySlug) {
  console.error('Usage: tsx scripts/city-promote.ts --city <slug> [--dry-run]');
  process.exit(1);
}

const registryEntry = getCityRegistryEntry(targetCitySlug);
const canonicalName = registryEntry ? registryEntry.canonical : null;

console.log(`Starting promotion evaluation for: ${targetCitySlug}`);
if (isDryRun) {
  console.log('Mode: DRY-RUN');
}

const allEntitiesPath = path.join(process.cwd(), 'src', 'data', 'all-entities.json');
let allEntities: MosqueEntity[] = [];
try {
  allEntities = JSON.parse(fs.readFileSync(allEntitiesPath, 'utf8'));
} catch (e) {
  console.error('Failed to read all-entities.json', e);
  process.exit(1);
}

// Filter to this city (either by slug in place of canonical or actual canonical)
const cityEntities = allEntities.filter(e => {
  if (canonicalName && e.city === canonicalName) return true;
  if (e.city?.toLowerCase() === targetCitySlug) return true;
  return false;
});

console.log(`Loaded ${cityEntities.length} entities for city.`);

const report = validateCityForLaunch(targetCitySlug, cityEntities);

console.log('\n--- City Quality Report ---');
console.log(`City: ${report.city} (${report.slug})`);
console.log(`Status: ${report.status}`);
console.log(`Recommendation: ${report.recommendation}`);

if (report.blockers.length > 0) {
  console.log('\nBlockers:');
  report.blockers.forEach(b => console.log(`- [${b.gate}] ${b.reason}`));
}

if (report.warnings.length > 0) {
  console.log('\nWarnings:');
  report.warnings.forEach(w => console.log(`- [${w.gate}] ${w.reason}`));
}

// Write to reports directory
const reportDir = path.join(process.cwd(), 'reports', 'cities', targetCitySlug);
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}
const reportPath = path.join(reportDir, `launch-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\nReport written to ${reportPath}`);

if (report.status === 'BLOCKED') {
  console.log('\nCannot promote. City is BLOCKED.');
  process.exit(0);
}

if (isDryRun) {
  console.log('\nDry-run complete. What would happen: City would be promoted to PUBLISHED via city-registry-overrides.json.');
  process.exit(0);
}

if (report.status === 'READY_FOR_LAUNCH') {
  console.log('\nPROMOTING CITY...');
  const overridesPath = path.join(process.cwd(), 'src', 'data', 'city-registry-overrides.json');
  let overrides: any = {};
  if (fs.existsSync(overridesPath)) {
    overrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
  }
  overrides[targetCitySlug] = {
    status: 'PUBLISHED',
    launchedAt: new Date().toISOString()
  };
  fs.writeFileSync(overridesPath, JSON.stringify(overrides, null, 2));
  console.log('City promoted successfully!');
}
