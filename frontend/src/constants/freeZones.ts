export const UAE_FREE_ZONES = [
  { value: 'ADGM', label: 'Abu Dhabi Global Market (ADGM)' },
  { value: 'DIFC', label: 'Dubai International Financial Centre (DIFC)' },
  { value: 'DMCC', label: 'Dubai Multi Commodities Centre (DMCC)' },
  { value: 'JAFZA', label: 'Jebel Ali Free Zone (JAFZA)' },
  { value: 'SHARJAH_AIRPORT', label: 'Sharjah Airport International Free Zone' },
  { value: 'RAK_FREE_ZONE', label: 'RAK Free Trade Zone' },
  { value: 'FUJAIRAH_FREE_ZONE', label: 'Fujairah Free Zone' },
  { value: 'AJMAN_FREE_ZONE', label: 'Ajman Free Zone' },
  { value: 'UMM_AL_QUWAIN', label: 'Umm Al Quwain Free Trade Zone' },
  { value: 'DUBAI_INTERNET_CITY', label: 'Dubai Internet City' },
  { value: 'DUBAI_MEDIA_CITY', label: 'Dubai Media City' },
  { value: 'DUBAI_KNOWLEDGE_PARK', label: 'Dubai Knowledge Park' },
  { value: 'DUBAI_HEALTHCARE_CITY', label: 'Dubai Healthcare City' },
  { value: 'MASDAR_CITY', label: 'Masdar City Free Zone' },
  { value: 'TWOFOUR54', label: 'twofour54 Abu Dhabi' },
  { value: 'KIZAD', label: 'Khalifa Industrial Zone Abu Dhabi (KIZAD)' },
  { value: 'OTHER', label: 'Other Free Zone' },
] as const;

export type FreeZoneValue = typeof UAE_FREE_ZONES[number]['value'];