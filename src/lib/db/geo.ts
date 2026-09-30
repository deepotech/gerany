export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function formatDistance(distanceKm?: number | null, locale: string = 'de'): string {
  if (distanceKm === undefined || distanceKm === null || isNaN(distanceKm)) {
    return '';
  }
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    if (locale === 'ar') return `${meters} م`;
    return `${meters} m`;
  }
  const formatted = distanceKm.toFixed(1);
  if (locale === 'de') {
    return `${formatted.replace('.', ',')} km`;
  }
  if (locale === 'ar') {
    return `${formatted} كم`;
  }
  return `${formatted} km`;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function isOpenNow(
  openingHours: Array<{ day: string; hours: string }> | null,
  date: Date = new Date()
): boolean | null {
  if (!openingHours || openingHours.length === 0) return null;

  const currentDayName = DAYS[date.getDay()];
  const dayEntry = openingHours.find(
    (h) => h.day.toLowerCase() === currentDayName.toLowerCase()
  );

  if (!dayEntry) return null;
  const hText = dayEntry.hours.toLowerCase().trim();

  if (hText.includes('closed') || hText.includes('geschlossen')) return false;
  if (hText.includes('open 24 hours') || hText.includes('24 stunden')) return true;

  // Example: "10 AM to 6 PM" or "6 AM to 8 PM"
  const match = hText.match(/(\d+)(?::(\d+))?\s*(am|pm)\s*to\s*(\d+)(?::(\d+))?\s*(am|pm)/i);
  if (!match) return null;

  let startHour = parseInt(match[1], 10);
  const startMin = match[2] ? parseInt(match[2], 10) : 0;
  const startMeridiem = match[3].toLowerCase();

  let endHour = parseInt(match[4], 10);
  const endMin = match[5] ? parseInt(match[5], 10) : 0;
  const endMeridiem = match[6].toLowerCase();

  if (startMeridiem === 'pm' && startHour < 12) startHour += 12;
  if (startMeridiem === 'am' && startHour === 12) startHour = 0;
  if (endMeridiem === 'pm' && endHour < 12) endHour += 12;
  if (endMeridiem === 'am' && endHour === 12) endHour = 0;

  const currentHour = date.getHours();
  const currentMin = date.getMinutes();
  const currentTotal = currentHour * 60 + currentMin;

  const startTotal = startHour * 60 + startMin;
  const endTotal = endHour * 60 + endMin;

  if (endTotal > startTotal) {
    return currentTotal >= startTotal && currentTotal <= endTotal;
  } else {
    // Overnight hours (e.g. 8 PM to 2 AM)
    return currentTotal >= startTotal || currentTotal <= endTotal;
  }
}
