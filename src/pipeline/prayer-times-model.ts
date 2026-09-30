export type PrayerCalculationMethod =
  | 'DITIB_CALENDAR'
  | 'IGMG_CALENDAR'
  | 'ISLAMIC_RELIEF_GERMANY'
  | 'MWL' // Muslim World League (18° Fajr, 17° Isha)
  | 'CONGREGATION_BOARD_SCHEDULE'
  | 'MANUAL_OFFICIAL_SUBMISSION';

export interface DailyPrayerTimes {
  fajr: string;      // HH:mm
  shuruq: string;    // HH:mm (Sunrise)
  dhuhr: string;     // HH:mm
  asr: string;       // HH:mm
  maghrib: string;   // HH:mm
  isha: string;      // HH:mm
  jummah?: string;   // HH:mm (Friday congregational prayer)
}

export interface TemporalPrayerSchedule {
  scheduleId: string;
  mosqueId: string;
  effectiveDate: string; // YYYY-MM-DD
  timezone: string;      // 'Europe/Berlin'
  times: DailyPrayerTimes;
  method: PrayerCalculationMethod;
  source: string;
  sourceUrl?: string | null;
  retrievedAt: string;
  validUntil: string;
  isVerifiedByCongregation: boolean;
  notes?: string | null;
}

/**
 * Validates prayer schedule input.
 * Rejects invalid time formats or date mismatches.
 */
export function validatePrayerSchedule(schedule: TemporalPrayerSchedule): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

  const { times } = schedule;
  if (!times) {
    errors.push('Missing prayer times object');
    return { valid: false, errors };
  }

  const prayers: Array<keyof DailyPrayerTimes> = ['fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha'];
  for (const p of prayers) {
    if (!times[p] || !timeRegex.test(times[p]!)) {
      errors.push(`Invalid time format for prayer ${p}: "${times[p]}" (expected HH:mm)`);
    }
  }

  if (times.jummah && !timeRegex.test(times.jummah)) {
    errors.push(`Invalid time format for Jummah: "${times.jummah}"`);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(schedule.effectiveDate)) {
    errors.push(`Invalid effectiveDate format: "${schedule.effectiveDate}" (expected YYYY-MM-DD)`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Checks whether a temporal prayer schedule is currently effective and unexpired.
 */
export function isPrayerScheduleEffective(
  schedule: TemporalPrayerSchedule,
  currentDateStr: string = new Date().toISOString().substring(0, 10)
): boolean {
  return schedule.effectiveDate === currentDateStr && new Date(schedule.validUntil).getTime() >= Date.now();
}
