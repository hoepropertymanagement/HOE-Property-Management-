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
  landlordName?: string;
  createdAt?: any;
  updatedAt?: any;
}

export const UK_CITIES = [
  'London', 'Manchester', 'Leeds', 'Birmingham', 'Bristol', 
  'Liverpool', 'Sheffield', 'Glasgow', 'Edinburgh', 'Cardiff',
  'Richmond', 'Chelsea', 'Shoreditch', 'Canary Wharf'
];

export const mockProperties: Property[] = [
  {
    id: "prop_1",
    title: "Stunning 2 Bed Premium Apartment in Hatfield",
    price: "£1,350",
    monthlyRent: "£1,350",
    location: "Hatfield, Welwyn Hatfield, Hertfordshire, AL10 9AB",
    bedrooms: 2,
    bathrooms: 2,
    type: "Apartment",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1000",
    images: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000"
    ],
    description: "A beautifully finished two-bedroom apartment positioned in the heart of Hatfield, Welwyn Hatfield, Hertfordshire. Ideal for professionals seeking convenient transport access to Central London.",
    status: "Live",
    tags: ["Apartment", "Featured", "Modern"],
    lat: 51.7618,
    lng: -0.2222,
    isShared: false,
    isStudent: false,
    isRetirement: false,
    councilTaxBand: "B",
    epcEE: "B",
    epcEI: "B",
    hasParking: true,
    hasGarden: false,
    isBillsIncluded: false,
    securityDeposit: "£1,557",
    holdingDeposit: "£311",
    contactNumber: "07700 900077"
  },
  {
    id: "prop_2",
    title: "Eco-Friendly 4 Bed Student Shared House in Balham",
    price: "£3,800",
    monthlyRent: "£3,800",
    location: "Balham, Wandsworth, London, SW12 9AL",
    bedrooms: 4,
    bathrooms: 3,
    type: "House",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1000",
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=1000"
    ],
    description: "A gorgeous 4-bedroom house specifically designed for premium student shared accommodation in Wandsworth, South London. Centered just minutes from Balham station.",
    status: "Live",
    tags: ["Student Friendly", "Shared Accommodation", "Bills Included"],
    lat: 51.4428,
    lng: -0.1524,
    isShared: true,
    isStudent: true,
    isRetirement: false,
    councilTaxBand: "D",
    epcEE: "C",
    epcEI: "C",
    hasParking: true,
    hasGarden: true,
    isBillsIncluded: true,
    billsDescription: "All utility bills (gas, electricity, water, council tax exemption support) and high-speed Wi-Fi broadband are fully included in the monthly rent.",
    securityDeposit: "£4,380",
    holdingDeposit: "£876",
    contactNumber: "07700 900088"
  },
  {
    id: "prop_3",
    title: "Elegant 3 Bed Semi-Detached Family House in St Albans",
    price: "£2,500",
    monthlyRent: "£2,500",
    location: "St Albans, Hertfordshire, AL1 3HG",
    bedrooms: 3,
    bathrooms: 2,
    type: "Detached",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000",
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&q=80&w=1000"
    ],
    description: "Premium property located in an excellent school catchment area within historic St Albans, Hertfordshire. Features a charming mature garden and secure garage parking.",
    status: "Live",
    tags: ["Family Friendly", "Garden", "Parking"],
    lat: 51.7523,
    lng: -0.3392,
    isShared: false,
    isStudent: false,
    isRetirement: false,
    councilTaxBand: "E",
    epcEE: "C",
    epcEI: "D",
    hasParking: true,
    hasGarden: true,
    isBillsIncluded: false,
    securityDeposit: "£2,884",
    holdingDeposit: "£576",
    contactNumber: "07700 900099"
  },
  {
    id: "prop_4",
    title: "Modern 1 Bed City Flat in Central Watford",
    price: "£1,150",
    monthlyRent: "£1,150",
    location: "Watford, Hertfordshire, WD17 2EN",
    bedrooms: 1,
    bathrooms: 1,
    type: "Flat",
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&q=80&w=1000",
    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1000"
    ],
    description: "A highly convenient and stylish modern apartment in Central Watford, Hertfordshire. Walkable to major rail links and prime shopping hubs.",
    status: "Live",
    tags: ["Single Professional", "Excellent Transport"],
    lat: 51.6565,
    lng: -0.3903,
    isShared: false,
    isStudent: false,
    isRetirement: false,
    councilTaxBand: "A",
    epcEE: "B",
    epcEI: "B",
    hasParking: true,
    hasGarden: false,
    isBillsIncluded: false,
    securityDeposit: "£1,326",
    holdingDeposit: "£265",
    contactNumber: "07700 900110"
  },
  {
    id: "prop_5",
    title: "Luxury 2 Bed Executive Apartment in Wandsworth",
    price: "£2,400",
    monthlyRent: "£2,400",
    location: "Wandsworth Town, London, SW18 1EP",
    bedrooms: 2,
    bathrooms: 2,
    type: "Apartment",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1000",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=1000"
    ],
    description: "Elegant riverside apartment located in highly sought-after Wandsworth Town, London. Showcases breathtaking panoramic views, modern fixtures, and pristine finishes.",
    status: "Live",
    tags: ["Luxury", "Riverside View", "Parking Slot"],
    lat: 51.4568,
    lng: -0.1911,
    isShared: false,
    isStudent: false,
    isRetirement: false,
    councilTaxBand: "C",
    epcEE: "B",
    epcEI: "C",
    hasParking: true,
    hasGarden: false,
    isBillsIncluded: false,
    securityDeposit: "£2,769",
    holdingDeposit: "£553",
    contactNumber: "07700 900122"
  },
  {
    id: "prop_6",
    title: "Premium 3 Bed Period Terrace House in Brixton",
    price: "£2,900",
    monthlyRent: "£2,900",
    location: "Brixton, Lambeth, London, SW2 1QZ",
    bedrooms: 3,
    bathrooms: 2,
    type: "Terrace",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1000",
    images: [
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1527030280862-64139fbe04ca?auto=format&fit=crop&q=80&w=1000",
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&q=80&w=1000"
    ],
    description: "Fabulous Victorian terrace home in popular Brixton, Lambeth, South London. Excellent proportions throughout, private paved back garden.",
    status: "Live",
    tags: ["Victorian Period", "Garden Access"],
    lat: 51.4613,
    lng: -0.1156,
    isShared: false,
    isStudent: false,
    isRetirement: false,
    councilTaxBand: "D",
    epcEE: "D",
    epcEI: "D",
    hasParking: false,
    hasGarden: true,
    isBillsIncluded: false,
    securityDeposit: "£3,346",
    holdingDeposit: "£669",
    contactNumber: "07700 900133"
  }
];

