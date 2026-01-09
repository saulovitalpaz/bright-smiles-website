export interface Treatment {
    slug: string;
    title: string;
    description: string;
    category: "Odontologia" | "Harmonização";
    image: string; // Featured image
    images: string[]; // Gallery images
    content: string;
    indications: string[];
    benefits: string[];
    duration: {
        procedure: string;
        recovery: string;
        results: string;
        longevity: string;
    };
}

export const treatments: Treatment[] = [
    {
        slug: "bruxismo",
        title: "Bruxismo e Placa Miorrelaxante",
        description: "Tratamento especializado para ranger de dentes com placas personalizadas e relaxamento muscular.",
        category: "Odontologia",
        image: "/images/odonto/tratamento-bruxismo.png",
        images: [
            "/images/odonto/tratamento-bruxismo.png",
            "/images/odonto/placa-miorrelaxante.png"
        ],
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
            results: "Imediato (placa) / 7-14 dias (botox)",
            longevity: "Placa (conforme desgaste) / Botox (4-6 meses)"
        }
    },
    {
        slug: "preenchimento-labial",
        title: "Preenchimento Labial",
        description: "Volume e contorno labial com ácido hialurônico para resultados naturais e harmônicos.",
        category: "Harmonização",
        image: "/images/preenchimento/preenchimento - hialuronico (1).jpg",
        images: [
            "/images/preenchimento/preenchimento - hialuronico (1).jpg",
            "/images/preenchimento/preenchimento - hialuronico (2).jpg",
            "/images/preenchimento/preenchimento - hialuronico (3).jpg",
            "/images/preenchimento/preenchimento - hialuronico (4).jpg",
            "/images/preenchimento/preenchimento - hialuronico (5).jpg",
            "/images/preenchimento/preenchimento - hialuronico (6).jpg",
            "/images/preenchimento/preenchimento - hialuronico (7).jpg",
            "/images/preenchimento/preenchimento - hialuronico (8).jpg",
            "/images/preenchimento/preenchimento - hialuronico (9).jpg",
            "/images/preenchimento/preenchimento - hialuronico (10).jpg",
            "/images/preenchimento/preenchimento - hialuronico (11).jpg"
        ],
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
            results: "Imediato",
            longevity: "8-12 meses"
        }
    },
    {
        slug: "toxina-botulinica",
        title: "Toxina Botulínica (Botox)",
        description: "Suavização de linhas de expressão e prevenção de rugas para uma aparência rejuvenescida.",
        category: "Harmonização",
        image: "/images/botox/Botox (1).jpg",
        images: [
            "/images/botox/Botox (1).jpg",
            "/images/botox/Botox (2).jpg",
            "/images/botox/Botox (3).jpg",
            "/images/botox/Botox (4).jpg",
            "/images/botox/Botox (5).jpg",
            "/images/botox/Botox (6).jpg",
            "/images/botox/Botox (7).jpg",
            "/images/botox/Botox (8).jpg",
            "/images/botox/Botox (9).jpg",
            "/images/botox/Botox (10).jpg",
            "/images/botox/Botox (11).jpg",
            "/images/botox/Botox (12).jpg",
            "/images/botox/Botox (13).jpg",
            "/images/botox/Botox (14).jpg",
            "/images/botox/Botox (15).jpg",
            "/images/botox/Botox (16).jpg",
            "/images/botox/Botox (17).jpg",
            "/images/botox/Botox (18).jpg",
            "/images/botox/Botox (19).jpg",
            "/images/botox/Botox (20).jpg"
        ],
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
            results: "3-7 dias (pico em 14 dias)",
            longevity: "4-6 meses"
        }
    },
    {
        slug: "implantes-dentarios",
        title: "Implantes Dentários",
        description: "Recuperação permanente da função mastigatória e estética com pinos de titânio.",
        category: "Odontologia",
        image: "/images/odonto/implante-dentario.png",
        images: [
            "/images/odonto/implante-dentario.png"
        ],
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
            results: "Após osseointegração (3-6 meses)",
            longevity: "Pode durar a vida toda"
        }
    },
    {
        slug: "proteses",
        title: "Reabilitação Protética",
        description: "Próteses fixas, removíveis e sobre implantes com tecnologia de fluxo digital.",
        category: "Odontologia",
        image: "/images/odonto/protese-dentaria.png",
        images: [
            "/images/odonto/protese-dentaria.png"
        ],
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
            results: "Finalização do caso",
            longevity: "10-15 anos com manutenção"
        }
    },
    {
        slug: "bioestimuladores",
        title: "Bioestimuladores de Colágeno",
        description: "Estímulo natural de colágeno para firmeza, viço e sustentação da pele.",
        category: "Harmonização",
        image: "/images/bioestimulador/Bioestimulador (1).jpg",
        images: [
            "/images/bioestimulador/Bioestimulador (1).jpg",
            "/images/bioestimulador/Bioestimulador (2).jpg",
            "/images/bioestimulador/Bioestimulador (3).jpg",
            "/images/bioestimulador/Bioestimulador (4).jpg",
            "/images/bioestimulador/Bioestimulador (5).jpg",
            "/images/bioestimulador/Bioestimulador (6).jpg",
            "/images/bioestimulador/Bioestimulador (7).jpg",
            "/images/bioestimulador/Bioestimulador (8).jpg",
            "/images/bioestimulador/Bioestimulador (9).jpg",
            "/images/bioestimulador/Bioestimulador (10).jpg",
            "/images/bioestimulador/Bioestimulador (11).jpg",
            "/images/bioestimulador/Bioestimulador (12).jpg",
            "/images/bioestimulador/Bioestimulador (13).jpg"
        ],
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
            results: "Progressivo (4-8 semanas)",
            longevity: "18-24 meses"
        }
    }
];
