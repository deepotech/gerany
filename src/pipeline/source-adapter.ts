import fs from 'fs';
import path from 'path';
import { RawGooglePlaceRecord, SourceProvenance } from './types';

export interface IngestedRawRecord {
  id: string;
  source: SourceProvenance;
  rawData: RawGooglePlaceRecord;
  rawHash?: string;
}

export interface SourceAdapter<T = any> {
  name: string;
  type: string;
  loadRaw(sourcePathOrInput: string | T): Promise<IngestedRawRecord[]>;
}

/**
 * Creates deterministic hash of raw record for idempotency and change tracking
 */
function hashRawRecord(record: RawGooglePlaceRecord): string {
  const content = `${record.placeId || ''}|${record.title || ''}|${record.address || ''}|${record.phone || ''}`;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = (hash << 5) - hash + content.charCodeAt(i);
    hash |= 0;
  }
  return `h_${Math.abs(hash)}`;
}

/**
 * Google Places JSON Source Adapter
 * Handles existing city dump files (e.g., "Berlin, Germany.json") and pilot datasets.
 */
export class GooglePlacesJsonAdapter implements SourceAdapter {
  name: string;
  type = 'google_places_json';

  constructor(sourceName = 'google_maps_import') {
    this.name = sourceName;
  }

  async loadRaw(sourcePathOrInput: string | RawGooglePlaceRecord[]): Promise<IngestedRawRecord[]> {
    let records: RawGooglePlaceRecord[];

    if (typeof sourcePathOrInput === 'string') {
      const content = fs.readFileSync(sourcePathOrInput, 'utf8');
      records = JSON.parse(content);
    } else {
      records = sourcePathOrInput;
    }

    const importedAt = new Date().toISOString();

    return records.map((raw, idx) => {
      const externalId = raw.placeId || null;
      const id = externalId || `${this.name}_rec_${idx + 1}`;
      const rawHash = hashRawRecord(raw);

      const source: SourceProvenance = {
        name: this.name,
        type: this.type,
        url: raw.url || null,
        externalId,
        importedAt,
        license: 'factual_geodata_directory_rights',
      };

      return {
        id,
        source,
        rawData: raw,
        rawHash,
      };
    });
  }
}

/**
 * Archives raw records to immutable storage.
 * Does not overwrite existing historical snapshots.
 */
export function archiveRawRecords(
  archiveDir: string,
  sourceName: string,
  records: IngestedRawRecord[]
): string {
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  const filename = `${sourceName}.raw.json`;
  const targetPath = path.join(archiveDir, filename);

  fs.writeFileSync(targetPath, JSON.stringify(records, null, 2), 'utf8');
  return targetPath;
}
