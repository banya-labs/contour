import { PrismaClient, Currency, UserRole, OwnershipType, PropertyType, ListingType, PropertyStatus, LeaseStatus, PaymentMethod, PaymentStatus, ExpenseStatus, StatementStatus, CommissionStatus, TransactionType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with 16 Mals Property listings (Dev Mode Scoped)...");

  // 1. Create Organization
  const org = await prisma.organization.upsert({
    where: { slug: "contour-demo" },
    update: {},
    create: {
      id: "org_demo_contour",
      name: "Contour Real Estate Lusaka",
      slug: "contour-demo",
      currency: Currency.ZMW,
      subscriptionTier: "GROWTH",
      subscriptionStatus: "active",
    },
  });
  console.log(`- Organization "${org.name}" created/verified.`);

  // 2. Create Users
  const userGrace = await prisma.user.upsert({
    where: { email: "grace@contour.app" },
    update: {},
    create: {
      id: "user_demo_superadmin",
      name: "Grace Banda",
      email: "grace@contour.app",
      role: UserRole.SUPER_ADMIN,
      phone: "+260977112233",
    },
  });

  const userTembo = await prisma.user.upsert({
    where: { email: "tembo@contour.app" },
    update: {},
    create: {
      id: "usr_field_agent",
      name: "Tembo Mwape",
      email: "tembo@contour.app",
      role: UserRole.FIELD_AGENT,
      phone: "+260971234567",
    },
  });

  const userChipo = await prisma.user.upsert({
    where: { email: "chipo@contour.app" },
    update: {},
    create: {
      id: "usr_closing_agent",
      name: "Chipo Banda",
      email: "chipo@contour.app",
      role: UserRole.FIELD_AGENT,
      phone: "+260965987654",
    },
  });
  console.log("- Users Grace, Tembo, and Chipo created/verified.");

  // 3. Create Members
  await prisma.member.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: userGrace.id } },
    update: {},
    create: {
      organizationId: org.id,
      userId: userGrace.id,
      role: "admin",
    },
  });

  await prisma.member.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: userTembo.id } },
    update: {},
    create: {
      organizationId: org.id,
      userId: userTembo.id,
      role: "member",
    },
  });

  await prisma.member.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: userChipo.id } },
    update: {},
    create: {
      organizationId: org.id,
      userId: userChipo.id,
      role: "member",
    },
  });
  console.log("- Memberships linked.");

  // 4. Create API Key for Dify
  await prisma.apiKey.upsert({
    where: { key: "key_dev_dify_api_token_12345" },
    update: {},
    create: {
      id: "api_key_dev",
      name: "Dify Broker Integration",
      key: "key_dev_dify_api_token_12345",
      status: "active",
      permissions: ["read:properties", "write:inquiries"],
      userId: userGrace.id,
      organizationId: org.id,
    },
  });
  console.log("- Developer API Key created.");

  // 5. Seeding 16 properties (10 Sales, 6 Rentals)
  const propertiesData = [
    // === SALES (10 Listings) ===
    {
      id: "prop_01",
      title: "Twin Palm Corner Redevelopment House",
      slug: "twin-palm-corner-redevelopment",
      ownershipType: OwnershipType.MANAGED_ON_BEHALF,
      propertyType: PropertyType.STANDALONE_HOUSE,
      listingType: ListingType.FOR_SALE,
      status: PropertyStatus.AVAILABLE,
      askingPrice: 1500000,
      currency: Currency.USD,
      agencyCommissionPct: 5.0,
      bedrooms: 5,
      bathrooms: 3.0,
      plotSizeSqm: 5070, // 1.25 acres
      description: "A prime corner property situated on 1.25 acres at the corner of Twin Palm Road and Whitewood Lane. Features a spacious 5-bedroom main house, ample living and dining areas, and a detached 2-room cottage. Exceptional redevelopment potential for corporate offices, medical center, or diplomatic residence.",
      photos: [
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80",
      ],
      featuredPhoto: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop&q=80",
      suburb: "Kabulonga",
      city: "Lusaka",
      latitude: -15.421100,
      longitude: 28.334100,
      standBoundary: [
        [-15.4208, 28.3338],
        [-15.4208, 28.3345],
        [-15.4215, 28.3345],
        [-15.4215, 28.3338],
      ],
      landmarkDirections: "Corner of Twin Palm Road and Whitewood Lane",
      ownerName: "Hastings Banda",
      ownerPhone: "+260977223344",
      ownerEmail: "hastings@lands.gov.zm",
      ownerBankDetails: "Standard Chartered Kabulonga, Acct: 01002938100",
      titleDeedNumber: "Folio: LUS/LAND/2026/1102-B",
      assignedAgentId: userTembo.id,
    },
    {
      id: "prop_02",
      title: "Prime Leopards Hill Road Commercial Land",
      slug: "prime-leopards-hill-commercial-land",
      ownershipType: OwnershipType.MANAGED_ON_BEHALF,
      propertyType: PropertyType.VACANT_LAND_PLOT,
      listingType: ListingType.FOR_SALE,
      status: PropertyStatus.AVAILABLE,
      askingPrice: 5000000,
      currency: Currency.USD,
      agencyCommissionPct: 5.0,
      bedrooms: 0,
      bathrooms: 0.0,
      plotSizeSqm: 20234, // 5 acres
      description: "Exceptional 5-acre commercial development parcel situated in a high-demand node with dual road frontages on Leopards Hill Road and Whitewood Lane. Completely flat terrain, fully serviced, suitable for commercial complex, office park, high-density residential apartments, or mixed-use development.",
      photos: [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&auto=format&fit=crop&q=80",
      ],
      featuredPhoto: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop&q=80",
      suburb: "Kabulonga",
      city: "Lusaka",
      latitude: -15.431000,
      longitude: 28.351000,
      standBoundary: [
        [-15.4300, 28.3500],
        [-15.4300, 28.3520],
        [-15.4320, 28.3520],
        [-15.4320, 28.3500],
      ],
      landmarkDirections: "Opposite Leopards Hill Cemetery, next to Total Filling Station",
      ownerName: "Investrust Trustees",
      ownerPhone: "+260211293810",
      ownerEmail: "trusts@investrust.co.zm",
      ownerBankDetails: "Investrust Bank Head Office, Acct: 10293021980",
      titleDeedNumber: "Folio: LUS/LAND/2026/8942-A",
      assignedAgentId: userGrace.id,
    },
    {
      id: "prop_03",
      title: "Chindo Road Residence",
      slug: "chindo-road-residence",
      ownershipType: OwnershipType.MANAGED_ON_BEHALF,
      propertyType: PropertyType.STANDALONE_HOUSE,
      listingType: ListingType.FOR_SALE,
      status: PropertyStatus.AVAILABLE,
      askingPrice: 650000,
      currency: Currency.USD,
      agencyCommissionPct: 5.0,
      bedrooms: 3,
      bathrooms: 2.5,
      plotSizeSqm: 3205,
      description: "Executive 3-bedroom standalone residence situated on a beautifully landscaped 3,205 sqm plot. Located along Chindo Road opposite the Novare Pinnacle Shopping Mall, offering unparalleled proximity to shopping, dining, and schools. Perfect home or converted commercial office space.",
      photos: [
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop&q=80",
      ],
      featuredPhoto: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&auto=format&fit=crop&q=80",
      suburb: "Woodlands",
      city: "Lusaka",
      latitude: -15.432100,
      longitude: 28.328900,
      standBoundary: [
        [-15.4318, 28.3285],
        [-15.4318, 28.3293],
        [-15.4324, 28.3293],
        [-15.4324, 28.3285],
      ],
      landmarkDirections: "Along Chindo Road, directly opposite Novare Pinnacle Mall",
      ownerName: "Lombe Mwila",
      ownerPhone: "+260977889901",
      ownerEmail: "lombe@woodlands.co.zm",
      ownerBankDetails: "ABSA Woodlands, Acct: 0300293021",
      titleDeedNumber: "Folio: LUS/LAND/2024/2918",
      assignedAgentId: userChipo.id,
    },
    {
      id: "prop_04",
      title: "Lake Road Family Home",
      slug: "lake-road-family-home",
      ownershipType: OwnershipType.MANAGED_ON_BEHALF,
      propertyType: PropertyType.STANDALONE_HOUSE,
      listingType: ListingType.FOR_SALE,
      status: PropertyStatus.AVAILABLE,
      askingPrice: 6500000,
      currency: Currency.ZMW,
      agencyCommissionPct: 5.0,
      bedrooms: 4,
      bathrooms: 3.0,
      plotSizeSqm: 2000,
      description: "Stunning 4-bedroom family home located approximately 400m off Lake Road and 500m from Lake Road Uno Filling Station. Boasts modern fittings, high-yield borehole, master bedroom ensuite, solar inverter backup system, spacious paved yard, and boundary wall with electric fence.",
      photos: [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80",
      ],
      featuredPhoto: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80",
      suburb: "Woodlands",
      city: "Lusaka",
      latitude: -15.441000,
      longitude: 28.342000,
      standBoundary: [],
      landmarkDirections: "400 meters off Lake Road, near Lake Road Uno Filling Station",
      ownerName: "Sarah Lungu",
      ownerPhone: "+260967889900",
      ownerEmail: "sarah.lungu@yahoo.com",
      ownerBankDetails: "Zanaco Premium, Acct: 11002930219",
      titleDeedNumber: "Folio: LUS/LAND/2025/1042-S",
      assignedAgentId: userTembo.id,
    },
    {
      id: "prop_05",
      title: "Independence Avenue Ambassadorial Mansion",
      slug: "independence-avenue-ambassadorial-mansion",
      ownershipType: OwnershipType.MANAGED_ON_BEHALF,
      propertyType: PropertyType.STANDALONE_HOUSE,
      listingType: ListingType.FOR_SALE,
      status: PropertyStatus.AVAILABLE,
      askingPrice: 1700000,
      currency: Currency.USD,
      agencyCommissionPct: 5.0,
      bedrooms: 6,
      bathrooms: 5.0,
      plotSizeSqm: 4046, // 1 acre
      description: "Magnificent ambassadorial mansion situated on a prime 1-acre plot along Independence Avenue business/embassy strip. Impressive architectural facade, multiple formal reception rooms, dedicated office wing, swimming pool, and professional security guardhouse. Highly suited for embassies or corporate headquarters.",
      photos: [
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80",
      ],
      featuredPhoto: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80",
      suburb: "Woodlands",
      city: "Lusaka",
      latitude: -15.419000,
      longitude: 28.318000,
      standBoundary: [],
      landmarkDirections: "Along Independence Avenue, near Chinese Embassy",
      ownerName: "Dr. Mutale Kapwepwe",
      ownerPhone: "+260978890011",
      ownerEmail: "mutale@kapwepwe.org",
      ownerBankDetails: "Standard Chartered Main, Acct: 01009988102",
      titleDeedNumber: "Folio: LUS/LAND/2026/902-S",
      assignedAgentId: userGrace.id,
    },
    {
      id: "prop_06",
      title: "Embassy Walk Office Complex",
      slug: "embassy-walk-office-complex",
      ownershipType: OwnershipType.COMPANY_OWNED,
      propertyType: PropertyType.COMMERCIAL_OFFICE,
      listingType: ListingType.FOR_SALE,
      status: PropertyStatus.AVAILABLE,
      askingPrice: 1500000,
      currency: Currency.USD,
      agencyCommissionPct: 5.0,
      bedrooms: 18, // aggregate across all units
      bathrooms: 12.0,
      plotSizeSqm: 4046, // 1 acre
      description: "A commercial office complex consisting of six distinct 3-bedroom houses currently retrofitted and utilized as professional offices. Located on 1 acre of land in Ibex Hill, just 300 meters from the US Embassy. Secure perimeter, generator backup, and parking for 30+ vehicles.",
      photos: [
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80",
      ],
      featuredPhoto: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80",
      suburb: "Ibex Hill",
      city: "Lusaka",
      latitude: -15.421500,
      longitude: 28.368500,
      standBoundary: [],
      landmarkDirections: "300 meters off Twin Palm Road, near US Embassy",
      ownerName: "Contour Holdings Ltd",
      ownerPhone: "+260977112233",
      ownerEmail: "info@contour.app",
      ownerBankDetails: "Zanaco Premium Branch, Acct: 11002930219",
      titleDeedNumber: "Folio: LUS/CORP/2026/894",
      assignedAgentId: userTembo.id,
    },
    {
      id: "prop_07",
      title: "Kabanana Commercial Retail Block",
      slug: "kabanana-commercial-retail-block",
      ownershipType: OwnershipType.MANAGED_ON_BEHALF,
      propertyType: PropertyType.COMMERCIAL_OFFICE,
      listingType: ListingType.FOR_SALE,
      status: PropertyStatus.AVAILABLE,
      askingPrice: 3500000,
      currency: Currency.ZMW,
      agencyCommissionPct: 5.0,
      bedrooms: 0,
      bathrooms: 2.0,
      plotSizeSqm: 307,
      description: "High-yield commercial retail block situated on a 307 sqm plot in Kabanana. Includes 6 individual retail shops (4x8m) and 1 large anchor supermarket space (115 sqm). 100% occupied with strong tenant retention and steady Kwacha cash flow.",
      photos: [
        "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&auto=format&fit=crop&q=80",
      ],
      featuredPhoto: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&auto=format&fit=crop&q=80",
      suburb: "Kabanana",
      city: "Lusaka",
      latitude: -15.352000,
      longitude: 28.281000,
      standBoundary: [],
      landmarkDirections: "Kabanana Market Main Road",
      ownerName: "Fredrick Chiluba Jr",
      ownerPhone: "+260978129301",
      ownerEmail: "fchiluba@gmail.com",
      ownerBankDetails: "Indo Zambia Bank, Acct: 890123012938",
      titleDeedNumber: "Folio: LUS/LAND/2023/1203",
      assignedAgentId: userChipo.id,
    },
    {
      id: "prop_08",
      title: "Mosi-Oa-Tunya Riverfront Resort",
      slug: "mosi-oa-tunya-riverfront-resort",
      ownershipType: OwnershipType.MANAGED_ON_BEHALF,
      propertyType: PropertyType.STANDALONE_HOUSE,
      listingType: ListingType.FOR_SALE,
      status: PropertyStatus.AVAILABLE,
      askingPrice: 2000000,
      currency: Currency.USD,
      agencyCommissionPct: 5.0,
      bedrooms: 12,
      bathrooms: 12.0,
      plotSizeSqm: 40460, // 10 acres
      description: "An incredible investment resort located inside Mosi-Oa-Tunya National Park in Livingstone. Features 12 luxury private riverfront chalets, central restaurant/bar facility, swimming pool, and boat dock with direct access to the Zambezi River. Operates under active tourism license.",
      photos: [
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop&q=80",
      ],
      featuredPhoto: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop&q=80",
      suburb: "Livingstone",
      city: "Livingstone",
      latitude: -17.868000,
      longitude: 25.828000,
      standBoundary: [],
      landmarkDirections: "Zambezi Riverfront, inside Mosi-Oa-Tunya National Park",
      ownerName: "Zambezi Lodges Ltd",
      ownerPhone: "+2603212893",
      ownerEmail: "reservations@zambezilodges.co.zm",
      ownerBankDetails: "Standard Chartered Livingstone, Acct: 0200892019",
      titleDeedNumber: "Folio: LIV/LAND/2026/894",
      assignedAgentId: userGrace.id,
    },
    {
      id: "prop_09",
      title: "Rhodes Park Flats Block",
      slug: "rhodes-park-flats-block",
      ownershipType: OwnershipType.MANAGED_ON_BEHALF,
      propertyType: PropertyType.APARTMENT,
      listingType: ListingType.FOR_SALE,
      status: PropertyStatus.AVAILABLE,
      askingPrice: 16000000,
      currency: Currency.ZMW,
      agencyCommissionPct: 5.0,
      bedrooms: 8, // 4 flats * 2 beds
      bathrooms: 8.0,
      plotSizeSqm: 3008,
      description: "Excellent multi-family investment block comprising four standalone 2-bedroom flats on a spacious 3,008 sqm plot in Rhodes Park. Highly strategic location with high occupancy rates, dedicated carports, borehole, storage tanks, and rapid access to Lusaka CBD.",
      photos: [
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80",
      ],
      featuredPhoto: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80",
      suburb: "Rhodes Park",
      city: "Lusaka",
      latitude: -15.411000,
      longitude: 28.308000,
      standBoundary: [],
      landmarkDirections: "Along Joseph Mwilwa Road, near PACRA Offices",
      ownerName: "Rhodes Investments Ltd",
      ownerPhone: "+260977221199",
      ownerEmail: "rhodes@flats.co.zm",
      ownerBankDetails: "FNB Rhodes Park, Acct: 62098129381",
      titleDeedNumber: "Folio: LUS/LAND/2025/1192-M",
      assignedAgentId: userTembo.id,
    },
    {
      id: "prop_10",
      title: "Great North Road Development Land",
      slug: "great-north-road-development-land",
      ownershipType: OwnershipType.MANAGED_ON_BEHALF,
      propertyType: PropertyType.VACANT_LAND_PLOT,
      listingType: ListingType.FOR_SALE,
      status: PropertyStatus.SOLD,
      askingPrice: 25000000,
      currency: Currency.ZMW,
      agencyCommissionPct: 5.0,
      bedrooms: 0,
      bathrooms: 0.0,
      plotSizeSqm: 176120, // 43.52 acres
      description: "Prime commercial bare land measuring 43.52 acres along the Great North Road (21 Miles). Features extensive road frontage, heavy-duty vehicle accessibility, and ZESCO power infrastructure nearby. Ideal for industrial warehouses, logistics parks, or large agricultural holdings.",
      photos: [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop&q=80",
      ],
      featuredPhoto: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop&q=80",
      suburb: "Great North Road",
      city: "Lusaka",
      latitude: -15.228000,
      longitude: 28.251000,
      standBoundary: [],
      landmarkDirections: "21 Miles marker, Great North Road",
      ownerName: "Zambezi Capital Holdings Ltd",
      ownerPhone: "+260978112233",
      ownerEmail: "investments@zambezicapital.com",
      ownerBankDetails: "Stanbic Corporate, Acct: 90918230210",
      titleDeedNumber: "Folio: LUS/LAND/2026/8942-A",
      assignedAgentId: userGrace.id,
    },

    // === RENTALS (6 Listings) ===
    {
      id: "prop_11",
      title: "Roan Road Executive Villa",
      slug: "roan-road-executive-villa",
      ownershipType: OwnershipType.MANAGED_ON_BEHALF,
      propertyType: PropertyType.STANDALONE_HOUSE,
      listingType: ListingType.FOR_RENT,
      status: PropertyStatus.AVAILABLE,
      rentalPrice: 2800,
      currency: Currency.USD,
      agencyCommissionPct: 10.0,
      bedrooms: 4,
      bathrooms: 4.0,
      plotSizeSqm: 1500,
      description: "Charming 4-bedroom executive villa along Roan Road in Kabulonga. All bedrooms are ensuite, features a bright open living room, formal dining area, TV room, study, and a fitted kitchen with pantry. Private swimming pool, landscaped garden, carport, and a 1-bedroom guest cottage.",
      photos: [
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80",
      ],
      featuredPhoto: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop&q=80",
      suburb: "Kabulonga",
      city: "Lusaka",
      latitude: -15.424000,
      longitude: 28.339000,
      standBoundary: [],
      landmarkDirections: "Along Roan Road, near Italian Embassy",
      ownerName: "Patricia Chisanga",
      ownerPhone: "+260955998811",
      ownerEmail: "patricia@gmail.com",
      ownerBankDetails: "FNB Leopards Hill, Acct: 62002930211",
      titleDeedNumber: "Folio: LUS/LAND/2025/9982-K",
      assignedAgentId: userTembo.id,
    },
    {
      id: "prop_12",
      title: "Garden City Premium Office Floor",
      slug: "garden-city-premium-office-floor",
      ownershipType: OwnershipType.MANAGED_ON_BEHALF,
      propertyType: PropertyType.COMMERCIAL_OFFICE,
      listingType: ListingType.FOR_RENT,
      status: PropertyStatus.AVAILABLE,
      rentalPrice: 18000,
      currency: Currency.USD,
      agencyCommissionPct: 10.0,
      bedrooms: 0,
      bathrooms: 6.0,
      plotSizeSqm: 900,
      description: "900 sqm of premium, highly corporate office space located upstairs in the Garden City complex. Features open plan layouts, executive downstairs lobby, separate restrooms with wheelchair accessibility, dedicated elevator, emergency exit, and 24/7 security guard presence.",
      photos: [
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80",
      ],
      featuredPhoto: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80",
      suburb: "Great East Road",
      city: "Lusaka",
      latitude: -15.388000,
      longitude: 28.348000,
      standBoundary: [],
      landmarkDirections: "Great East Road, near Airport Roundabout",
      ownerName: "Garden City Mall Ltd",
      ownerPhone: "+260211293829",
      ownerEmail: "leasing@gardencity.co.zm",
      ownerBankDetails: "Stanbic Bank Corporate, Acct: 099182302198",
      titleDeedNumber: "Folio: LUS/COMM/2024/9910",
      assignedAgentId: userGrace.id,
    },
    {
      id: "prop_13",
      title: "Garden City Office Shell",
      slug: "garden-city-office-shell",
      ownershipType: OwnershipType.MANAGED_ON_BEHALF,
      propertyType: PropertyType.COMMERCIAL_OFFICE,
      listingType: ListingType.FOR_RENT,
      status: PropertyStatus.AVAILABLE,
      rentalPrice: 35000,
      currency: Currency.ZMW,
      agencyCommissionPct: 10.0,
      bedrooms: 0,
      bathrooms: 2.0,
      plotSizeSqm: 172,
      description: "172 sqm open shell commercial space, perfect for medium-sized enterprises wishing to partition custom office space. Excellent natural light, direct access to client parking, situated inside the secure Garden City retail complex near Great East Road.",
      photos: [
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80",
      ],
      featuredPhoto: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80",
      suburb: "Great East Road",
      city: "Lusaka",
      latitude: -15.388500,
      longitude: 28.348200,
      standBoundary: [],
      landmarkDirections: "Garden City Complex, Ground Floor",
      ownerName: "Garden City Mall Ltd",
      ownerPhone: "+260211293829",
      ownerEmail: "leasing@gardencity.co.zm",
      ownerBankDetails: "Stanbic Bank Corporate, Acct: 099182302198",
      titleDeedNumber: "Folio: LUS/COMM/2024/9910",
      assignedAgentId: userGrace.id,
    },
    {
      id: "prop_14",
      title: "Woodlands Lakeshore Townhouse",
      slug: "woodlands-lakeshore-townhouse",
      ownershipType: OwnershipType.MANAGED_ON_BEHALF,
      propertyType: PropertyType.APARTMENT,
      listingType: ListingType.FOR_RENT,
      status: PropertyStatus.AVAILABLE,
      rentalPrice: 15000,
      currency: Currency.ZMW,
      agencyCommissionPct: 10.0,
      bedrooms: 3,
      bathrooms: 2.5,
      plotSizeSqm: 300,
      description: "Executive 3-bedroom rental townhouse with private garden, open kitchen layout, master bedroom ensuite, backup generator connection, and 24/7 security. Located in a pristine, gated block of flats just 400 meters off Lake Road.",
      photos: [
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80",
      ],
      featuredPhoto: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80",
      suburb: "Woodlands",
      city: "Lusaka",
      latitude: -15.438000,
      longitude: 28.345000,
      standBoundary: [],
      landmarkDirections: "400m off Lake Road, close to Lake Road School",
      ownerName: "Sarah Lungu",
      ownerPhone: "+260967889900",
      ownerEmail: "sarah.lungu@yahoo.com",
      ownerBankDetails: "Zanaco Premium, Acct: 11002930219",
      titleDeedNumber: "Folio: LUS/LAND/2025/1042-S",
      assignedAgentId: userChipo.id,
    },
    {
      id: "prop_15",
      title: "Rhodes Park Executive Apartment",
      slug: "rhodes-park-executive-apartment",
      ownershipType: OwnershipType.MANAGED_ON_BEHALF,
      propertyType: PropertyType.APARTMENT,
      listingType: ListingType.FOR_RENT,
      status: PropertyStatus.AVAILABLE,
      rentalPrice: 12000,
      currency: Currency.ZMW,
      agencyCommissionPct: 10.0,
      bedrooms: 2,
      bathrooms: 2.0,
      plotSizeSqm: 120,
      description: "Secure, serviced 2-bedroom apartment located along Joseph Mwilwa Road in Rhodes Park. Daily cleaning, high-speed fiber internet, standby power inverter, and security included. Walking distance to central government ministries and PACRA.",
      photos: [
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80",
      ],
      featuredPhoto: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80",
      suburb: "Rhodes Park",
      city: "Lusaka",
      latitude: -15.411200,
      longitude: 28.308200,
      standBoundary: [],
      landmarkDirections: "Rhodes Park Block, Joseph Mwilwa Road",
      ownerName: "Lombe Mwila",
      ownerPhone: "+260977889901",
      ownerEmail: "lombe@woodlands.co.zm",
      ownerBankDetails: "ABSA Woodlands, Acct: 0300293021",
      titleDeedNumber: "Folio: LUS/LAND/2024/2918",
      assignedAgentId: userChipo.id,
    },
    {
      id: "prop_16",
      title: "State Lodge Gated Residence",
      slug: "state-lodge-gated-residence",
      ownershipType: OwnershipType.MANAGED_ON_BEHALF,
      propertyType: PropertyType.STANDALONE_HOUSE,
      listingType: ListingType.FOR_RENT,
      status: PropertyStatus.AVAILABLE,
      rentalPrice: 1800,
      currency: Currency.USD,
      agencyCommissionPct: 10.0,
      bedrooms: 3,
      bathrooms: 3.0,
      plotSizeSqm: 2000,
      description: "Exquisite 3-bedroom residence set on a large 2,000 sqm plot inside a secure gated enclave in State Lodge. Includes full solar battery inverter system for seamless power during load-shedding, private borehole, electric fence, and manicured lawns.",
      photos: [
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&auto=format&fit=crop&q=80",
      ],
      featuredPhoto: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&auto=format&fit=crop&q=80",
      suburb: "State Lodge",
      city: "Lusaka",
      latitude: -15.482000,
      longitude: 28.398000,
      standBoundary: [],
      landmarkDirections: "State Lodge Road, close to Presidential Lodge",
      ownerName: "Dr. Mutale Kapwepwe",
      ownerPhone: "+260978890011",
      ownerEmail: "mutale@kapwepwe.org",
      ownerBankDetails: "Standard Chartered Main, Acct: 01009988102",
      titleDeedNumber: "Folio: LUS/LAND/2026/902-S",
      assignedAgentId: userTembo.id,
    },
  ];

  for (const property of propertiesData) {
    const { standBoundary, ...pRest } = property;
    await prisma.property.upsert({
      where: { organizationId_slug: { organizationId: org.id, slug: property.slug } },
      update: {},
      create: {
        ...pRest,
        organizationId: org.id,
        createdById: userGrace.id,
        standBoundary: standBoundary || undefined,
      },
    });
  }
  console.log("- 16 Properties seeded.");

  // 6. Seed CRM Inquiries (Client Leads)
  await prisma.inquiry.upsert({
    where: { id: "inq_01" },
    update: {},
    create: {
      id: "inq_01",
      organizationId: org.id,
      clientName: "Nchimunya Mweene",
      clientPhone: "+260973345566",
      clientEmail: "nchimunya@mweene.co.zm",
      lookingFor: ListingType.FOR_SALE,
      propertyType: PropertyType.STANDALONE_HOUSE,
      budgetMax: 5000000,
      currency: Currency.ZMW,
      preferredSuburbs: ["Kabulonga", "Sunningdale"],
      notes: "Looking for a modern 3-4 bedroom standalone home with borehole, security, and backup power.",
      status: "CONTACTED",
      assignedAgentId: userTembo.id,
      exclusiveLockExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30-day lock
    },
  });

  await prisma.inquiry.upsert({
    where: { id: "inq_02" },
    update: {},
    create: {
      id: "inq_02",
      organizationId: org.id,
      clientName: "Kondwani Tembo",
      clientPhone: "+260967778899",
      clientEmail: "kondwani@tembo.net",
      lookingFor: ListingType.FOR_RENT,
      propertyType: PropertyType.APARTMENT,
      budgetMax: 2500,
      currency: Currency.USD,
      preferredSuburbs: ["Leopards Hill"],
      notes: "Expat client looking for a townhouse inside a gated estate close to AIS.",
      status: "VIEWING_SCHEDULED",
      assignedAgentId: userChipo.id,
    },
  });
  console.log("- CRM Inquiries seeded.");

  // 7. Seed Leases & Rent Payments
  const lease1 = await prisma.lease.upsert({
    where: { id: "lease_01" },
    update: {},
    create: {
      id: "lease_01",
      organizationId: org.id,
      propertyId: "prop_11", // Roan Road Executive Villa
      tenantName: "Mining Logistics Expat Family",
      tenantPhone: "+260975667788",
      tenantEmail: "logistics@expats.com",
      tenantIdNumber: "NRC 291038/11/1",
      monthlyRent: 2800.0,
      currency: Currency.USD,
      depositAmount: 5600.0,
      managementFeePercent: 10.0,
      leaseStartDate: new Date("2026-06-15"),
      leaseEndDate: new Date("2027-06-14"),
      status: LeaseStatus.ACTIVE,
    },
  });

  const lease2 = await prisma.lease.upsert({
    where: { id: "lease_02" },
    update: {},
    create: {
      id: "lease_02",
      organizationId: org.id,
      propertyId: "prop_14", // Woodlands Lakeshore Townhouse
      tenantName: "Sarah Lungu's Woodlands Tenant",
      tenantPhone: "+260967889900",
      tenantEmail: "tenant@lakeshore.com",
      tenantIdNumber: "NRC 112982/10/1",
      monthlyRent: 15000.0,
      currency: Currency.ZMW,
      depositAmount: 15000.0,
      managementFeePercent: 10.0,
      leaseStartDate: new Date("2026-05-01"),
      leaseEndDate: new Date("2027-04-30"),
      status: LeaseStatus.IN_ARREARS,
    },
  });
  console.log("- Leases seeded.");

  // 8. Seed Rent Payments & Reminders
  await prisma.rentPayment.upsert({
    where: { receiptNumber: "RCPT-2026-08-001" },
    update: {},
    create: {
      id: "pay_01",
      organizationId: org.id,
      leaseId: lease1.id,
      amountPaid: 2800.0,
      currency: Currency.USD,
      periodMonth: 8,
      periodYear: 2026,
      paymentDate: new Date("2026-08-01"),
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      referenceNumber: "TXN891280312",
      receiptNumber: "RCPT-2026-08-001",
      status: PaymentStatus.CONFIRMED,
      reconciledVia: "MANUAL",
    },
  });

  await prisma.rentPayment.upsert({
    where: { receiptNumber: "RCPT-2026-07-002" },
    update: {},
    create: {
      id: "pay_02",
      organizationId: org.id,
      leaseId: lease2.id,
      amountPaid: 15000.0,
      currency: Currency.ZMW,
      periodMonth: 7,
      periodYear: 2026,
      paymentDate: new Date("2026-07-02"),
      paymentMethod: PaymentMethod.MOBILE_MONEY_MTN,
      referenceNumber: "MOMO-9910-MTN",
      receiptNumber: "RCPT-2026-07-002",
      status: PaymentStatus.CONFIRMED,
      reconciledVia: "MOMO_WEBHOOK",
    },
  });

  // Overdue notification reminder for Sarah Lungu's Woodlands lease
  await prisma.rentArrearsReminder.upsert({
    where: { idempotencyKey: "arrears-lease_02-2026-8-tier1" },
    update: {},
    create: {
      id: "rem_01",
      organizationId: org.id,
      leaseId: lease2.id,
      tier: 1,
      channel: "WHATSAPP",
      recipientPhone: "+260967889900",
      idempotencyKey: "arrears-lease_02-2026-8-tier1",
      status: "SENT",
      sentAt: new Date(),
    },
  });
  console.log("- Payments and Reminders seeded.");

  // 9. Seed Maintenance Deductions & Landlord Statements
  await prisma.maintenanceExpense.upsert({
    where: { id: "exp_01" },
    update: {},
    create: {
      id: "exp_01",
      organizationId: org.id,
      propertyId: "prop_14", // Woodlands Lakeshore Townhouse
      description: "Servicing solar inverter and borehole pump diagnostics",
      vendorName: "PowerFlow Systems Ltd",
      amount: 1500.0,
      currency: Currency.ZMW,
      status: ExpenseStatus.PAID,
      periodMonth: 8,
      periodYear: 2026,
    },
  });

  await prisma.landlordStatement.upsert({
    where: { id: "stmt_01" },
    update: {},
    create: {
      id: "stmt_01",
      organizationId: org.id,
      propertyId: "prop_14",
      landlordName: "Sarah Lungu",
      statementMonth: 8,
      statementYear: 2026,
      grossRentCollected: 15000.0,
      agencyFeeDeducted: 1500.0, // 10% fee
      maintenanceDeducted: 1500.0,
      netLandlordPayout: 12000.0, // 15000 - 1500 - 1500
      currency: Currency.ZMW,
      status: StatementStatus.APPROVED_BY_MANAGER,
      approvedById: userGrace.id,
      approvedAt: new Date(),
    },
  });
  console.log("- Expenses and Landlord Statements seeded.");

  // 10. Seed Transactions & Commission Splits
  await prisma.transaction.upsert({
    where: { id: "tx_01" },
    update: {},
    create: {
      id: "tx_01",
      organizationId: org.id,
      propertyId: "prop_10", // Great North Road
      transactionType: TransactionType.PROPERTY_SALE,
      grossValue: 25000000,
      currency: Currency.ZMW,
      agencyCommissionPct: 5.0,
      agencyCommissionAmount: 1250000, // 5% fee
      agentSplitPct: 50.0,
      agentSplitAmount: 625000, // 50% split to Grace
      status: CommissionStatus.RECEIVED,
      closingAgentId: userGrace.id,
      closedAt: new Date("2026-07-28"),
    },
  });

  await prisma.transaction.upsert({
    where: { id: "tx_02" },
    update: {},
    create: {
      id: "tx_02",
      organizationId: org.id,
      propertyId: "prop_01", // Twin Palm Corner
      transactionType: TransactionType.PROPERTY_SALE,
      grossValue: 1500000,
      currency: Currency.USD,
      agencyCommissionPct: 5.0,
      agencyCommissionAmount: 75000,
      agentSplitPct: 50.0,
      agentSplitAmount: 37500, // 50% split to Tembo
      status: CommissionStatus.EXPECTED,
      closingAgentId: userTembo.id,
      closedAt: new Date("2026-08-15"),
    },
  });
  console.log("- Transactions & splits seeded.");

  await prisma.auditLog.upsert({
    where: { id: "audit_init" },
    update: {},
    create: {
      id: "audit_init",
      organizationId: org.id,
      userId: userGrace.id,
      action: "INITIAL_DATABASE_SYSTEM_SEED",
      entityType: "System",
      entityId: "prisma_seeder",
      details: {
        environment: "development",
        seedVersion: "2.1.0",
        propertiesCount: propertiesData.length,
      },
    },
  });
  console.log("- Audit log entries recorded.");

  console.log("🎉 Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
