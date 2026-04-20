import type { PrismaClient } from "@prisma/client";

type SeedOptions = { reset?: boolean };

const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
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
    itemName: string;
    description: string;
    quantity: number;
    condition: "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";
    location: string;
    scrapDate: Date;
    estimatedValue: number;
  }> = [
    // --- Semiconductor-specific ---
    { offeringUserId: carol.id, category: "FOUP", itemName: "Entegris 300mm FOUPs", description: "Entegris A300 series, no scratches on wafer seats. 8 units.", quantity: 8, condition: "LIKE_NEW", location: "Fab B, Cleanroom Storage", scrapDate: daysFromNow(5), estimatedValue: 18000 },
    { offeringUserId: dan.id, category: "FOUP", itemName: "300mm FOUPs (used, clean)", description: "Previously on tool line, particle-checked. Covers intact.", quantity: 12, condition: "GOOD", location: "Cleanroom Bay 4", scrapDate: daysFromNow(3), estimatedValue: 15000 },
    { offeringUserId: alice.id, category: "FOSB", itemName: "FOSBs (Front Opening Shipping Boxes)", description: "For 300mm wafer shipping. Sealed, unused.", quantity: 20, condition: "LIKE_NEW", location: "Shipping Dock 2", scrapDate: daysFromNow(8), estimatedValue: 9000 },
    { offeringUserId: carol.id, category: "FOSB", itemName: "FOSB lot (mixed brands)", description: "Mostly Achilles and Entegris. Scuffs on externals.", quantity: 30, condition: "FAIR", location: "Receiving Dock", scrapDate: daysFromNow(2), estimatedValue: 6000 },
    { offeringUserId: eve.id, category: "WAFER", itemName: "300mm Blank Silicon Wafers", description: "Test wafers, non-prime. For dummy / transfer use only.", quantity: 100, condition: "GOOD", location: "R&D Wafer Vault", scrapDate: daysFromNow(10), estimatedValue: 4500 },
    { offeringUserId: alice.id, category: "WAFER", itemName: "Wafer Cassettes (200mm)", description: "PPS-based cassettes for older 200mm processes.", quantity: 15, condition: "GOOD", location: "Legacy Tools Area", scrapDate: daysFromNow(6), estimatedValue: 2200 },
    { offeringUserId: eve.id, category: "RETICLE", itemName: "Reticle SMIF Pods", description: "Entegris 6x6 inch reticle pods, particle clean.", quantity: 6, condition: "LIKE_NEW", location: "Litho Bay Storage", scrapDate: daysFromNow(12), estimatedValue: 7200 },
    { offeringUserId: carol.id, category: "CHAMBER", itemName: "Showerhead Assemblies", description: "Used aluminum showerheads from CVD chamber. Anodize worn.", quantity: 4, condition: "FAIR", location: "CVD Spares Area", scrapDate: daysFromNow(4), estimatedValue: 5600 },
    { offeringUserId: dan.id, category: "CHAMBER", itemName: "ESC (Electrostatic Chuck)", description: "PM removed, ceramic surface intact. Suitable for rebuild.", quantity: 2, condition: "FAIR", location: "Etch Spares Cage", scrapDate: daysFromNow(7), estimatedValue: 9000 },
    { offeringUserId: carol.id, category: "CHAMBER", itemName: "Quartz Chamber Liners", description: "Assorted quartzware from deposition tools.", quantity: 5, condition: "GOOD", location: "Quartzware Room", scrapDate: daysFromNow(9), estimatedValue: 3800 },
    { offeringUserId: dan.id, category: "VACUUM_GAS", itemName: "Dry Vacuum Pump (Edwards iXL)", description: "iXL120 dry pump, recent major service. Full logs.", quantity: 1, condition: "GOOD", location: "Sub-Fab Pump Bay", scrapDate: daysFromNow(5), estimatedValue: 18000 },
    { offeringUserId: carol.id, category: "VACUUM_GAS", itemName: "MFCs (Mass Flow Controllers)", description: "Horiba & Brooks, various ranges 10sccm–10slm. Recal needed.", quantity: 14, condition: "GOOD", location: "Gas Panel Spares", scrapDate: daysFromNow(6), estimatedValue: 11000 },
    { offeringUserId: dan.id, category: "VACUUM_GAS", itemName: "Turbo Pump Spares", description: "Pfeiffer HiPace spares: bearings, electronics modules.", quantity: 1, condition: "GOOD", location: "Sub-Fab Storage", scrapDate: daysFromNow(11), estimatedValue: 5000 },
    { offeringUserId: eve.id, category: "CLEANROOM", itemName: "Cleanroom Wipes (9x9)", description: "Texwipe polyester, sealed boxes. 15 boxes.", quantity: 15, condition: "LIKE_NEW", location: "Cleanroom Gowning", scrapDate: daysFromNow(25), estimatedValue: 2400 },
    { offeringUserId: alice.id, category: "CLEANROOM", itemName: "Cleanroom Coveralls (sealed)", description: "Kimtech A8, sizes M/L/XL mixed. Sealed packages.", quantity: 40, condition: "LIKE_NEW", location: "Gowning Room B", scrapDate: daysFromNow(18), estimatedValue: 3200 },

    // --- General industrial ---
    { offeringUserId: alice.id, category: "OFFICE", itemName: "3x Office Chairs", description: "Like new, blue mesh, ergonomic. Bought 6 months ago.", quantity: 3, condition: "LIKE_NEW", location: "Building 2, 3rd Floor", scrapDate: daysFromNow(5), estimatedValue: 4500 },
    { offeringUserId: carol.id, category: "MOTOR", itemName: "2x Electric Motors", description: "Working 3-phase, 5HP each. Tested last week.", quantity: 2, condition: "GOOD", location: "Building 1, Basement", scrapDate: daysFromNow(3), estimatedValue: 8000 },
    { offeringUserId: alice.id, category: "HAND_TOOL", itemName: "Tools Set (various)", description: "Mixed hand tools, some surface rust but functional.", quantity: 1, condition: "FAIR", location: "Building 3, Tool Room", scrapDate: daysFromNow(1), estimatedValue: 1500 },
    { offeringUserId: bob.id, category: "ELECTRONICS", itemName: "10x LCD Monitors 24''", description: "Dell P2419H, all working. Replaced in office upgrade.", quantity: 10, condition: "GOOD", location: "Building 4, Storage A", scrapDate: daysFromNow(7), estimatedValue: 6000 },
    { offeringUserId: dan.id, category: "VACUUM_GAS", itemName: "Industrial Vacuum Pump", description: "Busch R5 RA 0063 F, 200 hours of use. Good rebuild candidate.", quantity: 1, condition: "GOOD", location: "Building 1, Vacuum Lab", scrapDate: daysFromNow(4), estimatedValue: 12000 },
    { offeringUserId: eve.id, category: "OFFICE", itemName: "Lab Workbench", description: "Stainless top, 2m wide. Scratches but structurally sound.", quantity: 1, condition: "FAIR", location: "R&D Block, Room 204", scrapDate: daysFromNow(10), estimatedValue: 2200 },
    { offeringUserId: alice.id, category: "MATERIAL_HANDLING", itemName: "Conveyor Belt Section", description: "Rubber belt, 3m. Previously used on line 4.", quantity: 1, condition: "GOOD", location: "Building 2, Line 4 Storage", scrapDate: daysFromNow(2), estimatedValue: 3500 },
    { offeringUserId: carol.id, category: "MOTOR", itemName: "Pneumatic Cylinders", description: "SMC brand, assorted bores. Mostly tested.", quantity: 8, condition: "GOOD", location: "Maintenance Workshop", scrapDate: daysFromNow(6), estimatedValue: 2800 },
    { offeringUserId: bob.id, category: "OFFICE", itemName: "Office Desks (wood)", description: "L-shape desks with drawers. Some ring stains.", quantity: 6, condition: "FAIR", location: "Building 5, Floor 2", scrapDate: daysFromNow(8), estimatedValue: 3000 },
    { offeringUserId: dan.id, category: "MATERIAL_HANDLING", itemName: "Forklift Pallets", description: "EUR-pallets, mixed condition, stacked outside warehouse.", quantity: 40, condition: "FAIR", location: "Warehouse Yard", scrapDate: daysFromNow(2), estimatedValue: 800 },
    { offeringUserId: alice.id, category: "ELECTRONICS", itemName: "Network Switches (48-port)", description: "Cisco Catalyst 2960, decommissioned. Licenses not included.", quantity: 4, condition: "GOOD", location: "Server Room B", scrapDate: daysFromNow(5), estimatedValue: 4000 },
    { offeringUserId: eve.id, category: "ELECTRONICS", itemName: "Oscilloscope (Tektronix)", description: "TDS 2024B. Calibration expired but fully functional.", quantity: 1, condition: "GOOD", location: "R&D Lab 1", scrapDate: daysFromNow(14), estimatedValue: 2400 },
    { offeringUserId: carol.id, category: "CABLE", itemName: "Cable Reels (CAT6)", description: "Partial spools, ~200m total remaining.", quantity: 5, condition: "LIKE_NEW", location: "Building 3, IT Closet", scrapDate: daysFromNow(9), estimatedValue: 1200 },
    { offeringUserId: bob.id, category: "MOTOR", itemName: "Industrial Fans", description: "Wall-mounted, 50cm. Two blades need straightening.", quantity: 3, condition: "FAIR", location: "Building 2, Mezzanine", scrapDate: daysFromNow(4), estimatedValue: 600 },
    { offeringUserId: alice.id, category: "VACUUM_GAS", itemName: "Gas Cylinder Rack", description: "Steel rack, holds 8 cylinders. Empty.", quantity: 1, condition: "GOOD", location: "Gas Storage Bay", scrapDate: daysFromNow(12), estimatedValue: 900 },
    { offeringUserId: eve.id, category: "ELECTRONICS", itemName: "Bench Power Supplies", description: "Rigol DP832, triple output. Light lab use.", quantity: 2, condition: "LIKE_NEW", location: "R&D Lab 2", scrapDate: daysFromNow(11), estimatedValue: 3200 },
    { offeringUserId: carol.id, category: "OTHER", itemName: "HVAC Ducting", description: "Insulated flexible duct, 4 pieces of ~3m each.", quantity: 4, condition: "GOOD", location: "Rooftop Storage", scrapDate: daysFromNow(3), estimatedValue: 1400 },
    { offeringUserId: bob.id, category: "OFFICE", itemName: "Paper Shredders", description: "Fellowes 99Ci, cross-cut. One jams occasionally.", quantity: 3, condition: "FAIR", location: "Procurement Office", scrapDate: daysFromNow(8), estimatedValue: 900 },
    { offeringUserId: alice.id, category: "SAFETY", itemName: "Welding Helmets", description: "Auto-darkening, batteries included.", quantity: 5, condition: "GOOD", location: "Welding Booth, Bldg 2", scrapDate: daysFromNow(5), estimatedValue: 1500 },
    { offeringUserId: dan.id, category: "MATERIAL_HANDLING", itemName: "Pallet Jack (manual)", description: "2.5 ton, hydraulic. Wheel worn.", quantity: 1, condition: "FAIR", location: "Warehouse Floor", scrapDate: daysFromNow(7), estimatedValue: 700 },
    { offeringUserId: eve.id, category: "ELECTRONICS", itemName: "Soldering Stations (Hakko)", description: "FX-888D, complete with stands and tips.", quantity: 3, condition: "GOOD", location: "Electronics Lab", scrapDate: daysFromNow(13), estimatedValue: 2100 },
    { offeringUserId: carol.id, category: "SAFETY", itemName: "Safety Harnesses", description: "Full-body, within inspection date until Q3.", quantity: 6, condition: "LIKE_NEW", location: "Safety Office", scrapDate: daysFromNow(10), estimatedValue: 2400 },
    { offeringUserId: bob.id, category: "ELECTRONICS", itemName: "Printer (laser, B&W)", description: "HP LaserJet M402, recently serviced.", quantity: 1, condition: "GOOD", location: "Procurement Floor", scrapDate: daysFromNow(9), estimatedValue: 500 },
    { offeringUserId: alice.id, category: "OTHER", itemName: "Aluminum Extrusion 40x40", description: "~30m total, various cuts. Some with T-nuts.", quantity: 1, condition: "GOOD", location: "Line 3 Tool Cage", scrapDate: daysFromNow(4), estimatedValue: 1100 },
    { offeringUserId: dan.id, category: "OFFICE", itemName: "Whiteboards (wall)", description: "Magnetic, 1.2m x 0.9m. Ghosting on two of them.", quantity: 4, condition: "FAIR", location: "Meeting Rooms A/B", scrapDate: daysFromNow(6), estimatedValue: 400 },
    { offeringUserId: eve.id, category: "ELECTRONICS", itemName: "3D Printer (Prusa i3)", description: "MK3S+, 500 print hours, well maintained.", quantity: 1, condition: "GOOD", location: "R&D Maker Space", scrapDate: daysFromNow(12), estimatedValue: 3500 },
    { offeringUserId: carol.id, category: "OFFICE", itemName: "Filing Cabinets", description: "4-drawer, lockable. Keys present.", quantity: 5, condition: "FAIR", location: "Admin Archive", scrapDate: daysFromNow(8), estimatedValue: 600 },
    { offeringUserId: bob.id, category: "ELECTRONICS", itemName: "UPS Units (1500VA)", description: "APC Smart-UPS, batteries need replacement.", quantity: 3, condition: "POOR", location: "Server Room A", scrapDate: daysFromNow(3), estimatedValue: 600 },
    { offeringUserId: alice.id, category: "SAFETY", itemName: "Safety Lockout Kits", description: "Padlocks, hasps, tags. Unused surplus.", quantity: 10, condition: "LIKE_NEW", location: "Maintenance Office", scrapDate: daysFromNow(15), estimatedValue: 800 },
    { offeringUserId: dan.id, category: "MATERIAL_HANDLING", itemName: "Shelving Units (heavy duty)", description: "Steel, 2m tall, 4 shelves each. Bolted assembly.", quantity: 6, condition: "GOOD", location: "Warehouse Zone 2", scrapDate: daysFromNow(7), estimatedValue: 2400 },
    { offeringUserId: eve.id, category: "HAND_TOOL", itemName: "Digital Calipers", description: "Mitutoyo 500-series, batteries included.", quantity: 4, condition: "GOOD", location: "QA Lab", scrapDate: daysFromNow(11), estimatedValue: 1600 },
    { offeringUserId: carol.id, category: "MATERIAL_HANDLING", itemName: "Ladder (8-foot A-frame)", description: "Werner fiberglass, minor paint on rails.", quantity: 2, condition: "GOOD", location: "Bldg 1 Tool Room", scrapDate: daysFromNow(5), estimatedValue: 900 },
    { offeringUserId: bob.id, category: "ELECTRONICS", itemName: "Projector (ceiling)", description: "Epson EB-2255U, 1500 lamp hours remaining.", quantity: 1, condition: "GOOD", location: "Main Boardroom", scrapDate: daysFromNow(9), estimatedValue: 1200 },
    { offeringUserId: alice.id, category: "MATERIAL_HANDLING", itemName: "Conveyor Rollers (gravity)", description: "Galvanized, 1m sections. Surplus from layout change.", quantity: 20, condition: "GOOD", location: "Line 2 Staging", scrapDate: daysFromNow(4), estimatedValue: 2000 },
    { offeringUserId: dan.id, category: "OFFICE", itemName: "Office Partitions (cubicle)", description: "Fabric-covered, 1.5m tall. Needs cleaning.", quantity: 8, condition: "FAIR", location: "Building 5, Floor 1", scrapDate: daysFromNow(6), estimatedValue: 1200 },
    { offeringUserId: eve.id, category: "ELECTRONICS", itemName: "Magnetic Stirrers", description: "Heat + stir plates, 4-position hotplate.", quantity: 2, condition: "GOOD", location: "Chem Lab 1", scrapDate: daysFromNow(14), estimatedValue: 800 },
    { offeringUserId: carol.id, category: "ELECTRONICS", itemName: "PLC Modules (Siemens S7)", description: "Assorted I/O cards. From retired control cabinet.", quantity: 7, condition: "GOOD", location: "Controls Workshop", scrapDate: daysFromNow(8), estimatedValue: 3500 },
    { offeringUserId: bob.id, category: "SAFETY", itemName: "Fire Extinguishers", description: "CO2, serviced 6 months ago. Full charge.", quantity: 4, condition: "LIKE_NEW", location: "Safety Storage", scrapDate: daysFromNow(20), estimatedValue: 600 },
    { offeringUserId: alice.id, category: "ELECTRONICS", itemName: "Robotic Arm (educational)", description: "Dobot Magician, complete with accessories.", quantity: 1, condition: "GOOD", location: "Training Center", scrapDate: daysFromNow(10), estimatedValue: 4800 },
    { offeringUserId: dan.id, category: "ELECTRONICS", itemName: "Barcode Scanners", description: "Honeywell Xenon, USB wired.", quantity: 5, condition: "GOOD", location: "Warehouse Office", scrapDate: daysFromNow(5), estimatedValue: 900 },
    { offeringUserId: eve.id, category: "ELECTRONICS", itemName: "Microscope (stereo)", description: "Nikon SMZ745T, with trinocular head.", quantity: 1, condition: "LIKE_NEW", location: "QA Optical Bay", scrapDate: daysFromNow(16), estimatedValue: 5200 },
    { offeringUserId: carol.id, category: "VACUUM_GAS", itemName: "Air Compressor Filter Housings", description: "Spare inline filters, various sizes.", quantity: 6, condition: "LIKE_NEW", location: "Air Plant Room", scrapDate: daysFromNow(9), estimatedValue: 1100 },
    { offeringUserId: bob.id, category: "POWER_TOOL", itemName: "Cordless Drill Set", description: "Milwaukee M18 drills with batteries and charger.", quantity: 3, condition: "GOOD", location: "Maintenance Crib", scrapDate: daysFromNow(6), estimatedValue: 1800 },
    { offeringUserId: alice.id, category: "POWER_TOOL", itemName: "Angle Grinder + Discs", description: "Makita 125mm. Mixed discs (cutting, flap).", quantity: 2, condition: "GOOD", location: "Metal Shop", scrapDate: daysFromNow(5), estimatedValue: 700 },
    { offeringUserId: carol.id, category: "CABLE", itemName: "Heavy-gauge Power Cables", description: "4mm² THHN, red/black/green. ~150m total.", quantity: 3, condition: "LIKE_NEW", location: "Electrical Storeroom", scrapDate: daysFromNow(12), estimatedValue: 1400 },
  ];

  for (const data of offerData) {
    await prisma.offer.create({ data });
  }

  return { skipped: false, users: users.length, offers: offerData.length };
}
