export interface Post {
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    category: string;
    date: string;
    readTime: string;
    image: string; // Featured
    images: string[]; // Gallery
    author: string;
}

export const blogPosts: Post[] = [
    {
        slug: "harmonizacao-facial-rejuvenescimento",
        title: "Como a Harmonização Facial pode rejuvenescer seu sorriso",
        excerpt: "Descubra como procedimentos como preenchimento labial e rinomodelação complementam os tratamentos odontológicos para um resultado natural.",
        category: "Harmonização",
        date: "08 Jan 2026",
        readTime: "5 min",
        image: "/images/botox/Botox (2).jpg",
        images: [
            "/images/botox/Botox (2).jpg",
            "/images/botox/Botox (3).jpg",
            "/images/preenchimento/preenchimento - hialuronico (10).jpg",
            "/images/preenchimento/preenchimento - hialuronico (11).jpg"
        ],
        author: "Dra. Ana Karolina",
        content: "A harmonização facial não é apenas sobre aplicar produtos, mas sobre entender a simetria e a beleza única de cada rosto. Quando combinamos procedimentos como toxina botulínica e preenchimento com ácido hialurônico, conseguimos suavizar linhas de expressão e realçar traços naturais, criando um sorriso muito mais harmônico e uma aparência descansada."
    },
    {
        slug: "causas-sintomas-bruxismo",
        title: "Bruxismo: causas, sintomas e tratamentos modernos",
        excerpt: "O bruxismo afeta milhões de brasileiros. Entenda como identificar os sinais e quais tratamentos podem ajudar a proteger seus dentes.",
        category: "Saúde Bucal",
        date: "05 Jan 2026",
        readTime: "4 min",
        image: "/images/odonto/placa-miorrelaxante.png",
        images: [
            "/images/odonto/placa-miorrelaxante.png",
            "/images/odonto/tratamento-bruxismo.png"
        ],
        author: "Dra. Ana Karolina",
        content: "Você costuma acordar com dor na mandíbula ou de cabeça? Pode ser bruxismo. Este hábito de prender ou ranger os dentes impacta severamente a saúde bucal. No nosso consultório, utilizamos placas personalizadas e técnicas de relaxamento muscular que evitam o desgaste dos dentes e devolvem a qualidade do seu sono."
    },
    {
        slug: "saude-bucal-autoestima",
        title: "A importância da saúde bucal para sua autoestima",
        excerpt: "Um sorriso saudável impacta diretamente na sua confiança. Saiba como cuidados simples podem transformar sua qualidade de vida.",
        category: "Bem-estar",
        date: "02 Jan 2026",
        readTime: "3 min",
        image: "/images/odonto/logo ana karolina.png",
        images: [
            "/images/odonto/logo ana karolina.png"
        ],
        author: "Dra. Ana Karolina",
        content: "Sorrir com confiança abre portas. A saúde bucal vai muito além da estética, afetando nossa saúde geral e bem-estar psicológico. Manter as consultas de rotina em dia e investir em tratamentos reabilitadores é investir em você mesma."
    },
];
