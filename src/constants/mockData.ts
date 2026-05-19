export interface Property {
  id: string;
  title: string;
  price: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  type: string;
  image: string;
  images: string[];
  description: string;
  status: 'Live' | 'Draft' | 'Let Agreed' | 'Paused' | 'Archived';
  tags: string[];
  lat: number;
  lng: number;
  isShared?: boolean;
  isStudent?: boolean;
  isRetirement?: boolean;
  landlordId?: string;
  councilTaxBand?: string;
  epcEE?: string;
  epcEI?: string;
  hasParking?: boolean;
  hasGarden?: boolean;
  isBillsIncluded?: boolean;
  billsDescription?: string;
  floorplan?: string | null;
  epcCertificate?: string | null;
  monthlyRent?: string;
  securityDeposit?: string;
  holdingDeposit?: string;
  contactNumber?: string;
}

export const UK_CITIES = [
  'London', 'Manchester', 'Leeds', 'Birmingham', 'Bristol', 
  'Liverpool', 'Sheffield', 'Glasgow', 'Edinburgh', 'Cardiff',
  'Richmond', 'Chelsea', 'Shoreditch', 'Canary Wharf'
];

export const mockProperties: Property[] = [];
