export type Locale = 'de' | 'en' | 'ar';

export interface Dictionary {
  common: {
    appName: string;
    tagline: string;
    search: string;
    searchPlaceholder: string;
    nearMe: string;
    loadingLocation: string;
    locationDenied: string;
    kmAway: string;
    openNow: string;
    closed: string;
    directions: string;
    viewDetails: string;
    allDistricts: string;
    filterByDistrict: string;
    filters: string;
    facilities: string;
    parking: string;
    womenArea: string;
    wheelchair: string;
    restroom: string;
    wudu: string;
    verified: string;
    communityVerified: string;
    unverified: string;
    noResults: string;
    noResultsHint: string;
    popularCities: string;
    adminPortal: string;
    noInfo: string;
    resetFilters: string;
    reviews: string;
  };
  home: {
    heroTitle: string;
    heroSubtitle: string;
    heroCta: string;
    popularCitiesTitle: string;
    popularCitiesSubtitle: string;
    pilotBadge: string;
    statsMosques: string;
    statsDistricts: string;
    statsVerified: string;
  };
  detail: {
    address: string;
    phone: string;
    website: string;
    openingHours: string;
    hoursNotAvailable: string;
    prayerTimesTitle: string;
    prayerTimesNotice: string;
    nearbyTitle: string;
    districtNavigation: string;
    share: string;
  };
  seo: {
    homeTitle: string;
    homeDesc: string;
    listTitle: string;
    listDesc: string;
  };
}

