import fs from 'fs';
const m = JSON.parse(fs.readFileSync('src/data/mosques.json', 'utf8')).filter((x: any) => x.city === 'Freiburg im Breisgau');
console.log(JSON.stringify(m.map((x: any) => ({ name: x.canonicalName, slug: x.slug, placeId: x.placeId })), null, 2));
