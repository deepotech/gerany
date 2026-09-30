import { RawGooglePlaceRecord, SourceProvenance } from './types';
import { SourceAdapter, IngestedRawRecord } from './source-adapter';

export interface OsmRawNodeOrWay {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

/**
 * OpenStreetMap (OSM) Source Adapter
 *
 * Ingests OSM Overpass API or extract payloads (e.g. amenity=place_of_worship, religion=muslim).
 *
 * SAFETY RULES:
 * - ODbL attribution is explicitly recorded in SourceProvenance.
 * - Records enter as RAW and must pass the full 9-stage pipeline.
 * - Existing production records are NEVER automatically overwritten.
 * - In case of a conflict, a conflict review event is generated.
 */
export class OsmSourceAdapter implements SourceAdapter {
  name: string;
  type = 'osm';

  constructor(sourceName = 'osm_germany') {
    this.name = sourceName;
  }

  async loadRaw(elementsOrJson: OsmRawNodeOrWay[] | string): Promise<IngestedRawRecord[]> {
    let elements: OsmRawNodeOrWay[];
    if (typeof elementsOrJson === 'string') {
      const parsed = JSON.parse(elementsOrJson);
      elements = Array.isArray(parsed) ? parsed : parsed.elements || [];
    } else {
      elements = elementsOrJson;
    }

    const importedAt = new Date().toISOString();

    return elements.map((elem) => {
      const tags = elem.tags || {};
      const lat = elem.lat ?? elem.center?.lat;
      const lon = elem.lon ?? elem.center?.lon;

      // Extract address components from OSM tags
      const street = tags['addr:street']
        ? `${tags['addr:street']} ${tags['addr:housenumber'] || ''}`.trim()
        : null;
      const postalCode = tags['addr:postcode'] || null;
      const city = tags['addr:city'] || null;

      const formattedAddress = [street, postalCode, city, 'Germany']
        .filter(Boolean)
        .join(', ');

      const rawRecord: RawGooglePlaceRecord = {
        title: tags.name || tags['name:de'] || tags['name:en'] || 'Moschee',
        address: formattedAddress,
        street,
        postalCode,
        city,
        state: tags['addr:state'] || null,
        location: lat && lon ? { lat, lng: lon } : undefined,
        phone: tags.phone || tags['contact:phone'] || null,
        website: tags.website || tags['contact:website'] || null,
        placeId: `osm_${elem.type}_${elem.id}`,
        categoryName: 'Mosque',
        openingHours: tags.opening_hours
          ? [{ day: 'Mo-Su', hours: tags.opening_hours }]
          : undefined,
        description: tags.description || null,
      };

      const provenance: SourceProvenance = {
        name: this.name,
        type: this.type,
        url: `https://www.openstreetmap.org/${elem.type}/${elem.id}`,
        externalId: `${elem.type}/${elem.id}`,
        importedAt,
        license: 'Open Database License (ODbL) 1.0',
      };

      return {
        id: `osm_${elem.type}_${elem.id}`,
        source: provenance,
        rawData: rawRecord,
        rawHash: `osm_${elem.type}_${elem.id}`,
      };
    });
  }
}
