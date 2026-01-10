const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seeding...');

    // 1. Create Admin User
    // Note: In production, passwords should be hashed (e.g., bcrypt). 
    // For this prototype, we match the simple logic in index.js.
    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: 'admin',
            name: 'Developer Mode',
            cro: 'DEV-001',
            role: 'admin',
        },
    });
    console.log(`✅ Created user: ${admin.username}`);

    const ana = await prisma.user.upsert({
        where: { username: 'Dra.Ana_Karolina@noeh.com.br' },
        update: {},
        create: {
            username: 'Dra.Ana_Karolina@noeh.com.br',
            password: 'admin',
            name: 'Ana Karolina',
            cro: 'CRO/MG 60.514',
            role: 'admin',
        },
    });
    console.log(`✅ Created user: ${ana.username}`);

    console.log(`✅ Created user: ${ana.username}`);

    // 2. Mock data removed for production. 
    // To add initial posts, uncomment or add them here.

    console.log('🏁 Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
