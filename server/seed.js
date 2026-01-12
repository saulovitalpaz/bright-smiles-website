const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

const treatments = [
    {
        slug: "bruxismo",
        title: "Bruxismo e Placa Miorrelaxante",
        description: "Tratamento especializado para ranger de dentes com placas personalizadas e relaxamento muscular.",
        category: "Odontologia",
        image: "/images/odonto/tratamento-bruxismo.png",
        content: "O bruxismo é o hábito involuntário de ranger ou apertar os dentes, geralmente durante o sono. Nosso tratamento envolve a confecção de placas miorrelaxantes personalizadas de alta precisão e, em casos específicos, a aplicação de toxina botulínica para relaxamento muscular, protegendo seus dentes e aliviando dores orofaciais.",
        indications: [
            "Ranger de dentes durante o sono",
            "Dor na mandíbula ao acordar",
            "Dor de cabeça frequente",
            "Desgaste dentário visível",
            "Tensão muscular facial"
        ],
        benefits: [
            "Proteção dos dentes contra desgaste",
            "Redução de dores de cabeça",
            "Alívio de tensão muscular",
            "Melhora da qualidade do sono",
            "Prevenção de danos dentários"
        ],
        duration: {
            procedure: "60-90 minutos (moldagem/ajuste)",
            recovery: "Imediata",
            longevity: "Placa (conforme desgaste) / Botox (4-6 meses)"
        },
        results: [
            { image: "/images/odonto/tratamento-bruxismo.png", description: "Resultado de tratamento de bruxismo" },
            { image: "/images/odonto/placa-miorrelaxante.png", description: "Placa miorrelaxante personalizada" }
        ]
    },
    {
        slug: "preenchimento-labial",
        title: "Preenchimento Labial",
        description: "Volume e contorno labial com ácido hialurônico para resultados naturais e harmônicos.",
        category: "Harmonização",
        image: "/images/preenchimento/preenchimento - hialuronico (1).jpg",
        content: "O preenchimento labial é um procedimento estético que utiliza ácido hialurônico para aumentar o volume e definir o contorno dos lábios. O foco é sempre em resultados naturais, respeitando as proporções do seu rosto e proporcionando hidratação profunda.",
        indications: [
            "Pessoas que desejam lábios mais volumosos",
            "Quem busca contorno labial mais definido",
            "Lábios finos ou assimétricos",
            "Perda de volume devido ao envelhecimento",
            "Hidratação profunda dos lábios"
        ],
        benefits: [
            "Volume natural e proporcional ao rosto",
            "Contorno labial definido",
            "Hidratação profunda e duradoura",
            "Resultados personalizados",
            "Procedimento rápido"
        ],
        duration: {
            procedure: "30-45 minutos",
            recovery: "2-3 dias (edema leve)",
            longevity: "8-12 meses"
        },
        results: [
            { image: "/images/preenchimento/preenchimento - hialuronico (1).jpg", description: "Resultado 1" },
            { image: "/images/preenchimento/preenchimento - hialuronico (2).jpg", description: "Resultado 2" },
            { image: "/images/preenchimento/preenchimento - hialuronico (3).jpg", description: "Resultado 3" }
        ]
    },
    {
        slug: "toxina-botulinica",
        title: "Toxina Botulínica (Botox)",
        description: "Suavização de linhas de expressão e prevenção de rugas para uma aparência rejuvenescida.",
        category: "Harmonização",
        image: "/images/botox/Botox (1).jpg",
        content: "A toxina botulínica é amplamente utilizada para suavizar linhas de expressão na testa, 'pés de galinha' e entre as sobrancelhas. Além do uso estético preventivo, também possui excelentes aplicações terapêuticas para bruxismo e sorriso gengival.",
        indications: [
            "Linhas de expressão na testa",
            "Pés de galinha",
            "Linhas entre as sobrancelhas",
            "Prevenção de rugas profundas",
            "Bruxismo e Sorriso Gengival"
        ],
        benefits: [
            "Suavização de marcas de expressão",
            "Aparência descansada e jovem",
            "Prevenção do envelhecimento precoce",
            "Sem tempo de inatividade",
            "Alta taxa de satisfação"
        ],
        duration: {
            procedure: "15-30 minutos",
            recovery: "Imediata",
            longevity: "4-6 meses"
        },
        results: [
            { image: "/images/botox/Botox (1).jpg", description: "Caso 1" },
            { image: "/images/botox/Botox (2).jpg", description: "Caso 2" }
        ]
    },
    {
        slug: "implantes-dentarios",
        title: "Implantes Dentários",
        description: "Recuperação permanente da função mastigatória e estética com pinos de titânio.",
        category: "Odontologia",
        image: "/images/odonto/implante-dentario.png",
        content: "Os implantes dentários são a solução padrão-ouro para a substituição de dentes perdidos. Envolvem a instalação de pequenos pinos de titânio no osso que funcionam como raízes artificiais, oferecendo suporte estável para coroas de cerâmica, devolvendo a segurança ao comer e sorrir.",
        indications: [
            "Perda de um ou mais dentes",
            "Dentes condenados",
            "Uso de próteses removíveis desconfortáveis",
            "Desejo de solução fixa e permanente"
        ],
        benefits: [
            "Solução permanente e fixa",
            "Aparência e função naturais",
            "Preservação do osso alveolar",
            "Não desgasta dentes vizinhos",
            "Alta taxa de sucesso"
        ],
        duration: {
            procedure: "30-60 minutos por implante",
            recovery: "3-7 dias",
            longevity: "Pode durar a vida toda"
        },
        results: [
            { image: "/images/odonto/implante-dentario.png", description: "Implante concluído" }
        ]
    },
    {
        slug: "proteses",
        title: "Reabilitação Protética",
        description: "Próteses fixas, removíveis e sobre implantes com tecnologia de fluxo digital.",
        category: "Odontologia",
        image: "/images/odonto/protese-dentaria.png",
        content: "A Dra. Ana Karolina é especialista em Prótese e Implantes pela São Leopoldo Mandic. Realizamos reabilitações completas, desde coroas unitárias e facetas em porcelana até protocolos sobre implantes, utilizando tecnologia de fluxo digital para máxima precisão e estética.",
        indications: [
            "Ausência de dentes",
            "Dentes com grandes restaurações",
            "Necessidade de correção estética e funcional",
            "Desgastes severos"
        ],
        benefits: [
            "Restauração da função mastigatória",
            "Melhora significativa da estética",
            "Recuperação da autoestima",
            "Tecnologia de ponta (fluxo digital)",
            "Materiais de alta durabilidade"
        ],
        duration: {
            procedure: "2-6 semanas (projeto/provas)",
            recovery: "1-2 semanas de adaptação",
            longevity: "10-15 anos com manutenção"
        },
        results: [
            { image: "/images/odonto/protese-dentaria.png", description: "Prótese de alta qualidade" }
        ]
    },
    {
        slug: "bioestimuladores",
        title: "Bioestimuladores de Colágeno",
        description: "Estímulo natural de colágeno para firmeza, viço e sustentação da pele.",
        category: "Harmonização",
        image: "/images/bioestimulador/Bioestimulador (1).jpg",
        content: "Os bioestimuladores são substâncias aplicadas na pele para estimular a produção natural de colágeno pelo próprio corpo. É un tratamento progressivo que promove o rejuvenescimento de dentro para fora, tratando a flacidez e melhorando a qualidade geral da pele.",
        indications: [
            "Flacidez facial leve a moderada",
            "Perda de volume e sustentação",
            "Pele sem viço e brilho",
            "Envelhecimento natural da pele"
        ],
        benefits: [
            "Estímulo natural de colágeno",
            "Firmeza e sustentação progressiva",
            "Melhora da textura da pele",
            "Efeito muito natural",
            "Rejuvenescimento duradouro"
        ],
        duration: {
            procedure: "30-45 minutos",
            recovery: "2-3 dias (leve inchaço)",
            longevity: "18-24 meses"
        },
        results: [
            { image: "/images/bioestimulador/Bioestimulador (1).jpg", description: "Resultado progressivo" }
        ]
    }
];

