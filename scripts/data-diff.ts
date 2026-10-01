/**
 * MoscheeAtlas — Data Diff Command
 * Command: npm run data:diff [-- <incoming_file>]
 *
 * Compares current dataset against an incoming import file or staging dataset.
 * Outputs: Added, Removed, Updated, Unchanged, Duplicate Candidates, Review Candidates.
 */

import fs from 'fs';
import path from 'path';
import { MosqueEntity } from '../src/pipeline/types';
import { detectEntityDiff } from '../src/pipeline/change-detection';
import { runPipeline } from '../src/pipeline/runner';

function main() {
  console.log('\n' + '='.repeat(65));
  console.log('   MOSCHEEATLAS — DATASET DIFF REPORT');
  console.log('='.repeat(65) + '\n');

  const rootDir = path.resolve(__dirname, '..');
  const currentMosquesPath = path.join(rootDir, 'src', 'data', 'all-entities.json');

  const incomingArg = process.argv[2];
  let incomingEntities: MosqueEntity[] = [];

  const existingEntities: MosqueEntity[] = JSON.parse(
    fs.readFileSync(currentMosquesPath, 'utf8')
  );

  if (!incomingArg) {
    console.log('No incoming file specified. Comparing existing entities against itself (idempotency check)...');
    incomingEntities = existingEntities;
  } else {
    const incomingPath = path.resolve(rootDir, incomingArg);
    if (!fs.existsSync(incomingPath)) {
      console.error(`Incoming file not found: ${incomingPath}`);
      process.exit(1);
    }
    const incomingRaw = JSON.parse(fs.readFileSync(incomingPath, 'utf8'));
    if (Array.isArray(incomingRaw) && incomingRaw.length > 0 && incomingRaw[0].canonicalName) {
      incomingEntities = incomingRaw;
    } else {
      console.log(`Running pipeline on raw input: ${incomingArg}...`);
      const city = path.basename(incomingArg).split(',')[0].trim();
      const res = runPipeline(incomingRaw, city, { dryRun: true });
      incomingEntities = res.allEntities;
    }
  }

  const diff = detectEntityDiff(existingEntities, incomingEntities);

  console.log(`Existing Entities:          ${diff.totalExisting}`);
  console.log(`Incoming Entities:          ${diff.totalIncoming}`);
  console.log(`Added:                      ${diff.addedCount}`);
  console.log(`Removed:                    ${diff.removedCount}`);
  console.log(`Updated:                    ${diff.updatedCount}`);
  console.log(`Unchanged:                  ${diff.unchangedCount}`);

  if (diff.addedCount > 0) {
    console.log(`\n--- ADDED ENTITIES (First 5) ---`);
    diff.changes
      .filter((c) => c.changeType === 'ADDED')
      .slice(0, 5)
      .forEach((c) => console.log(`  [+] [${c.city}] ${c.name} (${c.id})`));
  }

  if (diff.updatedCount > 0) {
    console.log(`\n--- UPDATED ENTITIES (First 5) ---`);
    diff.changes
      .filter((c) => c.changeType === 'UPDATED')
      .slice(0, 5)
      .forEach((c) => {
        console.log(`  [*] [${c.city}] ${c.name} (${c.id})`);
        c.fieldChanges?.forEach((fc) =>
          console.log(`      ${fc.field}: "${fc.oldValue}" -> "${fc.newValue}"`)
        );
      });
  }

  if (diff.removedCount > 0) {
    console.log(`\n--- REMOVED ENTITIES ---`);
    diff.changes
      .filter((c) => c.changeType === 'REMOVED')
      .forEach((c) => console.log(`  [-] [${c.city}] ${c.name} (${c.id})`));
  }

  console.log('\n✅ Data diff complete.\n');
}

main();
