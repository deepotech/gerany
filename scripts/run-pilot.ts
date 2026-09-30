import fs from 'fs';
import path from 'path';
import { runPipeline } from '../src/pipeline/runner';

function main() {
  const rootDir = path.resolve(__dirname, '..');
  const pilotPath = path.join(rootDir, 'tests', 'fixtures', 'pilot_hannover.json');
  const pilotRaw = JSON.parse(fs.readFileSync(pilotPath, 'utf8'));

  console.log('\n' + '='.repeat(65));
  console.log('   MOSCHEEATLAS.DE — CONTROLLED PILOT EXECUTION (HANNOVER)');
  console.log('='.repeat(65) + '\n');

  const res = runPipeline(pilotRaw, 'Hannover', { dryRun: true });

  console.log('\n--- PILOT RESULTS BREAKDOWN ---');
  console.log(`Source File:                tests/fixtures/pilot_hannover.json`);
  console.log(`Raw Ingested Records:       ${pilotRaw.length}`);
  console.log(`Normalized Entities:        ${res.allEntities.length}`);
  console.log(`Published Mosques:          ${res.publishedEntities.length}`);
  console.log(`Reviewed Queue:             ${res.allEntities.filter((e) => e.dataStatus === 'REVIEWED').length}`);
  console.log(`Rejected Records:           ${res.allEntities.filter((e) => e.dataStatus === 'REJECTED').length}`);
  console.log(`Duplicate Candidates:       ${res.report.duplicateCandidates.length}`);
  console.log(`Merged Duplicates:          ${res.report.duplicateCandidates.filter((c) => c.actionTaken === 'MERGED').length}`);
  console.log(`Co-Located Flagged:         ${res.report.duplicateCandidates.filter((c) => c.actionTaken === 'FLAGGED_CO_LOCATED').length}`);

  console.log('\n--- 1. Published Mosques in Pilot ---');
  res.publishedEntities.forEach((p) => {
    console.log(`  [PUB] "${p.canonicalName}" (City: ${p.city}, State: ${p.state})`);
    console.log(`        Slug: ${p.slug} | Org: ${p.organization || 'None'} | Verif: ${p.verificationStatus}`);
  });

  console.log('\n--- 2. Reviewed Entities in Pilot ---');
  res.allEntities
    .filter((e) => e.dataStatus === 'REVIEWED')
    .forEach((r) => {
      console.log(`  [REV] "${r.canonicalName}"`);
      console.log(`        Reason: ${r.reviewReason || 'In review'}`);
    });

  console.log('\n--- 3. Rejected Entities in Pilot ---');
  res.allEntities
    .filter((e) => e.dataStatus === 'REJECTED')
    .forEach((x) => {
      console.log(`  [REJ] "${x.canonicalName}"`);
      console.log(`        Reason: ${x.rejectionReason || 'Rejected'}`);
    });

  console.log('\n--- 4. Duplicate Evidence in Pilot ---');
  res.report.duplicateCandidates.forEach((d) => {
    console.log(`  [DUP] "${d.primaryName}" <-> "${d.duplicateName}"`);
    console.log(`        Action: ${d.actionTaken} | Reason: ${d.reason}`);
    if (d.evidence) console.log(`        Evidence: ${d.evidence.explanation}`);
  });

  console.log('\n✅ Controlled pilot execution complete.\n');
}

main();