const blogPosts = [
    {
        slug: "harmonizacao-facial-rejuvenescimento",
        title: "Como a Harmonização Facial pode rejuvenescer seu sorriso",
        excerpt: "Descubra como procedimentos como preenchimento labial e rinomodelação complementam os tratamentos odontológicos para um resultado natural.",
        category: "Harmonização",
        date: new Date("2026-01-08"),
        readTime: "5 min",
        image: "/images/botox/Botox (2).jpg",
        images: [
            "/images/botox/Botox (2).jpg",
            "/images/botox/Botox (3).jpg",
            "/images/preenchimento/preenchimento - hialuronico (10).jpg",
            "/images/preenchimento/preenchimento - hialuronico (11).jpg"
        ],
        author: "Dra. Ana Karolina",
        content: "A harmonização facial não é apenas sobre aplicar produtos, mas sobre entender a simetria e a beleza única de cada rosto. Quando combinamos procedimentos como toxina botulínica e preenchimento com ácido hialurônico, conseguimos suavizar linhas de expressão e realçar traços naturais, criando um sorriso muito mais harmônico e uma aparência descansada.",
        references: [
            {
                title: "Hyaluronic acid filler injections for facial rejuvenation",
                authors: "Pavicic T, Gauglitz GG",
                journal: "Clinics in Dermatology",
                year: "2016",
                url: "https://pubmed.ncbi.nlm.nih.gov/26686017/"
            }
        ]
    }
];

const users = [
    {
        username: "Suporte Admin",
        password: "Support@NOEH2026!",
        name: "Suporte Técnico",
        role: "admin",
        cro: "Saulo"
    },
    {
        username: "Dra. Ana Karolina",
        password: "Ana#NOEH2026!",
        name: "Ana Karolina",
        role: "admin",
        cro: "CRO/MG 60.514"
    },
    {
        username: "Dra. Clara Lima",
        password: "Clara#NOEH2026!",
        name: "Clara Lima",
        role: "admin",
        cro: "CRO/MG 60.369"
    }
];

async function main() {
    console.log('Seeding database...');

    // Clear existing data (optional, but good for reset)
    await prisma.treatmentResult.deleteMany({});
    await prisma.treatment.deleteMany({});
    await prisma.post.deleteMany({});
    // Não deletamos usuários admin para evitar bloqueio, mas podemos garantir que eles existam
    // Se quiser resetar users também: await prisma.user.deleteMany({});


    for (const t of treatments) {
        const { results, ...treatmentData } = t;
        const createdTreatment = await prisma.treatment.create({
            data: treatmentData
        });

        if (results && results.length > 0) {
            for (const r of results) {
                await prisma.treatmentResult.create({
                    data: {
                        ...r,
                        treatmentId: createdTreatment.id
                    }
                });
            }
        }
    }

    for (const post of blogPosts) {
        await prisma.post.create({
            data: post
        });
    }

    console.log('Seeding users...');
    for (const u of users) {
        await prisma.user.upsert({
            where: { username: u.username },
            update: u, // Agora força a atualização dos dados (incluindo senha) se o username já existir
            create: u
        });
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
