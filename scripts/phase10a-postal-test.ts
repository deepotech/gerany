import { resolveCanonicalCity } from '../src/pipeline/city-config';

const tests = [
  { postal: '65183', sourceCity: 'Wiesbaden', expected: 'Wiesbaden' },
  { postal: '65197', sourceCity: 'Wiesbaden', expected: 'Wiesbaden' },
  { postal: '65201', sourceCity: 'Wiesbaden', expected: 'Wiesbaden' },
  { postal: '55246', sourceCity: 'Wiesbaden', expected: 'Wiesbaden' },
  { postal: '55252', sourceCity: 'Wiesbaden', expected: 'Wiesbaden' },
  { postal: '55116', sourceCity: 'Mainz', expected: 'Mainz' },
  { postal: '55122', sourceCity: 'Mainz', expected: 'Mainz' },
  { postal: '55129', sourceCity: 'Mainz', expected: 'Mainz' },
  { postal: '52070', sourceCity: 'Aachen', expected: 'Aachen' },
  { postal: '23552', sourceCity: 'Lübeck', expected: 'Lübeck' },
  { postal: '66111', sourceCity: 'Saarbrücken', expected: 'Saarbrücken' },
  { postal: '79098', sourceCity: 'Freiburg im Breisgau', expected: 'Freiburg im Breisgau' },
];

let failed = 0;
for (const t of tests) {
  const res = resolveCanonicalCity(t.postal, null, t.sourceCity, true);
  const actual = res ? res.config.canonical : 'null';
  const isCross = res ? res.isCrossCity : 'n/a';
  const pass = actual === t.expected && isCross === false;
  if (!pass) failed++;
  console.log(`Postal ${t.postal} (${t.sourceCity}): actual=${actual}, crossCity=${isCross} -> ${pass ? 'PASS' : 'FAIL'}`);
}
console.log(`\nTotal tests: ${tests.length}, Failed: ${failed}`);
if (failed > 0) process.exit(1);
