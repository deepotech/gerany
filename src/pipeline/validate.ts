import { z } from 'zod';
import { MosqueEntity } from './types';

export const MosqueEntitySchema = z.object({
  id: z.string().min(1),
  canonicalName: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  address: z.string().min(5),
  street: z.string().nullable(),
  postalCode: z.string().regex(/^\d{5}$/).refine(
    (v) => parseInt(v, 10) >= 1000 && parseInt(v, 10) <= 99999,
    { message: 'Must be a valid German postal code (5 digits, 01000–99999)' }
  ),
  city: z.string().min(2),
  district: z.string().nullable(),
  state: z.string().min(2),
  country: z.string().min(2),
  latitude: z.number().min(47.0).max(55.5), // Strict Germany bounding box
  longitude: z.number().min(5.5).max(15.5),
  phone: z.string().nullable(),
  website: z.string().url().nullable(),
  mapsUrl: z.string().nullable(),
  placeId: z.string().nullable(),
  category: z.enum([
    'MOSQUE',
    'ISLAMIC_CENTER',
    'RELIGIOUS_ORGANIZATION',
    'PRAYER_ROOM',
    'COMMUNITY_CENTER',
    'OTHER',
  ]),
  organization: z.string().nullable(),
  description: z.string().nullable(),
  openingHours: z
    .array(
      z.object({
        day: z.string(),
        hours: z.string(),
      })
    )
    .nullable(),
  rating: z.number().min(1).max(5).nullable(),
  reviewCount: z.number().min(0),
  imageUrl: z.string().nullable(),
  dataStatus: z.enum(['RAW', 'NORMALIZED', 'REVIEWED', 'PUBLISHED', 'REJECTED']),
  verificationStatus: z.enum(['UNVERIFIED', 'COMMUNITY_VERIFIED', 'OFFICIALLY_VERIFIED']),
  source: z.string().min(1),
  lastVerified: z.string().nullable(),
  facilities: z.object({
    parking: z.boolean().nullable(),
    womenArea: z.boolean().nullable(),
    wheelchairAccessible: z.boolean().nullable(),
    restroom: z.boolean().nullable(),
    wudu: z.boolean().nullable(),
    other: z.string().nullable().optional(),
  }),
  translations: z.object({
    de: z.object({
      locale: z.literal('de'),
      name: z.string().min(2),
      description: z.string(),
      seoTitle: z.string().min(5),
      seoDescription: z.string().min(10),
    }),
    en: z.object({
      locale: z.literal('en'),
      name: z.string().min(2),
      description: z.string(),
      seoTitle: z.string().min(5),
      seoDescription: z.string().min(10),
    }),
    ar: z.object({
      locale: z.literal('ar'),
      name: z.string().min(2),
      description: z.string(),
      seoTitle: z.string().min(5),
      seoDescription: z.string().min(10),
    }),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
  sourceProvenance: z
    .object({
      name: z.string(),
      type: z.string(),
      url: z.string().nullable().optional(),
      externalId: z.string().nullable().optional(),
      importedAt: z.string(),
      license: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  rawValues: z
    .object({
      name: z.string().nullable().optional(),
      address: z.string().nullable().optional(),
      phone: z.string().nullable().optional(),
      website: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  rejectionReason: z.string().nullable().optional(),
  reviewReason: z.string().nullable().optional(),
});

export function validateMosqueEntity(entity: MosqueEntity): { success: boolean; errors?: string[] } {
  const result = MosqueEntitySchema.safeParse(entity);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }
  return { success: true };
}
