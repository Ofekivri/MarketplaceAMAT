import type { PrismaClient } from "@prisma/client";

type SeedOptions = { reset?: boolean };

const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

export async function seedDemoData(
  prisma: PrismaClient,
  opts: SeedOptions = {},
) {
  if (opts.reset) {
    await prisma.notification.deleteMany();
    await prisma.claim.deleteMany();
    await prisma.offer.deleteMany();
    await prisma.user.deleteMany();
  } else {
    const existing = await prisma.user.count();
    if (existing > 0) {
      return { skipped: true, existingUsers: existing };
    }
  }

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "alice@amat.example",
        name: "Alice Cohen",
        department: "Manufacturing B",
        role: "poster",
      },
    }),
    prisma.user.create({
      data: {
        email: "bob@amat.example",
        name: "Bob Levi",
        department: "Procurement",
        role: "claimer",
      },
    }),
    prisma.user.create({
      data: {
        email: "carol@amat.example",
        name: "Carol Mizrahi",
        department: "Maintenance",
        role: "poster",
      },
    }),
    prisma.user.create({
      data: {
        email: "dan@amat.example",
        name: "Dan Peretz",
        department: "Operations",
        role: "claimer",
      },
    }),
    prisma.user.create({
      data: {
        email: "eve@amat.example",
        name: "Eve Shapira",
        department: "R&D",
        role: "claimer",
      },
    }),
  ]);

  const [alice, bob, carol, dan, eve] = users;

  const offerData: Array<{
    offeringUserId: string;
    category: string;
    subCategory: string;
    itemName: string;
    description: string;
    quantity: number;
    condition: "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";
    location: string;
    scrapDate: Date;
    estimatedValue: number;
  }> = [
    // --- Semiconductor-specific ---
    { offeringUserId: carol.id, category: "FOUP", subCategory: "300mm", itemName: "Entegris 300mm FOUPs", description: "Entegris A300 series, no scratches on wafer seats. 8 units.", quantity: 8, condition: "LIKE_NEW", location: "Fab B, Cleanroom Storage", scrapDate: daysFromNow(5), estimatedValue: 18000 },
    { offeringUserId: dan.id, category: "FOUP", subCategory: "300mm", itemName: "300mm FOUPs (used, clean)", description: "Previously on tool line, particle-checked. Covers intact.", quantity: 12, condition: "GOOD", location: "Cleanroom Bay 4", scrapDate: daysFromNow(3), estimatedValue: 15000 },
    { offeringUserId: alice.id, category: "FOSB", subCategory: "300mm", itemName: "FOSBs (Front Opening Shipping Boxes)", description: "For 300mm wafer shipping. Sealed, unused.", quantity: 20, condition: "LIKE_NEW", location: "Shipping Dock 2", scrapDate: daysFromNow(8), estimatedValue: 9000 },
    { offeringUserId: carol.id, category: "FOSB", subCategory: "300mm", itemName: "FOSB lot (mixed brands)", description: "Mostly Achilles and Entegris. Scuffs on externals.", quantity: 30, condition: "FAIR", location: "Receiving Dock", scrapDate: daysFromNow(2), estimatedValue: 6000 },
    { offeringUserId: eve.id, category: "WAFER", subCategory: "Blank Silicon (300mm)", itemName: "300mm Blank Silicon Wafers", description: "Test wafers, non-prime. For dummy / transfer use only.", quantity: 100, condition: "GOOD", location: "R&D Wafer Vault", scrapDate: daysFromNow(10), estimatedValue: 4500 },
    { offeringUserId: alice.id, category: "WAFER", subCategory: "Cassette", itemName: "Wafer Cassettes (200mm)", description: "PPS-based cassettes for older 200mm processes.", quantity: 15, condition: "GOOD", location: "Legacy Tools Area", scrapDate: daysFromNow(6), estimatedValue: 2200 },
    { offeringUserId: eve.id, category: "RETICLE", subCategory: "SMIF Pod (6\")", itemName: "Reticle SMIF Pods", description: "Entegris 6x6 inch reticle pods, particle clean.", quantity: 6, condition: "LIKE_NEW", location: "Litho Bay Storage", scrapDate: daysFromNow(12), estimatedValue: 7200 },
    { offeringUserId: carol.id, category: "CHAMBER", subCategory: "Showerhead", itemName: "Showerhead Assemblies", description: "Used aluminum showerheads from CVD chamber. Anodize worn.", quantity: 4, condition: "FAIR", location: "CVD Spares Area", scrapDate: daysFromNow(4), estimatedValue: 5600 },
    { offeringUserId: dan.id, category: "CHAMBER", subCategory: "ESC / Chuck", itemName: "ESC (Electrostatic Chuck)", description: "PM removed, ceramic surface intact. Suitable for rebuild.", quantity: 2, condition: "FAIR", location: "Etch Spares Cage", scrapDate: daysFromNow(7), estimatedValue: 9000 },
    { offeringUserId: carol.id, category: "CHAMBER", subCategory: "Quartzware", itemName: "Quartz Chamber Liners", description: "Assorted quartzware from deposition tools.", quantity: 5, condition: "GOOD", location: "Quartzware Room", scrapDate: daysFromNow(9), estimatedValue: 3800 },
    { offeringUserId: dan.id, category: "VACUUM_GAS", subCategory: "Dry Pump", itemName: "Dry Vacuum Pump (Edwards iXL)", description: "iXL120 dry pump, recent major service. Full logs.", quantity: 1, condition: "GOOD", location: "Sub-Fab Pump Bay", scrapDate: daysFromNow(5), estimatedValue: 18000 },
    { offeringUserId: carol.id, category: "VACUUM_GAS", subCategory: "MFC", itemName: "MFCs (Mass Flow Controllers)", description: "Horiba & Brooks, various ranges 10sccm–10slm. Recal needed.", quantity: 14, condition: "GOOD", location: "Gas Panel Spares", scrapDate: daysFromNow(6), estimatedValue: 11000 },
    { offeringUserId: dan.id, category: "VACUUM_GAS", subCategory: "Turbo Pump", itemName: "Turbo Pump Spares", description: "Pfeiffer HiPace spares: bearings, electronics modules.", quantity: 1, condition: "GOOD", location: "Sub-Fab Storage", scrapDate: daysFromNow(11), estimatedValue: 5000 },
    { offeringUserId: eve.id, category: "CLEANROOM", subCategory: "Wipes", itemName: "Cleanroom Wipes (9x9)", description: "Texwipe polyester, sealed boxes. 15 boxes.", quantity: 15, condition: "LIKE_NEW", location: "Cleanroom Gowning", scrapDate: daysFromNow(25), estimatedValue: 2400 },
    { offeringUserId: alice.id, category: "CLEANROOM", subCategory: "Coveralls", itemName: "Cleanroom Coveralls (sealed)", description: "Kimtech A8, sizes M/L/XL mixed. Sealed packages.", quantity: 40, condition: "LIKE_NEW", location: "Gowning Room B", scrapDate: daysFromNow(18), estimatedValue: 3200 },

    // --- General industrial ---
    { offeringUserId: alice.id, category: "OFFICE", subCategory: "Chair", itemName: "3x Office Chairs", description: "Like new, blue mesh, ergonomic. Bought 6 months ago.", quantity: 3, condition: "LIKE_NEW", location: "Building 2, 3rd Floor", scrapDate: daysFromNow(5), estimatedValue: 4500 },
    { offeringUserId: carol.id, category: "MOTOR", subCategory: "Electric Motor", itemName: "2x Electric Motors", description: "Working 3-phase, 5HP each. Tested last week.", quantity: 2, condition: "GOOD", location: "Building 1, Basement", scrapDate: daysFromNow(3), estimatedValue: 8000 },
    { offeringUserId: alice.id, category: "HAND_TOOL", subCategory: "Wrenches", itemName: "Tools Set (various)", description: "Mixed hand tools, some surface rust but functional.", quantity: 1, condition: "FAIR", location: "Building 3, Tool Room", scrapDate: daysFromNow(1), estimatedValue: 1500 },
    { offeringUserId: bob.id, category: "ELECTRONICS", subCategory: "Monitor", itemName: "10x LCD Monitors 24''", description: "Dell P2419H, all working. Replaced in office upgrade.", quantity: 10, condition: "GOOD", location: "Building 4, Storage A", scrapDate: daysFromNow(7), estimatedValue: 6000 },
    { offeringUserId: dan.id, category: "VACUUM_GAS", subCategory: "Dry Pump", itemName: "Industrial Vacuum Pump", description: "Busch R5 RA 0063 F, 200 hours of use. Good rebuild candidate.", quantity: 1, condition: "GOOD", location: "Building 1, Vacuum Lab", scrapDate: daysFromNow(4), estimatedValue: 12000 },
    { offeringUserId: eve.id, category: "OFFICE", subCategory: "Desk", itemName: "Lab Workbench", description: "Stainless top, 2m wide. Scratches but structurally sound.", quantity: 1, condition: "FAIR", location: "R&D Block, Room 204", scrapDate: daysFromNow(10), estimatedValue: 2200 },
    { offeringUserId: alice.id, category: "MATERIAL_HANDLING", subCategory: "Conveyor", itemName: "Conveyor Belt Section", description: "Rubber belt, 3m. Previously used on line 4.", quantity: 1, condition: "GOOD", location: "Building 2, Line 4 Storage", scrapDate: daysFromNow(2), estimatedValue: 3500 },
    { offeringUserId: carol.id, category: "MOTOR", subCategory: "Pneumatic Cylinder", itemName: "Pneumatic Cylinders", description: "SMC brand, assorted bores. Mostly tested.", quantity: 8, condition: "GOOD", location: "Maintenance Workshop", scrapDate: daysFromNow(6), estimatedValue: 2800 },
    { offeringUserId: bob.id, category: "OFFICE", subCategory: "Desk", itemName: "Office Desks (wood)", description: "L-shape desks with drawers. Some ring stains.", quantity: 6, condition: "FAIR", location: "Building 5, Floor 2", scrapDate: daysFromNow(8), estimatedValue: 3000 },
    { offeringUserId: dan.id, category: "MATERIAL_HANDLING", subCategory: "Pallet", itemName: "Forklift Pallets", description: "EUR-pallets, mixed condition, stacked outside warehouse.", quantity: 40, condition: "FAIR", location: "Warehouse Yard", scrapDate: daysFromNow(2), estimatedValue: 800 },
    { offeringUserId: alice.id, category: "ELECTRONICS", subCategory: "Network Gear", itemName: "Network Switches (48-port)", description: "Cisco Catalyst 2960, decommissioned. Licenses not included.", quantity: 4, condition: "GOOD", location: "Server Room B", scrapDate: daysFromNow(5), estimatedValue: 4000 },
    { offeringUserId: eve.id, category: "ELECTRONICS", subCategory: "Test Equipment", itemName: "Oscilloscope (Tektronix)", description: "TDS 2024B. Calibration expired but fully functional.", quantity: 1, condition: "GOOD", location: "R&D Lab 1", scrapDate: daysFromNow(14), estimatedValue: 2400 },
    { offeringUserId: carol.id, category: "CABLE", subCategory: "Network", itemName: "Cable Reels (CAT6)", description: "Partial spools, ~200m total remaining.", quantity: 5, condition: "LIKE_NEW", location: "Building 3, IT Closet", scrapDate: daysFromNow(9), estimatedValue: 1200 },
    { offeringUserId: bob.id, category: "MOTOR", subCategory: "Fan", itemName: "Industrial Fans", description: "Wall-mounted, 50cm. Two blades need straightening.", quantity: 3, condition: "FAIR", location: "Building 2, Mezzanine", scrapDate: daysFromNow(4), estimatedValue: 600 },
    { offeringUserId: alice.id, category: "VACUUM_GAS", subCategory: "Regulator", itemName: "Gas Cylinder Rack", description: "Steel rack, holds 8 cylinders. Empty.", quantity: 1, condition: "GOOD", location: "Gas Storage Bay", scrapDate: daysFromNow(12), estimatedValue: 900 },
    { offeringUserId: eve.id, category: "ELECTRONICS", subCategory: "Power Supply", itemName: "Bench Power Supplies", description: "Rigol DP832, triple output. Light lab use.", quantity: 2, condition: "LIKE_NEW", location: "R&D Lab 2", scrapDate: daysFromNow(11), estimatedValue: 3200 },
    { offeringUserId: carol.id, category: "OTHER", subCategory: "General", itemName: "HVAC Ducting", description: "Insulated flexible duct, 4 pieces of ~3m each.", quantity: 4, condition: "GOOD", location: "Rooftop Storage", scrapDate: daysFromNow(3), estimatedValue: 1400 },
    { offeringUserId: bob.id, category: "OFFICE", subCategory: "Cabinet", itemName: "Paper Shredders", description: "Fellowes 99Ci, cross-cut. One jams occasionally.", quantity: 3, condition: "FAIR", location: "Procurement Office", scrapDate: daysFromNow(8), estimatedValue: 900 },
    { offeringUserId: alice.id, category: "SAFETY", subCategory: "Helmet", itemName: "Welding Helmets", description: "Auto-darkening, batteries included.", quantity: 5, condition: "GOOD", location: "Welding Booth, Bldg 2", scrapDate: daysFromNow(5), estimatedValue: 1500 },
    { offeringUserId: dan.id, category: "MATERIAL_HANDLING", subCategory: "Jack", itemName: "Pallet Jack (manual)", description: "2.5 ton, hydraulic. Wheel worn.", quantity: 1, condition: "FAIR", location: "Warehouse Floor", scrapDate: daysFromNow(7), estimatedValue: 700 },
    { offeringUserId: eve.id, category: "ELECTRONICS", subCategory: "Other", itemName: "Soldering Stations (Hakko)", description: "FX-888D, complete with stands and tips.", quantity: 3, condition: "GOOD", location: "Electronics Lab", scrapDate: daysFromNow(13), estimatedValue: 2100 },
    { offeringUserId: carol.id, category: "SAFETY", subCategory: "Harness", itemName: "Safety Harnesses", description: "Full-body, within inspection date until Q3.", quantity: 6, condition: "LIKE_NEW", location: "Safety Office", scrapDate: daysFromNow(10), estimatedValue: 2400 },
    { offeringUserId: bob.id, category: "ELECTRONICS", subCategory: "Printer", itemName: "Printer (laser, B&W)", description: "HP LaserJet M402, recently serviced.", quantity: 1, condition: "GOOD", location: "Procurement Floor", scrapDate: daysFromNow(9), estimatedValue: 500 },
    { offeringUserId: alice.id, category: "OTHER", subCategory: "General", itemName: "Aluminum Extrusion 40x40", description: "~30m total, various cuts. Some with T-nuts.", quantity: 1, condition: "GOOD", location: "Line 3 Tool Cage", scrapDate: daysFromNow(4), estimatedValue: 1100 },
    { offeringUserId: dan.id, category: "OFFICE", subCategory: "Whiteboard", itemName: "Whiteboards (wall)", description: "Magnetic, 1.2m x 0.9m. Ghosting on two of them.", quantity: 4, condition: "FAIR", location: "Meeting Rooms A/B", scrapDate: daysFromNow(6), estimatedValue: 400 },
    { offeringUserId: eve.id, category: "ELECTRONICS", subCategory: "Other", itemName: "3D Printer (Prusa i3)", description: "MK3S+, 500 print hours, well maintained.", quantity: 1, condition: "GOOD", location: "R&D Maker Space", scrapDate: daysFromNow(12), estimatedValue: 3500 },
    { offeringUserId: carol.id, category: "OFFICE", subCategory: "Cabinet", itemName: "Filing Cabinets", description: "4-drawer, lockable. Keys present.", quantity: 5, condition: "FAIR", location: "Admin Archive", scrapDate: daysFromNow(8), estimatedValue: 600 },
    { offeringUserId: bob.id, category: "ELECTRONICS", subCategory: "UPS", itemName: "UPS Units (1500VA)", description: "APC Smart-UPS, batteries need replacement.", quantity: 3, condition: "POOR", location: "Server Room A", scrapDate: daysFromNow(3), estimatedValue: 600 },
    { offeringUserId: alice.id, category: "SAFETY", subCategory: "Lockout Kit", itemName: "Safety Lockout Kits", description: "Padlocks, hasps, tags. Unused surplus.", quantity: 10, condition: "LIKE_NEW", location: "Maintenance Office", scrapDate: daysFromNow(15), estimatedValue: 800 },
    { offeringUserId: dan.id, category: "MATERIAL_HANDLING", subCategory: "Shelving", itemName: "Shelving Units (heavy duty)", description: "Steel, 2m tall, 4 shelves each. Bolted assembly.", quantity: 6, condition: "GOOD", location: "Warehouse Zone 2", scrapDate: daysFromNow(7), estimatedValue: 2400 },
    { offeringUserId: eve.id, category: "HAND_TOOL", subCategory: "Measuring", itemName: "Digital Calipers", description: "Mitutoyo 500-series, batteries included.", quantity: 4, condition: "GOOD", location: "QA Lab", scrapDate: daysFromNow(11), estimatedValue: 1600 },
    { offeringUserId: carol.id, category: "MATERIAL_HANDLING", subCategory: "Ladder", itemName: "Ladder (8-foot A-frame)", description: "Werner fiberglass, minor paint on rails.", quantity: 2, condition: "GOOD", location: "Bldg 1 Tool Room", scrapDate: daysFromNow(5), estimatedValue: 900 },
    { offeringUserId: bob.id, category: "ELECTRONICS", subCategory: "Other", itemName: "Projector (ceiling)", description: "Epson EB-2255U, 1500 lamp hours remaining.", quantity: 1, condition: "GOOD", location: "Main Boardroom", scrapDate: daysFromNow(9), estimatedValue: 1200 },
    { offeringUserId: alice.id, category: "MATERIAL_HANDLING", subCategory: "Conveyor", itemName: "Conveyor Rollers (gravity)", description: "Galvanized, 1m sections. Surplus from layout change.", quantity: 20, condition: "GOOD", location: "Line 2 Staging", scrapDate: daysFromNow(4), estimatedValue: 2000 },
    { offeringUserId: dan.id, category: "OFFICE", subCategory: "Partition", itemName: "Office Partitions (cubicle)", description: "Fabric-covered, 1.5m tall. Needs cleaning.", quantity: 8, condition: "FAIR", location: "Building 5, Floor 1", scrapDate: daysFromNow(6), estimatedValue: 1200 },
    { offeringUserId: eve.id, category: "ELECTRONICS", subCategory: "Other", itemName: "Magnetic Stirrers", description: "Heat + stir plates, 4-position hotplate.", quantity: 2, condition: "GOOD", location: "Chem Lab 1", scrapDate: daysFromNow(14), estimatedValue: 800 },
    { offeringUserId: carol.id, category: "ELECTRONICS", subCategory: "Controller / PLC", itemName: "PLC Modules (Siemens S7)", description: "Assorted I/O cards. From retired control cabinet.", quantity: 7, condition: "GOOD", location: "Controls Workshop", scrapDate: daysFromNow(8), estimatedValue: 3500 },
    { offeringUserId: bob.id, category: "SAFETY", subCategory: "Fire Extinguisher", itemName: "Fire Extinguishers", description: "CO2, serviced 6 months ago. Full charge.", quantity: 4, condition: "LIKE_NEW", location: "Safety Storage", scrapDate: daysFromNow(20), estimatedValue: 600 },
    { offeringUserId: alice.id, category: "ELECTRONICS", subCategory: "Other", itemName: "Robotic Arm (educational)", description: "Dobot Magician, complete with accessories.", quantity: 1, condition: "GOOD", location: "Training Center", scrapDate: daysFromNow(10), estimatedValue: 4800 },
    { offeringUserId: dan.id, category: "ELECTRONICS", subCategory: "Other", itemName: "Barcode Scanners", description: "Honeywell Xenon, USB wired.", quantity: 5, condition: "GOOD", location: "Warehouse Office", scrapDate: daysFromNow(5), estimatedValue: 900 },
    { offeringUserId: eve.id, category: "ELECTRONICS", subCategory: "Test Equipment", itemName: "Microscope (stereo)", description: "Nikon SMZ745T, with trinocular head.", quantity: 1, condition: "LIKE_NEW", location: "QA Optical Bay", scrapDate: daysFromNow(16), estimatedValue: 5200 },
    { offeringUserId: carol.id, category: "VACUUM_GAS", subCategory: "Filter", itemName: "Air Compressor Filter Housings", description: "Spare inline filters, various sizes.", quantity: 6, condition: "LIKE_NEW", location: "Air Plant Room", scrapDate: daysFromNow(9), estimatedValue: 1100 },
    { offeringUserId: bob.id, category: "POWER_TOOL", subCategory: "Drill", itemName: "Cordless Drill Set", description: "Milwaukee M18 drills with batteries and charger.", quantity: 3, condition: "GOOD", location: "Maintenance Crib", scrapDate: daysFromNow(6), estimatedValue: 1800 },
    { offeringUserId: alice.id, category: "POWER_TOOL", subCategory: "Grinder", itemName: "Angle Grinder + Discs", description: "Makita 125mm. Mixed discs (cutting, flap).", quantity: 2, condition: "GOOD", location: "Metal Shop", scrapDate: daysFromNow(5), estimatedValue: 700 },
    { offeringUserId: carol.id, category: "CABLE", subCategory: "Power", itemName: "Heavy-gauge Power Cables", description: "4mm² THHN, red/black/green. ~150m total.", quantity: 3, condition: "LIKE_NEW", location: "Electrical Storeroom", scrapDate: daysFromNow(12), estimatedValue: 1400 },
  ];

  for (const data of offerData) {
    await prisma.offer.create({ data });
  }

  // --- Additional demo users ---
  const frank = await prisma.user.create({
    data: { email: "frank@amat.example", name: "Frank Katz", department: "Process Engineering", role: "poster" },
  });
  const grace = await prisma.user.create({
    data: { email: "grace@amat.example", name: "Grace Stern", department: "Equipment Engineering", role: "claimer" },
  });

  // --- Premium AVAILABLE offers (high-visibility for demo) ---
  const premiumAvailable = [
    {
      offeringUserId: frank.id, category: "FOUP", subCategory: "300mm",
      itemName: "Entegris A300 FOUPs — 25 units",
      description: "Full lot of 25 Entegris A300 300mm FOUPs from decommissioned tool set. Post-PM particle check passed (<EES spec). Wafer seats unscratched, latch mechanisms functional. Ready to deploy.",
      quantity: 25, condition: "LIKE_NEW" as const, location: "Fab A, Cleanroom Storage Bay 2",
      scrapDate: daysFromNow(10), estimatedValue: 55000,
    },
    {
      offeringUserId: frank.id, category: "VACUUM_GAS", subCategory: "Turbo Pump",
      itemName: "Pfeiffer HiPace 700 Turbo Pumps",
      description: "Full assembly: pump head + TC 400 electronics drive unit. 3,200 hrs, last serviced by Pfeiffer certified technician. Service log sheet available. Ideal for research or rebuild stock.",
      quantity: 2, condition: "GOOD" as const, location: "Sub-Fab Module 7, Bay C",
      scrapDate: daysFromNow(14), estimatedValue: 28000,
    },
    {
      offeringUserId: frank.id, category: "CHAMBER", subCategory: "ESC / Chuck",
      itemName: "Applied Materials Centura ESC Assembly",
      description: "Electrostatic Chuck for Centura platform. Ceramic surface crack-free, clamping voltage verified at spec. Removed during planned PM decommission — full service history documented.",
      quantity: 1, condition: "GOOD" as const, location: "Etch Module Spares Cage, Sub-Fab A",
      scrapDate: daysFromNow(7), estimatedValue: 34000,
    },
    {
      offeringUserId: grace.id, category: "ELECTRONICS", subCategory: "Test Equipment",
      itemName: "Keysight DSOX3054T Oscilloscope (4-ch, 500MHz)",
      description: "Keysight InfiniiVision 3000T-X series. All 4 channels functional, calibration due Q3 2026. Touchscreen pristine. Includes N2142A probes ×4, USB cable, power cord and carry bag.",
      quantity: 1, condition: "LIKE_NEW" as const, location: "Equipment Engineering Lab, Bldg 6",
      scrapDate: daysFromNow(18), estimatedValue: 18500,
    },
    {
      offeringUserId: carol.id, category: "VACUUM_GAS", subCategory: "MFC",
      itemName: "Brooks SLA5800 Mass Flow Controllers — 12 units",
      description: "Assorted calibrated ranges: 4× 200 sccm N₂, 4× 1000 sccm Ar, 4× 50 sccm O₂. Calibration certs included. Recertification recommended before return to process.",
      quantity: 12, condition: "GOOD" as const, location: "Gas Panel Spares Cabinet, Fab B",
      scrapDate: daysFromNow(9), estimatedValue: 24000,
    },
  ];

  for (const data of premiumAvailable) {
    await prisma.offer.create({ data });
  }

  // --- CLAIMED offers — shows active workflow during demo ---
  const claimedItems = [
    {
      offer: {
        offeringUserId: dan.id, category: "VACUUM_GAS" as const, subCategory: "Dry Pump",
        itemName: "Edwards iXL 120 Dry Pump — Refurb Candidate",
        description: "Recently serviced (1,400 hrs). Removed from NxT 1950i tool upgrade. Full service log, inlet strainer new. Excellent refurb candidate for engineering lab use.",
        quantity: 1, condition: "GOOD" as const, location: "Sub-Fab Pump Bay 3",
        scrapDate: daysFromNow(6), estimatedValue: 22000, status: "CLAIMED" as const,
      },
      claim: { claimingUserId: grace.id, status: "PICKUP_SCHEDULED" as const, notes: "Pickup scheduled for Tuesday 10:00 AM — R&D Tool Bay 2. Grace will coordinate with Dan." },
    },
    {
      offer: {
        offeringUserId: frank.id, category: "RETICLE" as const, subCategory: "SMIF Pod (6\")",
        itemName: "Entegris Reticle SMIF Pods — 12 units",
        description: "6×6″ pods, post-inspection (passed). Clean inside, no visible contamination. Decommissioned from litho tool upgrade. Immediate reuse ready.",
        quantity: 12, condition: "LIKE_NEW" as const, location: "Litho Bay Storage, Bldg 4",
        scrapDate: daysFromNow(4), estimatedValue: 14400, status: "CLAIMED" as const,
      },
      claim: { claimingUserId: bob.id, status: "PICKUP_SCHEDULED" as const, notes: "Procurement will coordinate transfer with litho bay coordinator by end of week." },
    },
    {
      offer: {
        offeringUserId: alice.id, category: "ELECTRONICS" as const, subCategory: "Computer/Laptop",
        itemName: "HP Z4 G4 Workstations — 4 units",
        description: "Xeon W-2125, 32GB ECC RAM, 512GB NVMe + 2TB HDD, Quadro P2000. Win 11 Pro. Replaced during fab process simulation cluster upgrade. Full OS + drivers intact.",
        quantity: 4, condition: "GOOD" as const, location: "IT Server Room B, Rack 3",
        scrapDate: daysFromNow(8), estimatedValue: 20000, status: "CLAIMED" as const,
      },
      claim: { claimingUserId: eve.id, status: "PENDING" as const, notes: "R&D requesting for ML model training nodes — confirming rack space." },
    },
  ];

  for (const { offer, claim } of claimedItems) {
    const created = await prisma.offer.create({ data: offer });
    await prisma.claim.create({ data: { offerId: created.id, claimingUserId: claim.claimingUserId, status: claim.status, notes: claim.notes } });
  }

  // --- COMPLETED offers — drives analytics "value saved" number ---
  const completedItems = [
    {
      offer: {
        offeringUserId: carol.id, category: "FOUP" as const, subCategory: "300mm",
        itemName: "Entegris A300 FOUPs — 30 units (lot)",
        description: "Full lot from decommissioned tool set. Particle-checked clean. Wafer seats and latches verified.",
        quantity: 30, condition: "LIKE_NEW" as const, location: "Fab C, Cleanroom Storage",
        scrapDate: daysAgo(5), estimatedValue: 54000, status: "COMPLETED" as const,
      },
      claim: { claimingUserId: bob.id, status: "COMPLETED" as const, completedAt: daysAgo(10) },
    },
    {
      offer: {
        offeringUserId: frank.id, category: "VACUUM_GAS" as const, subCategory: "Turbo Pump",
        itemName: "Pfeiffer HiPace 300 Turbo Pump",
        description: "1,800 hrs, Pfeiffer PM done. Full electronics module included. Last used on CVD module.",
        quantity: 1, condition: "GOOD" as const, location: "Sub-Fab Module 3, Storage",
        scrapDate: daysAgo(8), estimatedValue: 32000, status: "COMPLETED" as const,
      },
      claim: { claimingUserId: dan.id, status: "COMPLETED" as const, completedAt: daysAgo(12) },
    },
    {
      offer: {
        offeringUserId: dan.id, category: "ELECTRONICS" as const, subCategory: "Test Equipment",
        itemName: "Keysight E8257D Signal Generator (10MHz–67GHz)",
        description: "Calibrated Q2 2025. Full accessories set. Replaced by newer model in RF lab. All options intact.",
        quantity: 1, condition: "LIKE_NEW" as const, location: "RF Test Lab, Bldg 8",
        scrapDate: daysAgo(12), estimatedValue: 52000, status: "COMPLETED" as const,
      },
      claim: { claimingUserId: grace.id, status: "COMPLETED" as const, completedAt: daysAgo(15) },
    },
    {
      offer: {
        offeringUserId: alice.id, category: "CHAMBER" as const, subCategory: "Showerhead",
        itemName: "CVD Showerhead Assembly — Centura WxZ (3 units)",
        description: "Anodized aluminum, 1 PM cycle. Full hardware kit included. Decommissioned clean. Ready for spares stock.",
        quantity: 3, condition: "GOOD" as const, location: "CVD Spares Cage, Sub-Fab B",
        scrapDate: daysAgo(3), estimatedValue: 27000, status: "COMPLETED" as const,
      },
      claim: { claimingUserId: eve.id, status: "COMPLETED" as const, completedAt: daysAgo(8) },
    },
    {
      offer: {
        offeringUserId: carol.id, category: "ELECTRONICS" as const, subCategory: "Monitor",
        itemName: "Dell UltraSharp U2722D 27″ 4K Monitors — 10 units",
        description: "USB-C 90W charging. Near-mint. Full box sets with all cables. Replaced in office refresh.",
        quantity: 10, condition: "LIKE_NEW" as const, location: "IT Storage, Bldg 5",
        scrapDate: daysAgo(6), estimatedValue: 18000, status: "COMPLETED" as const,
      },
      claim: { claimingUserId: bob.id, status: "COMPLETED" as const, completedAt: daysAgo(7) },
    },
  ];

  for (const { offer, claim } of completedItems) {
    const created = await prisma.offer.create({ data: offer });
    await prisma.claim.create({ data: { offerId: created.id, claimingUserId: claim.claimingUserId, status: claim.status, completedAt: claim.completedAt } });
  }

  return { skipped: false, users: users.length + 2, offers: offerData.length + premiumAvailable.length + claimedItems.length + completedItems.length };
}
