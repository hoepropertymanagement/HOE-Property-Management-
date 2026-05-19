export interface UKLocation {
  name: string;
  parent?: string;
  type: 'neighborhood' | 'town' | 'city' | 'borough' | 'county' | 'region' | 'country';
  lat?: number;
  lng?: number;
}

export const ukLocationHierarchy: UKLocation[] = [
  // --- GREATER LONDON ---
  { name: 'Wandsworth', type: 'borough', parent: 'London' },
  { name: 'Balham', type: 'neighborhood', parent: 'Wandsworth' },
  { name: 'Putney', type: 'neighborhood', parent: 'Wandsworth' },
  { name: 'Battersea', type: 'neighborhood', parent: 'Wandsworth' },
  { name: 'Roehampton', type: 'neighborhood', parent: 'Wandsworth' },
  { name: 'Tooting', type: 'neighborhood', parent: 'Wandsworth' },

  { name: 'Lambeth', type: 'borough', parent: 'London' },
  { name: 'Brixton', type: 'neighborhood', parent: 'Lambeth' },
  { name: 'Streatham', type: 'neighborhood', parent: 'Lambeth' },
  { name: 'Vauxhall', type: 'neighborhood', parent: 'Lambeth' },
  { name: 'Stockwell', type: 'neighborhood', parent: 'Lambeth' },
  { name: 'Kennington', type: 'neighborhood', parent: 'Lambeth' },

  { name: 'Hillingdon', type: 'borough', parent: 'London' },
  { name: 'Uxbridge', type: 'neighborhood', parent: 'Hillingdon' },
  { name: 'Hayes', type: 'neighborhood', parent: 'Hillingdon' },
  { name: 'Ruislip', type: 'neighborhood', parent: 'Hillingdon' },
  { name: 'Northwood', type: 'neighborhood', parent: 'Hillingdon' },
  { name: 'Heathrow', type: 'neighborhood', parent: 'Hillingdon' },

  { name: 'Barnet', type: 'borough', parent: 'London' },
  { name: 'Finchley', type: 'neighborhood', parent: 'Barnet' },
  { name: 'Hendon', type: 'neighborhood', parent: 'Barnet' },
  { name: 'Edgware', type: 'neighborhood', parent: 'Barnet' },
  { name: 'Golders Green', type: 'neighborhood', parent: 'Barnet' },
  { name: 'Mill Hill', type: 'neighborhood', parent: 'Barnet' },

  { name: 'Enfield', type: 'borough', parent: 'London' },
  { name: 'Edmonton', type: 'neighborhood', parent: 'Enfield' },
  { name: 'Southgate', type: 'neighborhood', parent: 'Enfield' },
  { name: 'Palmers Green', type: 'neighborhood', parent: 'Enfield' },
  { name: 'Cockfosters', type: 'neighborhood', parent: 'Enfield' },

  { name: 'Ealing', type: 'borough', parent: 'London' },
  { name: 'Acton', type: 'neighborhood', parent: 'Ealing' },
  { name: 'Hanwell', type: 'neighborhood', parent: 'Ealing' },
  { name: 'Northolt', type: 'neighborhood', parent: 'Ealing' },
  { name: 'Perivale', type: 'neighborhood', parent: 'Ealing' },
  { name: 'Southall', type: 'neighborhood', parent: 'Ealing' },

  { name: 'Richmond', type: 'borough', parent: 'London' },
  { name: 'Twickenham', type: 'neighborhood', parent: 'Richmond' },
  { name: 'Teddington', type: 'neighborhood', parent: 'Richmond' },
  { name: 'Barnes', type: 'neighborhood', parent: 'Richmond' },
  { name: 'Mortlake', type: 'neighborhood', parent: 'Richmond' },
  { name: 'Kew', type: 'neighborhood', parent: 'Richmond' },

  { name: 'Croydon', type: 'borough', parent: 'London' },
  { name: 'Purley', type: 'neighborhood', parent: 'Croydon' },
  { name: 'Coulsdon', type: 'neighborhood', parent: 'Croydon' },
  { name: 'Thornton Heath', type: 'neighborhood', parent: 'Croydon' },
  { name: 'Upper Norwood', type: 'neighborhood', parent: 'Croydon' },

  { name: 'Newham', type: 'borough', parent: 'London' },
  { name: 'Stratford', type: 'neighborhood', parent: 'Newham' },
  { name: 'Canning Town', type: 'neighborhood', parent: 'Newham' },
  { name: 'Custom House', type: 'neighborhood', parent: 'Newham' },
  { name: 'East Ham', type: 'neighborhood', parent: 'Newham' },

  { name: 'Tower Hamlets', type: 'borough', parent: 'London' },
  { name: 'Canary Wharf', type: 'neighborhood', parent: 'Tower Hamlets' },
  { name: 'Bethnal Green', type: 'neighborhood', parent: 'Tower Hamlets' },
  { name: 'Poplar', type: 'neighborhood', parent: 'Tower Hamlets' },
  { name: 'Whitechapel', type: 'neighborhood', parent: 'Tower Hamlets' },

  // --- HOME COUNTIES ---
  { name: 'Hertfordshire', type: 'county', parent: 'England' },
  { name: 'Watford', type: 'town', parent: 'Hertfordshire' },
  { name: 'Cassiobury', type: 'neighborhood', parent: 'Watford' },
  { name: 'Oxhey', type: 'neighborhood', parent: 'Watford' },
  { name: 'Welwyn Hatfield', type: 'town', parent: 'Hertfordshire' },
  { name: 'Hatfield', type: 'neighborhood', parent: 'Welwyn Hatfield' },
  { name: 'Welwyn Garden City', type: 'neighborhood', parent: 'Welwyn Hatfield' },
  { name: 'Brookmans Park', type: 'neighborhood', parent: 'Welwyn Hatfield' },
  { name: 'St Albans', type: 'town', parent: 'Hertfordshire' },
  { name: 'St Albans City', type: 'neighborhood', parent: 'St Albans' },
  { name: 'Harpenden', type: 'neighborhood', parent: 'St Albans' },
  { name: 'London Colney', type: 'neighborhood', parent: 'St Albans' },

  { name: 'Surrey', type: 'county', parent: 'England' },
  { name: 'Guildford', type: 'town', parent: 'Surrey' },
  { name: 'Ash', type: 'neighborhood', parent: 'Guildford' },
  { name: 'East Horsley', type: 'neighborhood', parent: 'Guildford' },
  { name: 'Woking', type: 'town', parent: 'Surrey' },
  { name: 'Woking Town', type: 'neighborhood', parent: 'Woking' },
  { name: 'Byfleet', type: 'neighborhood', parent: 'Woking' },
  { name: 'Knaphill', type: 'neighborhood', parent: 'Woking' },

  { name: 'Basildon', type: 'town', parent: 'Essex' },
  { name: 'Billericay', type: 'neighborhood', parent: 'Basildon' },
  { name: 'Wickford', type: 'neighborhood', parent: 'Basildon' },
  { name: 'Epping Forest', type: 'town', parent: 'Essex' },
  { name: 'Epping', type: 'neighborhood', parent: 'Epping Forest' },
  { name: 'Loughton', type: 'neighborhood', parent: 'Epping Forest' },
  { name: 'Chigwell', type: 'neighborhood', parent: 'Epping Forest' },
  
  { name: 'Medway', type: 'town', parent: 'Kent' },
  { name: 'Chatham', type: 'neighborhood', parent: 'Medway' },
  { name: 'Gillingham', type: 'neighborhood', parent: 'Medway' },
  { name: 'Rochester', type: 'neighborhood', parent: 'Medway' },

  { name: 'Slough', type: 'town', parent: 'Berkshire' },
  { name: 'Langley', type: 'neighborhood', parent: 'Slough' },
  { name: 'Windsor', type: 'town', parent: 'Berkshire' },
  { name: 'Maidenhead', type: 'town', parent: 'Berkshire' },
  { name: 'Ascot', type: 'neighborhood', parent: 'Berkshire' },

  { name: 'Coventry', type: 'city', parent: 'West Midlands' },
  { name: 'Solihull', type: 'town', parent: 'West Midlands' },
  { name: 'Wolverhampton', type: 'city', parent: 'West Midlands' },

  { name: 'Salford', type: 'city', parent: 'Greater Manchester' },
  { name: 'Trafford', type: 'town', parent: 'Greater Manchester' },
  { name: 'Altrincham', type: 'neighborhood', parent: 'Trafford' },
  { name: 'Stockport', type: 'town', parent: 'Greater Manchester' },

  { name: 'Leicester', type: 'city', parent: 'Leicestershire' },
  
  { name: 'Merseyside', type: 'county', parent: 'England' },
  { name: 'Liverpool', type: 'city', parent: 'Merseyside' },
  { name: 'St Helens', type: 'town', parent: 'Merseyside' },
  { name: 'Wirral', type: 'town', parent: 'Merseyside' },
  
  { name: 'Norfolk', type: 'county', parent: 'England' },
  { name: 'Norwich', type: 'city', parent: 'Norfolk' },
  
  { name: 'Northamptonshire', type: 'county', parent: 'England' },
  { name: 'Northampton', type: 'town', parent: 'Northamptonshire' },
  
  { name: 'Northumberland', type: 'county', parent: 'England' },
  
  { name: 'North Yorkshire', type: 'county', parent: 'England' },
  { name: 'York', type: 'city', parent: 'North Yorkshire' },
  { name: 'Middlesbrough', type: 'town', parent: 'North Yorkshire' },
  
  { name: 'Nottinghamshire', type: 'county', parent: 'England' },
  { name: 'Nottingham', type: 'city', parent: 'Nottinghamshire' },
  
  { name: 'Oxfordshire', type: 'county', parent: 'England' },
  { name: 'Oxford', type: 'city', parent: 'Oxfordshire' },
  
  { name: 'South Yorkshire', type: 'county', parent: 'England' },
  { name: 'Sheffield', type: 'city', parent: 'South Yorkshire' },
  { name: 'Doncaster', type: 'town', parent: 'South Yorkshire' },
  { name: 'Rotherham', type: 'town', parent: 'South Yorkshire' },
  
  { name: 'Tyne and Wear', type: 'county', parent: 'England' },
  { name: 'Newcastle upon Tyne', type: 'city', parent: 'Tyne and Wear' },
  { name: 'Sunderland', type: 'city', parent: 'Tyne and Wear' },
  { name: 'Gateshead', type: 'town', parent: 'Tyne and Wear' },
  
  { name: 'West Yorkshire', type: 'county', parent: 'England' },
  { name: 'Leeds', type: 'city', parent: 'West Yorkshire' },
  { name: 'Bradford', type: 'city', parent: 'West Yorkshire' },
  { name: 'Huddersfield', type: 'town', parent: 'West Yorkshire' },
  { name: 'Wakefield', type: 'city', parent: 'West Yorkshire' },

  // --- SCOTLAND, WALES, NI ---
  { name: 'Edinburgh', type: 'city', parent: 'Scotland' },
  { name: 'Glasgow', type: 'city', parent: 'Scotland' },
  { name: 'Aberdeen', type: 'city', parent: 'Scotland' },
  { name: 'Cardiff', type: 'city', parent: 'Wales' },
  { name: 'Swansea', type: 'city', parent: 'Wales' },
  { name: 'Belfast', type: 'city', parent: 'Northern Ireland' },
  
  // --- SAMPLE POSTCODES & ROADS ---
  { name: 'SW1A 1AA', type: 'neighborhood', parent: 'Westminster' },
  { name: 'AL10 9AB', type: 'neighborhood', parent: 'Hatfield' },
  { name: 'M1 1AG', type: 'neighborhood', parent: 'Manchester' },
  { name: 'B1 1BB', type: 'neighborhood', parent: 'Birmingham' },
  { name: 'Abbey Road', type: 'neighborhood', parent: 'St Johns Wood' },
  { name: 'Oxford Street', type: 'neighborhood', parent: 'London' },
  { name: 'The Mall', type: 'neighborhood', parent: 'London' },
];
