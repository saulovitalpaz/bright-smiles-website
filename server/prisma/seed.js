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

    // 2. Create Initial Blog Posts (Sample Data)
    const post1 = await prisma.post.upsert({
        where: { slug: 'harmonizacao-facial-rejuvenescimento' },
        update: {},
        create: {
            slug: "harmonizacao-facial-rejuvenescimento",
            title: "Como a Harmonização Facial pode rejuvenescer seu sorriso",
            excerpt: "Descubra como procedimentos como preenchimento labial e rinomodelação complementam os tratamentos odontológicos para um resultado natural.",
            category: "Harmonização",
            date: new Date("2026-01-08"),
            readTime: "5 min",
            image: "/images/botox/Botox (2).jpg",
            images: [
                "/images/botox/Botox (2).jpg",
                "/images/botox/Botox (3).jpg"
            ],
            author: "Dra. Ana Karolina",
            content: "A harmonização facial não é apenas sobre aplicar produtos...",
        }
    });
    console.log(`✅ Created post: ${post1.title}`);

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