export const dictionaries: Record<Locale, Dictionary> = {
  de: {
    common: {
      appName: 'Germany Mosque Finder',
      tagline: 'Dein lokaler Moscheen-Finder in Deutschland',
      search: 'Suchen',
      searchPlaceholder: 'Stadt, PLZ oder Moschee...',
      nearMe: 'Moscheen in meiner Nähe',
      loadingLocation: 'Standort wird ermittelt...',
      locationDenied: 'Standortzugriff verweigert',
      kmAway: 'km entfernt',
      openNow: 'Jetzt geöffnet',
      closed: 'Geschlossen',
      directions: 'Route berechnen',
      viewDetails: 'Details anzeigen',
      allDistricts: 'Alle Stadtteile',
      filterByDistrict: 'Stadtteil filtern',
      filters: 'Filter',
      facilities: 'Ausstattung & Service',
      parking: 'Parkplatz',
      womenArea: 'Frauenbereich',
      wheelchair: 'Barrierefrei',
      restroom: 'WC',
      wudu: 'Wudu / Gebetswaschung',
      verified: 'Offiziell verifiziert',
      communityVerified: 'Gemeinde-bestätigt',
      unverified: 'Erfasst',
      noResults: 'Keine Moscheen gefunden',
      noResultsHint: 'Versuche andere Suchbegriffe oder setze die Filter zurück.',
      popularCities: 'Beliebte Städte',
      adminPortal: 'Daten-Verwaltung',
      noInfo: 'Keine Angabe',
      resetFilters: 'Filter zurücksetzen',
      reviews: 'Bewertungen',
    },
    home: {
      heroTitle: 'Finde eine Moschee in deiner Nähe',
      heroSubtitle: 'Entdecke erfasste Moscheen, Gebetsräume, Öffnungszeiten und Ausstattung in ganz Deutschland.',
      heroCta: 'Moscheen in meiner Nähe',
      popularCitiesTitle: 'Moscheen nach Städten erkunden',
      popularCitiesSubtitle: 'Wähle deine Stadt für lokale Gebetsstätten und Gemeindeinformationen.',
      pilotBadge: 'Deutschlandweit live',
      statsMosques: 'Erfasste Moscheen',
      statsDistricts: 'Städte & Stadtteile',
      statsVerified: 'Geprüfte Datenqualität',
    },
    detail: {
      address: 'Adresse & Standort',
      phone: 'Telefon',
      website: 'Offizielle Website',
      openingHours: 'Öffnungszeiten',
      hoursNotAvailable: 'Genaue Öffnungszeiten auf Anfrage bei der Gemeinde',
      prayerTimesTitle: 'Gebetszeiten',
      prayerTimesNotice: 'Gebetszeiten werden nur angezeigt, wenn sie direkt von der Gemeinde verifiziert wurden. Bitte vor Ort oder telefonisch erfragen.',
      nearbyTitle: 'Weitere Moscheen in der Nähe',
      districtNavigation: 'Moscheen in diesem Stadtteil',
      share: 'Teilen',
    },
    seo: {
      homeTitle: 'MoscheeAtlas – Finde eine Moschee in deiner Nähe',
      homeDesc: 'Finde erfasste Moscheen und Gebetsräume in Deutschland. Suche nach Stadt, PLZ oder aktuellem Standort mit Gebetszeiten und Ausstattung.',
      listTitle: 'Moscheen in Deutschland – Alle Gebetsräume & Adressen',
      listDesc: 'Übersicht erfasster Moscheen in ganz Deutschland. Finde Gebetsräume nach Stadt mit Karte, Adresse und Ausstattung.',
    },
  },
  en: {
    common: {
      appName: 'Germany Mosque Finder',
      tagline: 'Your trusted local mosque directory in Germany',
      search: 'Search',
      searchPlaceholder: 'City, postal code or mosque...',
      nearMe: 'Mosques near me',
      loadingLocation: 'Detecting location...',
      locationDenied: 'Location access denied',
      kmAway: 'km away',
      openNow: 'Open now',
      closed: 'Closed',
      directions: 'Get directions',
      viewDetails: 'View details',
      allDistricts: 'All districts',
      filterByDistrict: 'Filter by district',
      filters: 'Filters',
      facilities: 'Facilities & Amenities',
      parking: 'Parking',
      womenArea: "Women's Area",
      wheelchair: 'Wheelchair Accessible',
      restroom: 'Restroom',
      wudu: 'Wudu Facilities',
      verified: 'Officially Verified',
      communityVerified: 'Community Verified',
      unverified: 'Listed',
      noResults: 'No mosques found',
      noResultsHint: 'Try adjusting your search criteria or resetting filters.',
      popularCities: 'Popular Cities',
      adminPortal: 'Admin Portal',
      noInfo: 'Not available',
      resetFilters: 'Reset filters',
      reviews: 'reviews',
    },
    home: {
      heroTitle: 'Find a Mosque Near You in Germany',
      heroSubtitle: 'Discover listed mosques, prayer spaces, opening hours, and facilities across Germany.',
      heroCta: 'Mosques Near Me',
      popularCitiesTitle: 'Explore Mosques by City',
      popularCitiesSubtitle: 'Select a city to discover local prayer centers and community information.',
      pilotBadge: 'Germany-Wide Directory',
      statsMosques: 'Listed Mosques',
      statsDistricts: 'Cities & Districts',
      statsVerified: 'Community Listings',
    },
    detail: {
      address: 'Address & Location',
      phone: 'Phone',
      website: 'Official Website',
      openingHours: 'Opening Hours',
      hoursNotAvailable: 'Opening hours available upon inquiry with the community',
      prayerTimesTitle: 'Prayer Times',
      prayerTimesNotice: 'Congregational prayer times are displayed only when verified directly by the mosque administration.',
      nearbyTitle: 'Nearby Mosques in the Area',
      districtNavigation: 'Mosques in this District',
      share: 'Share',
    },
    seo: {
      homeTitle: 'MoscheeAtlas – Find a Mosque Near You in Germany',
      homeDesc: 'Find listed mosques and Islamic prayer spaces across Germany. Search by city, postal code or location with map directions and facilities.',
      listTitle: 'Mosques in Germany – Directory of Islamic Prayer Spaces',
      listDesc: 'Directory of listed mosques across Germany. Search by city and district with interactive map and facility filters.',
    },
  },
  ar: {
    common: {
      appName: 'دليل مساجد ألمانيا',
      tagline: 'دليلك الموثوق للمساجد والمصليات في ألمانيا',
      search: 'بحث',
      searchPlaceholder: 'المدينة، الرمز البريدي أو اسم المسجد...',
      nearMe: 'مساجد قريبة مني',
      loadingLocation: 'جاري تحديد موقعك...',
      locationDenied: 'تم رفض إذن تحديد الموقع',
      kmAway: 'كم',
      openNow: 'مفتوح الآن',
      closed: 'مغلق',
      directions: 'اتجاهات الطريق',
      viewDetails: 'عرض التفاصيل',
      allDistricts: 'جميع الأحياء',
      filterByDistrict: 'تصفية حسب الحي',
      filters: 'خيارات التصفية',
      facilities: 'المرافق والخدمات',
      parking: 'موقف سيارات',
      womenArea: 'مصلى للنساء',
      wheelchair: 'ميسر للكراسي المتحركة',
      restroom: 'دورات مياه',
      wudu: 'مكان وضوء',
      verified: 'معتمد رسمياً',
      communityVerified: 'معتمد مجتمعياً',
      unverified: 'مُدرج',
      noResults: 'لم يتم العثور على مساجد',
      noResultsHint: 'جرب استخدام كلمات بحث مختلفة أو إعادة ضبط الفلاتر.',
      popularCities: 'المدن الرئيسية',
      adminPortal: 'لوحة الإدارة',
      noInfo: 'غير محدد',
      resetFilters: 'إعادة ضبط الفلاتر',
      reviews: 'تقييمات',
    },
    home: {
      heroTitle: 'ابحث عن مسجد في ألمانيا بالقرب منك',
      heroSubtitle: 'اكتشف المساجد المُدرجة، المصليات، أوقات العمل والمرافق في جميع أنحاء ألمانيا.',
      heroCta: 'مساجد قريبة مني',
      popularCitiesTitle: 'تصفح المساجد حسب المدينة',
      popularCitiesSubtitle: 'اختر المدينة للتعرف على المساجد والمراكز الإسلامية المحلية.',
      pilotBadge: 'دليل شامل لألمانيا',
      statsMosques: 'مسجد مُدرج',
      statsDistricts: 'مدن وأحياء',
      statsVerified: 'بيانات مجتمعية',
    },
    detail: {
      address: 'العنوان والموقع',
      phone: 'رقم الهاتف',
      website: 'الموقع الرسمي',
      openingHours: 'أوقات الفتح',
      hoursNotAvailable: 'يرجى مراجعة إدارة المسجد للتأكد من أوقات الفتح الدقيقة',
      prayerTimesTitle: 'أوقات الصلاة',
      prayerTimesNotice: 'تُعرض أوقات الصلاة فقط عندما تكون معتمدة ومحدثة من إدارة المسجد مباشرة.',
      nearbyTitle: 'مساجد أخرى قريبة',
      districtNavigation: 'مساجد في هذا الحي',
      share: 'مشاركة',
    },
    seo: {
      homeTitle: 'MoscheeAtlas – ابحث عن أقرب مسجد إليك في ألمانيا',
      homeDesc: 'ابحث عن المساجد والمراكز الإسلامية المُدرجة في جميع أنحاء ألمانيا عبر المدينة أو الرمز البريدي أو الخريطة التفاعلية.',
      listTitle: 'مساجد ألمانيا – دليل المصليات والمراكز الإسلامية',
      listDesc: 'دليل شامل لمساجد ألمانيا مع الخريطة والمرافق وأماكن وضوء ومصلى للنساء.',
    },
  },
};

export function getDictionary(locale: string): Dictionary {
  if (locale === 'ar') return dictionaries.ar;
  if (locale === 'en') return dictionaries.en;
  return dictionaries.de;
}

export function isValidLocale(locale: string): locale is Locale {
  return ['de', 'en', 'ar'].includes(locale);
}
