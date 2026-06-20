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
    subCategory: string;
    itemName: string;
    description: string;
    quantity: number;
    condition: "LIKE_NEW" | "GOOD" | "FAIR" | "POOR";
    location: string;
    scrapDate: Date;
    estimatedValue: number;
  }> = [
    // --- Wafer carriers & shipping ---
    {
      offeringUserId: alice.id,
      category: "FOUP",
      subCategory: "300mm",
      itemName: "Entegris 300mm FOUPs",
      description:
        "Entegris A300 series wafer carriers. No scratches on wafer seats, particle-clean.",
      quantity: 8,
      condition: "LIKE_NEW",
      location: "Fab B, Cleanroom Storage",
      scrapDate: daysFromNow(8),
      estimatedValue: 18000,
    },
    {
      offeringUserId: dan.id,
      category: "FOUP",
      subCategory: "300mm",
      itemName: "300mm FOUPs (used, particle-checked)",
      description:
        "Decommissioned from a stable tool line. Particle-checked, covers intact, no chemistry exposure.",
      quantity: 12,
      condition: "GOOD",
      location: "Cleanroom Bay 4",
      scrapDate: daysFromNow(3),
      estimatedValue: 15000,
    },
    {
      offeringUserId: carol.id,
      category: "FOSB",
      subCategory: "300mm",
      itemName: "FOSBs (sealed, unused)",
      description:
        "Sealed, unused 300mm Front-Opening Shipping Boxes for outbound wafer transit.",
      quantity: 20,
      condition: "LIKE_NEW",
      location: "Shipping Dock 2",
      scrapDate: daysFromNow(12),
      estimatedValue: 9000,
    },
    {
      offeringUserId: eve.id,
      category: "RETICLE",
      subCategory: "SMIF Pod (6\")",
      itemName: "Reticle SMIF Pods",
      description:
        "Entegris 6×6\" reticle SMIF pods. Particle-checked, suitable for active litho use.",
      quantity: 6,
      condition: "LIKE_NEW",
      location: "Litho Bay Storage",
      scrapDate: daysFromNow(14),
      estimatedValue: 7200,
    },
    {
      offeringUserId: eve.id,
      category: "WAFER",
      subCategory: "Blank Silicon (300mm)",
      itemName: "300mm Test Wafers",
      description:
        "Non-prime test silicon, 300mm. For dummy and handler-qualification use only.",
      quantity: 100,
      condition: "GOOD",
      location: "R&D Wafer Vault",
      scrapDate: daysFromNow(16),
      estimatedValue: 4500,
    },

    // --- Chamber & process parts ---
    {
      offeringUserId: carol.id,
      category: "CHAMBER",
      subCategory: "Showerhead",
      itemName: "CVD Showerhead Assemblies",
      description:
        "Aluminum showerhead assemblies pulled from a CVD chamber. Anodize wear; rebuild candidate.",
      quantity: 4,
      condition: "FAIR",
      location: "CVD Spares Area",
      scrapDate: daysFromNow(2),
      estimatedValue: 5600,
    },
    {
      offeringUserId: dan.id,
      category: "CHAMBER",
      subCategory: "ESC / Chuck",
      itemName: "Electrostatic Chuck (rebuild candidate)",
      description:
        "Electrostatic chuck removed during PM. Ceramic surface intact, suitable for refurbishment.",
      quantity: 2,
      condition: "FAIR",
      location: "Etch Spares Cage",
      scrapDate: daysFromNow(6),
      estimatedValue: 9000,
    },

    // --- Vacuum, gas, cleanroom ---
    {
      offeringUserId: dan.id,
      category: "VACUUM_GAS",
      subCategory: "Dry Pump",
      itemName: "Edwards iXL120 Dry Pump",
      description:
        "Dry vacuum pump, recent major service. Full maintenance log included.",
      quantity: 1,
      condition: "GOOD",
      location: "Sub-Fab Pump Bay",
      scrapDate: daysFromNow(9),
      estimatedValue: 18000,
    },
    {
      offeringUserId: carol.id,
      category: "VACUUM_GAS",
      subCategory: "MFC",
      itemName: "Mass Flow Controllers (mixed ranges)",
      description:
        "Horiba and Brooks MFCs, ranges 10 sccm – 10 slm. Recalibration recommended.",
      quantity: 14,
      condition: "GOOD",
      location: "Gas Panel Spares",
      scrapDate: daysFromNow(7),
      estimatedValue: 11000,
    },
    {
      offeringUserId: alice.id,
      category: "CLEANROOM",
      subCategory: "Coveralls",
      itemName: "Kimtech A8 Cleanroom Coveralls (sealed)",
      description:
        "Kimtech A8 cleanroom coveralls, sealed packs, sizes M/L/XL mixed.",
      quantity: 40,
      condition: "LIKE_NEW",
      location: "Gowning Room B",
      scrapDate: daysFromNow(18),
      estimatedValue: 3200,
    },

    // --- Electronics & IT ---
    {
      offeringUserId: bob.id,
      category: "ELECTRONICS",
      subCategory: "Monitor",
      itemName: "Dell P2419H 24\" Monitors",
      description:
        "Dell P2419H 24-inch IPS monitors. All tested, surplus from an office refresh.",
      quantity: 10,
      condition: "GOOD",
      location: "Building 4, Storage A",
      scrapDate: daysFromNow(5),
      estimatedValue: 6000,
    },
    {
      offeringUserId: alice.id,
      category: "ELECTRONICS",
      subCategory: "Network Gear",
      itemName: "Cisco Catalyst 2960 Switches (48-port)",
      description:
        "Cisco Catalyst 2960 48-port switches, decommissioned. Licenses not included.",
      quantity: 4,
      condition: "GOOD",
      location: "Server Room B",
      scrapDate: daysFromNow(5),
      estimatedValue: 4000,
    },
    {
      offeringUserId: eve.id,
      category: "ELECTRONICS",
      subCategory: "Test Equipment",
      itemName: "Tektronix TDS 2024B Oscilloscope",
      description:
        "Tektronix TDS 2024B 200 MHz scope. Calibration expired but fully functional.",
      quantity: 1,
      condition: "GOOD",
      location: "R&D Lab 1",
      scrapDate: daysFromNow(13),
      estimatedValue: 2400,
    },
    {
      offeringUserId: carol.id,
      category: "ELECTRONICS",
      subCategory: "Controller / PLC",
      itemName: "Siemens S7-300 PLC Modules",
      description:
        "Siemens S7-300 I/O cards, mixed types. Pulled from a retired control cabinet.",
      quantity: 7,
      condition: "GOOD",
      location: "Controls Workshop",
      scrapDate: daysFromNow(10),
      estimatedValue: 3500,
    },

    // --- Motors, tools, office, handling, safety, cable ---
    {
      offeringUserId: eve.id,
      category: "MOTOR",
      subCategory: "Electric Motor",
      itemName: "3-phase 5 HP Electric Motors",
      description:
        "3-phase 5 HP induction motors, bench-tested last week. Mounting feet included.",
      quantity: 2,
      condition: "GOOD",
      location: "Building 1, Basement",
      scrapDate: daysFromNow(4),
      estimatedValue: 8000,
    },
    {
      offeringUserId: bob.id,
      category: "POWER_TOOL",
      subCategory: "Drill",
      itemName: "Milwaukee M18 Cordless Drill Set",
      description:
        "Milwaukee M18 cordless drills with batteries, charger, and storage case.",
      quantity: 3,
      condition: "GOOD",
      location: "Maintenance Crib",
      scrapDate: daysFromNow(1),
      estimatedValue: 1800,
    },
    {
      offeringUserId: alice.id,
      category: "OFFICE",
      subCategory: "Chair",
      itemName: "Ergonomic Mesh Office Chairs",
      description:
        "Ergonomic mesh task chairs, lumbar support, adjustable arms. Bought 6 months ago.",
      quantity: 3,
      condition: "LIKE_NEW",
      location: "Building 2, 3rd Floor",
      scrapDate: daysFromNow(11),
      estimatedValue: 4500,
    },
    {
      offeringUserId: dan.id,
      category: "MATERIAL_HANDLING",
      subCategory: "Shelving",
      itemName: "Heavy-Duty Steel Shelving Units",
      description:
        "Heavy-duty 2 m steel shelving units, 4 shelves each. Bolted assembly.",
      quantity: 6,
      condition: "GOOD",
      location: "Warehouse Zone 2",
      scrapDate: daysFromNow(8),
      estimatedValue: 2400,
    },
    {
      offeringUserId: bob.id,
      category: "SAFETY",
      subCategory: "Fire Extinguisher",
      itemName: "CO₂ Fire Extinguishers",
      description:
        "CO₂ extinguishers, fully charged, serviced in the last 6 months.",
      quantity: 4,
      condition: "LIKE_NEW",
      location: "Safety Storage",
      scrapDate: daysFromNow(17),
      estimatedValue: 600,
    },
    {
      offeringUserId: bob.id,
      category: "CABLE",
      subCategory: "Network",
      itemName: "CAT6 Cable Reels",
      description:
        "Riser-rated CAT6 cable on partial spools. Approximately 200 m total remaining.",
      quantity: 5,
      condition: "LIKE_NEW",
      location: "Building 3, IT Closet",
      scrapDate: daysFromNow(15),
      estimatedValue: 1200,
    },
  ];

  for (const data of offerData) {
    await prisma.offer.create({ data });
  }

  return { skipped: false, users: users.length, offers: offerData.length };
}
