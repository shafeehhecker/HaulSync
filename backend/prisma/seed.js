const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding HaulSync database...');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('Admin@1234', 10);

  const adminCompany = await prisma.company.upsert({
    where: { id: 'seed-company-001' },
    update: {},
    create: {
      id: 'seed-company-001',
      name: 'HaulSync Demo Corp',
      type: 'SHIPPER',
      gstin: '29ABCDE1234F1Z5',
      city: 'Bangalore',
      state: 'Karnataka',
      phone: '9876543210',
      email: 'info@haulsyncdemo.com',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@haulsync.local' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@haulsync.local',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      companyId: adminCompany.id,
    },
  });

  // Seed transporter companies
  const transporter1 = await prisma.company.upsert({
    where: { id: 'seed-trans-001' },
    update: {},
    create: {
      id: 'seed-trans-001',
      name: 'FastMove Logistics',
      type: 'TRANSPORTER',
      city: 'Mumbai',
      state: 'Maharashtra',
      phone: '9111122222',
      email: 'ops@fastmove.in',
    },
  });

  const transporter2 = await prisma.company.upsert({
    where: { id: 'seed-trans-002' },
    update: {},
    create: {
      id: 'seed-trans-002',
      name: 'SafeCargo Express',
      type: 'TRANSPORTER',
      city: 'Delhi',
      state: 'Delhi',
      phone: '9222233333',
      email: 'info@safecargo.in',
    },
  });

  // Seed transporter users
  const tpHash = await bcrypt.hash('Trans@1234', 10);
  await prisma.user.upsert({
    where: { email: 'transporter@haulsync.local' },
    update: {},
    create: {
      name: 'Transport Manager',
      email: 'transporter@haulsync.local',
      password: tpHash,
      role: 'TRANSPORTER',
      companyId: transporter1.id,
    },
  });

  // Seed goods types
  const goods = ['General Cargo', 'FMCG', 'Pharmaceuticals', 'Electronics', 'Automobiles', 'Chemicals', 'Steel', 'Food & Beverages'];
  for (const g of goods) {
    await prisma.goodsType.upsert({
      where: { name: g },
      update: {},
      create: { name: g, isHazardous: g === 'Chemicals' },
    });
  }

  // Seed routes
  const routes = [
    { name: 'Bangalore → Mumbai', originCity: 'Bangalore', originState: 'Karnataka', destCity: 'Mumbai', destState: 'Maharashtra', distanceKm: 984, estimatedDays: 2 },
    { name: 'Delhi → Kolkata', originCity: 'Delhi', originState: 'Delhi', destCity: 'Kolkata', destState: 'West Bengal', distanceKm: 1472, estimatedDays: 3 },
    { name: 'Mumbai → Chennai', originCity: 'Mumbai', originState: 'Maharashtra', destCity: 'Chennai', destState: 'Tamil Nadu', distanceKm: 1338, estimatedDays: 3 },
    { name: 'Hyderabad → Pune', originCity: 'Hyderabad', originState: 'Telangana', destCity: 'Pune', destState: 'Maharashtra', distanceKm: 560, estimatedDays: 1 },
  ];

  for (const r of routes) {
    await prisma.route.upsert({
      where: { id: `route-${r.originCity.toLowerCase()}-${r.destCity.toLowerCase()}` },
      update: {},
      create: { id: `route-${r.originCity.toLowerCase()}-${r.destCity.toLowerCase()}`, ...r },
    });
  }

  // Seed vehicles
  const vehicles = [
    { registrationNo: 'KA01AB1234', type: 'TRUCK', capacity: 10, make: 'Tata', model: 'LPT 1613', companyId: transporter1.id },
    { registrationNo: 'MH02CD5678', type: 'TRAILER', capacity: 25, make: 'Ashok Leyland', model: 'U-Truck 3118', companyId: transporter1.id },
    { registrationNo: 'DL03EF9012', type: 'CONTAINER', capacity: 20, make: 'Tata', model: 'Prima 4928', companyId: transporter2.id },
  ];

  for (const v of vehicles) {
    await prisma.vehicle.upsert({
      where: { registrationNo: v.registrationNo },
      update: {},
      create: { ...v, insuranceExpiry: new Date('2025-12-31'), pucExpiry: new Date('2025-06-30') },
    });
  }

  // Seed drivers
  const drivers = [
    { name: 'Ramesh Kumar', phone: '9500011111', licenseNo: 'KA0120210001234', companyId: transporter1.id },
    { name: 'Suresh Singh', phone: '9500022222', licenseNo: 'MH0220190005678', companyId: transporter1.id },
    { name: 'Mahesh Yadav', phone: '9500033333', licenseNo: 'DL0320220009012', companyId: transporter2.id },
  ];

  for (const d of drivers) {
    await prisma.driver.upsert({
      where: { phone: d.phone },
      update: {},
      create: { ...d, licenseExpiry: new Date('2028-01-01') },
    });
  }

  console.log('✅ Seeding complete!');
  console.log('');
  console.log('🔑 Default credentials:');
  console.log('   Admin:       admin@haulsync.local       / Admin@1234');
  console.log('   Transporter: transporter@haulsync.local / Trans@1234');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
