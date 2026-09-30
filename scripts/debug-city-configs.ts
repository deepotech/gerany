import { CITY_CONFIGS, getPublishedCityConfigs } from '../src/pipeline/city-config';

console.log('CITY_CONFIGS count:', CITY_CONFIGS.length);
CITY_CONFIGS.forEach(c => console.log(' -', c.canonical, c.slug));
console.log('\ngetPublishedCityConfigs count:', getPublishedCityConfigs().length);
