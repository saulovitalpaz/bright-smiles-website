/**
 * SYSTEM DATA CONFIGURATION
 *
 * Edit this object to update the documentation.
 * The system will automatically render the sidebar and content based on this structure.
 */
const DOCS_DATA = {
    meta: {
        title: "Dental Website Ecosystem",
        version: "1.0.0",
        lastUpdated: "05 Jan 2026",
        status: "Production Ready",
    },
    sections: [
        {
            id: "executive-summary",
            title: "Visão Geral",
            icon: "activity",
            subsections: [
                { id: "sub-01", num: "01", title: "O Que o Sistema Faz" },
                { id: "sub-02", num: "02", title: "Como Funciona na Prática" },
                { id: "sub-03", num: "03", title: "Mapa de Funcionalidades" },
                { id: "sub-04", num: "04", title: "Benefícios Estratégicos" }
            ],
            content: `
                <!-- Hero Section -->
                <div style="margin-bottom: 2.5rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                        <div style="width: 48px; height: 48px; background: var(--accent); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm);">
                            <span style="font-size: 1.5rem;">🦷</span>
                        </div>
                        <div>
                            <h1 style="margin: 0; font-size: 1.75rem;">NOEH - Núcleo Odontológico Especializado e Harmonização</h1>
                            <div style="font-size: 0.75rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em;">Documentação do Sistema</div>
                        </div>
                    </div>
                    
                    <p style="font-size: 1.125rem; color: var(--text-secondary); line-height: 1.7; margin-bottom: 1.5rem;">
                        <strong style="color: var(--text-primary);">Este é apenas um site para estabelecer escopo de criação, </strong> para criar uma plataforma digital completa para <strong style="color: var(--accent);">atrair pacientes</strong>, <strong style="color: var(--accent);">gerenciar conteúdo</strong>, <strong style="color: var(--accent);">rastrear resultados</strong> de marketing e <strong style="color: var(--accent);">abranger a nova geração de clientes jovens</strong>, que utilizam redes sociais para buscar informações, como tiktok, e agendamentos com instagram.
                    </p>
                </div>

                <!-- Status Cards -->
                <div class="card-grid">
                    <div class="stat-card">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.375rem;">
                            <span style="font-size: 1rem;">✅</span>
                            <div class="label" style="margin: 0;">Status</div>
                        </div>
                        <div class="value success">Pronto para Uso</div>
                    </div>
                    <div class="stat-card">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.375rem;">
                            <span style="font-size: 1rem;">⚡</span>
                            <div class="label" style="margin: 0;">Stack</div>
                        </div>
                        <div class="value">Next.js 15 + Prisma</div>
                    </div>
                    <div class="stat-card">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.375rem;">
                            <span style="font-size: 1rem;">🎯</span>
                            <div class="label" style="margin: 0;">Foco</div>
                        </div>
                        <div class="value">Publicidade e Captação de Leads</div>
                    </div>
                </div>

                <h2 id="sub-01"><span style="color: var(--accent);">01.</span> O Que Este Sistema Faz Por Você?</h2>
                <p>Pense neste sistema como três ferramentas integradas em uma única plataforma:</p>
                
                <div class="feature-block">
                    <h3 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-tertiary); font-weight: 600; margin-bottom: 0.5rem;">🎯 CAPTAÇÃO INTELIGENTE DE PACIENTES</h3>
                    
                    <p style="font-size: 1.25rem; font-weight: 600; color: var(--text-primary); line-height: 1.4; margin-bottom: 1.25rem;">"Saiba exatamente de onde vêm seus pacientes."</p>
                    
                    <!-- Antes / Depois -->
                    <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 1.5rem; align-items: center; margin-bottom: 2rem;">
                        <div style="background: var(--bg-hover); padding: 1.5rem; border-radius: var(--radius-md); text-align: center; border: 1px solid var(--border);">
                            <div style="font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-tertiary); font-weight: 600; margin-bottom: 0.5rem;">😕 Antes</div>
                            <div style="font-size: 0.875rem; color: var(--text-secondary);">"De onde veio esse paciente?"</div>
                        </div>
                        <div style="font-size: 1.25rem; color: var(--text-tertiary); font-weight: 300;">→</div>
                        <div style="background: #FFFBEB; padding: 1.5rem; text-align: center; border-radius: var(--radius-md); border: 1px solid #FCD34D;">
                            <div style="font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #D97706; font-weight: 700; margin-bottom: 0.5rem;">✅ Depois</div>
                            <div style="font-size: 0.875rem; color: var(--text-primary); font-weight: 600;">"70% vieram do Google Ads!"</div>
                        </div>
                    </div>
                    
                    <!-- Lista com Collapsibles -->
                    <div style="border-top: 1px solid var(--border); padding-top: 1rem;">
                        <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-tertiary); margin-bottom: 0.625rem;">O QUE O SISTEMA REGISTRA: <span style="font-weight: 400; font-style: italic;">(clique para detalhes)</span></div>
                        
                        <div class="collapsible-item">
                            <button class="collapsible-trigger" onclick="this.parentElement.classList.toggle('open')">
                                <span class="bullet"></span>
                                <span>Nome, telefone e e-mail do paciente</span>
                                <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                            </button>
                            <div class="collapsible-content">
                                <div class="collapsible-inner">
                                    <strong>Como funciona:</strong> Quando o paciente preenche o formulário de contato no site, esses dados são enviados para um banco de dados seguro (PostgreSQL). O sistema valida automaticamente o formato do telefone e e-mail antes de salvar.<br><br>
                                    <strong>Onde você visualiza:</strong> No <code>Painel Admin → Leads</code>, todos os contatos aparecem em uma lista organizada por data, com filtros por status (novo, contactado, convertido).
                                </div>
                            </div>
                        </div>
                        
                        <div class="collapsible-item">
                            <button class="collapsible-trigger" onclick="this.parentElement.classList.toggle('open')">
                                <span class="bullet"></span>
                                <span>Origem: Google Ads, Instagram, Facebook, indicação</span>
                                <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                            </button>
                            <div class="collapsible-content">
                                <div class="collapsible-inner">
                                    <strong>Como funciona:</strong> O sistema captura automaticamente parâmetros da URL chamados "UTM". Quando você cria um anúncio no Google ou Instagram, é possível adicionar esses parâmetros ao link. Exemplo: <code>?utm_source=instagram&utm_medium=stories</code><br><br>
                                    <strong>Parâmetros capturados:</strong> <code>utm_source</code> (de onde veio), <code>utm_medium</code> (tipo de mídia), <code>utm_campaign</code> (nome da campanha), <code>gclid</code> (Google Ads), <code>fbclid</code> (Facebook/Instagram).<br><br>
                                    <strong>Sem configuração extra:</strong> Basta usar links com UTM nos seus anúncios — o sistema faz o resto automaticamente.
                                </div>
                            </div>
                        </div>
                        
                        <div class="collapsible-item">
                            <button class="collapsible-trigger" onclick="this.parentElement.classList.toggle('open')">
                                <span class="bullet"></span>
                                <span>Qual campanha ou anúncio específico trouxe o contato</span>
                                <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                            </button>
                            <div class="collapsible-content">
                                <div class="collapsible-inner">
                                    <strong>Como funciona:</strong> O parâmetro <code>utm_campaign</code> permite nomear cada campanha. Exemplo: se você está promovendo "Bruxismo em Janeiro", usa <code>utm_campaign=bruxismo-janeiro-2026</code>.<br><br>
                                    <strong>Exemplo prático:</strong> Você verá no painel: "Maria Silva — Google Ads — Campanha: bruxismo-janeiro-2026". Assim você sabe exatamente qual anúncio converteu.<br><br>
                                    <strong>Benefício:</strong> Permite calcular o ROI (retorno sobre investimento) de cada campanha específica.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="feature-block">
                    <h3 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-tertiary); font-weight: 600; margin-bottom: 0.5rem;">📝 BLOG PROFISSIONAL DE SAÚDE</h3>
                    
                    <p style="font-size: 1.25rem; font-weight: 600; color: var(--text-primary); line-height: 1.4; margin-bottom: 1.25rem;">"Pacientes te encontram no Google enquanto você dorme."</p>
                    
                    <!-- Comparativo -->
                    <!-- Comparativo -->
                    <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 1.5rem; align-items: center; margin-bottom: 2rem;">
                        <div style="background: var(--bg-hover); padding: 1.5rem; border-radius: var(--radius-md); text-align: center; border: 1px solid var(--border);">
                            <div style="font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); font-weight: 600; margin-bottom: 0.5rem;">📱 Rede Social</div>
                            <div style="font-size: 0.875rem; color: var(--text-secondary);">Post some em 24h</div>
                        </div>
                        <div style="font-size: 1.25rem; color: var(--text-tertiary); font-weight: 300;">vs</div>
                        <div style="background: #FFFBEB; padding: 1.5rem; text-align: center; border-radius: var(--radius-md); border: 1px solid #FCD34D;">
                            <div style="font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #D97706; font-weight: 700; margin-bottom: 0.5rem;">✅ Depois</div>
                            <div style="font-size: 0.875rem; color: var(--text-primary); font-weight: 600;">Atrai pacientes por anos</div>
                        </div>
                    </div>
                    
                    <!-- Lista com Collapsibles -->
                    <div style="border-top: 1px solid var(--border); padding-top: 1rem;">
                        <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-tertiary); margin-bottom: 0.625rem;">COMO FUNCIONA: <span style="font-weight: 400; font-style: italic;">(clique para detalhes)</span></div>
                        
                        <div class="collapsible-item">
                            <button class="collapsible-trigger" onclick="this.parentElement.classList.toggle('open')">
                                <span class="bullet"></span>
                                <span>Você publica artigo sobre "Tratamento de Bruxismo"</span>
                                <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                            </button>
                            <div class="collapsible-content">
                                <div class="collapsible-inner">
                                    <strong>Como você faz isso:</strong> No <code>Painel Admin → Posts → Novo</code>, você escreve seu artigo usando um editor visual intuitivo (estilo Word). Adiciona título, texto, imagens e formata como preferir.<br><br>
                                    <strong>Otimização automática:</strong> Ao salvar, o sistema gera automaticamente uma URL amigável (<code>/blog/tratamento-bruxismo</code>), e você pode preencher campos de SEO (meta-título e descrição para o Google).<br><br>
                                    <strong>Tempo médio:</strong> Um artigo de 800 palavras leva cerca de 30-45 minutos para escrever.
                                </div>
                            </div>
                        </div>
                        
                        <div class="collapsible-item">
                            <button class="collapsible-trigger" onclick="this.parentElement.classList.toggle('open')">
                                <span class="bullet"></span>
                                <span>Google indexa e mostra para quem pesquisa</span>
                                <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                            </button>
                            <div class="collapsible-content">
                                <div class="collapsible-inner">
                                    <strong>O que é indexação:</strong> O Google envia "robôs" que leem seu site. Quando encontram uma nova página, adicionam ao índice de busca. Isso geralmente leva de <strong>2 a 14 dias</strong> para novos artigos.<br><br>
                                    <strong>Por que seu site é favorecido:</strong> A tecnologia usada (Next.js com SSR) renderiza o conteúdo no servidor, entregando HTML completo ao Google — diferente de sites mais lentos que dependem de JavaScript para carregar texto.<br><br>
                                    <strong>Resultado:</strong> Quando alguém pesquisa "bruxismo tratamento [sua cidade]", seu artigo pode aparecer na primeira página do Google.
                                </div>
                            </div>
                        </div>
                        
                        <div class="collapsible-item">
                            <button class="collapsible-trigger" onclick="this.parentElement.classList.toggle('open')">
                                <span class="bullet"></span>
                                <span>Paciente lê, confia em você, e agenda consulta</span>
                                <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                            </button>
                            <div class="collapsible-content">
                                <div class="collapsible-inner">
                                    <strong>Jornada do paciente:</strong> O visitante lê seu artigo, percebe que você domina o assunto, e naturalmente confia mais em você do que em um dentista desconhecido. Isso é chamado de <strong>"marketing de conteúdo"</strong>.<br><br>
                                    <strong>Conversão:</strong> No final de cada artigo, há botões de contato (WhatsApp, formulário). O paciente clica, e você recebe o lead com a informação de qual artigo ele leu.<br><br>
                                    <strong>Dado importante:</strong> Pacientes que chegam via conteúdo educativo tendem a ter <strong>menor resistência a preço</strong> e maior taxa de comparecimento às consultas.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="feature-block">
                    <h3 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-tertiary); font-weight: 600; margin-bottom: 0.5rem;">⚙️ PAINEL ADMINISTRATIVO PRÓPRIO</h3>
                    
                    <p style="font-size: 1.25rem; font-weight: 600; color: var(--text-primary); line-height: 1.4; margin-bottom: 1.25rem;">"Atualize seu site sem depender de programador."</p>
                    
                    <!-- Antes / Depois -->
                    <!-- Antes / Depois -->
                    <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 1.5rem; align-items: center; margin-bottom: 2rem;">
                        <div style="background: var(--bg-hover); padding: 1.5rem; border-radius: var(--radius-md); text-align: center; border: 1px solid var(--border);">
                            <div style="font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-tertiary); font-weight: 600; margin-bottom: 0.5rem;">😕 Antes</div>
                            <div style="font-size: 0.875rem; color: var(--text-secondary);">"Preciso ligar pra agência..."</div>
                        </div>
                        <div style="font-size: 1.25rem; color: var(--text-tertiary); font-weight: 300;">→</div>
                        <div style="background: #FFFBEB; padding: 1.5rem; text-align: center; border-radius: var(--radius-md); border: 1px solid #FCD34D;">
                            <div style="font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; color: #D97706; font-weight: 700; margin-bottom: 0.5rem;">✅ Depois</div>
                            <div style="font-size: 0.875rem; color: var(--text-primary); font-weight: 600;">"Alterei em 2 minutos!"</div>
                        </div>
                    </div>
                    
                    <!-- Lista com Collapsibles -->
                    <div style="border-top: 1px solid var(--border); padding-top: 1rem;">
                        <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-tertiary); margin-bottom: 0.625rem;">O QUE VOCÊ PODE FAZER: <span style="font-weight: 400; font-style: italic;">(clique para detalhes)</span></div>
                        
                        <div class="collapsible-item">
                            <button class="collapsible-trigger" onclick="this.parentElement.classList.toggle('open')">
                                <span class="bullet"></span>
                                <span>Criar e editar artigos do blog com editor visual</span>
                                <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                            </button>
                            <div class="collapsible-content">
                                <div class="collapsible-inner">
                                    <strong>O editor:</strong> Baseado no Tiptap, é similar ao Word ou Google Docs. Você formata texto (negrito, itálico, listas), adiciona imagens, links e títulos sem ver código.<br><br>
                                    <strong>Recursos disponíveis:</strong> Títulos (H1-H4), listas numeradas e com bullets, blocos de citação, inserção de imagens com upload direto, links clicáveis.<br><br>
                                    <strong>Acesso:</strong> <code>seusite.com/admin</code> → Login → Posts → Novo ou Editar.
                                </div>
                            </div>
                        </div>
                        
                        <div class="collapsible-item">
                            <button class="collapsible-trigger" onclick="this.parentElement.classList.toggle('open')">
                                <span class="bullet"></span>
                                <span>Visualizar todos os contatos em lista organizada</span>
                                <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                            </button>
                            <div class="collapsible-content">
                                <div class="collapsible-inner">
                                    <strong>Tela de Leads:</strong> Uma tabela com todos os contatos recebidos, ordenados por data (mais recentes primeiro). Cada linha mostra nome, telefone, e-mail e origem.<br><br>
                                    <strong>Filtros:</strong> Você pode filtrar por status (novo, contactado, convertido, perdido) ou buscar por nome/telefone.<br><br>
                                    <strong>Exportação:</strong> É possível exportar a lista para Excel/CSV para análise externa ou integração com CRM.
                                </div>
                            </div>
                        </div>
                        
                        <div class="collapsible-item">
                            <button class="collapsible-trigger" onclick="this.parentElement.classList.toggle('open')">
                                <span class="bullet"></span>
                                <span>Ver de qual fonte cada contato veio</span>
                                <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                            </button>
                            <div class="collapsible-content">
                                <div class="collapsible-inner">
                                    <strong>Colunas de origem:</strong> Cada lead mostra <code>utm_source</code>, <code>utm_medium</code> e <code>utm_campaign</code> capturados automaticamente.<br><br>
                                    <strong>Exemplo visual:</strong> "Maria Silva | (33) 99999 | Google Ads | Campanha: bruxismo-janeiro"<br><br>
                                    <strong>Sem configuração:</strong> O sistema captura esses dados automaticamente quando o paciente chega via link com parâmetros UTM.
                                </div>
                            </div>
                        </div>
                        
                        <div class="collapsible-item">
                            <button class="collapsible-trigger" onclick="this.parentElement.classList.toggle('open')">
                                <span class="bullet"></span>
                                <span>Marcar o status de cada lead (novo, contactado, convertido)</span>
                                <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                            </button>
                            <div class="collapsible-content">
                                <div class="collapsible-inner">
                                    <strong>Workflow de vendas:</strong> Cada lead tem um campo de status que você atualiza conforme avança no atendimento: <code>Novo</code> → <code>Contactado</code> → <code>Agendado</code> → <code>Convertido</code> ou <code>Perdido</code>.<br><br>
                                    <strong>Por que isso importa:</strong> Permite medir sua taxa de conversão (quantos leads viram pacientes) e identificar gargalos no processo de atendimento.<br><br>
                                    <strong>Visão gerencial:</strong> Você consegue ver rapidamente quantos leads estão em cada estágio do funil.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <h2 id="sub-02"><span style="color: var(--accent);">02.</span> Como o Sistema Funciona na Prática</h2>
                <p>Veja abaixo os diferentes caminhos que potenciais pacientes podem percorrer até chegar à sua clínica:</p>
                
                <!-- Persona 1: Busca Orgânica -->
                <div class="feature-block">
                    <h3 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: black; font-weight: 600; margin-bottom: 0.5rem;">👩‍💼 PERSONA 1: BUSCA ORGÂNICA (GOOGLE)</h3>
                    <p style="font-size: 1rem; font-weight: 500; color: black; margin-bottom: 1rem;">"Maria, 42 anos, executiva com dor na mandíbula"</p>
                    
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; font-size: 0.8125rem; margin-bottom: 1rem;">
                        <span style="background: white; padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary);">🔍 Pesquisa "dor mandíbula bruxismo"</span>
                        <span style="color: var(--text-tertiary);">→</span>
                        <span style="background: white; padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary);">📖 Encontra seu artigo</span>
                        <span style="color: var(--text-tertiary);">→</span>
                        <span style="background: white; padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary);">💡 Lê e confia</span>
                        <span style="color: var(--text-tertiary);">→</span>
                        <span style="background: var(--accent); color: white; padding: 0.5rem 0.75rem; font-weight: 600; border-radius: var(--radius-sm); box-shadow: var(--shadow-sm);">📞 Agenda consulta</span>
                    </div>
                    
                    <div style="background: var(--bg-hover); border-radius: var(--radius-md); padding: 1rem; font-size: 0.8125rem; color: var(--text-secondary); border: 1px solid var(--border);">
                        <strong>📊 Rastreamento:</strong> O sistema registra <code style="background: #FFFBEB; color: #B45309; border: 1px solid #FCD34D; padding: 0.1rem 0.3rem; border-radius: 4px;">utm_source: google</code>, <code style="background: #FFFBEB; color: #B45309; border: 1px solid #FCD34D; padding: 0.1rem 0.3rem; border-radius: 4px;">utm_medium: organic</code> e qual artigo ela leu.
                    </div>
                </div>

                <!-- Persona 2: Anúncio Pago -->
                <div class="feature-block">
                    <h3 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: black; font-weight: 600; margin-bottom: 0.5rem;">👨‍💻 PERSONA 2: ANÚNCIO GOOGLE ADS</h3>
                    <p style="font-size: 1rem; font-weight: 500; color: black; margin-bottom: 1rem;">"Carlos, 35 anos, empresário buscando tratamento rápido"</p>
                    
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; font-size: 0.8125rem; margin-bottom: 1rem;">
                        <span style="background: white; padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary);">🎯 Vê anúncio no Google</span>
                        <span style="color: var(--text-tertiary);">→</span>
                        <span style="background: white; padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary);">🖱️ Clica no link</span>
                        <span style="color: var(--text-tertiary);">→</span>
                        <span style="background: white; padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary);">📋 Preenche formulário</span>
                        <span style="color: var(--text-tertiary);">→</span>
                        <span style="background: var(--accent); color: white; padding: 0.5rem 0.75rem; font-weight: 600; border-radius: var(--radius-sm); box-shadow: var(--shadow-sm);">📱 WhatsApp</span>
                    </div>
                    
                    <div style="background: var(--bg-hover); border-radius: var(--radius-md); padding: 1rem; font-size: 0.8125rem; color: var(--text-secondary); border: 1px solid var(--border);">
                        <strong>📊 Rastreamento:</strong> Sistema captura <code style="background: #FFFBEB; color: #B45309; border: 1px solid #FCD34D; padding: 0.1rem 0.3rem; border-radius: 4px;">gclid</code> (ID do Google Ads) + <code style="background: #FFFBEB; color: #B45309; border: 1px solid #FCD34D; padding: 0.1rem 0.3rem; border-radius: 4px;">utm_campaign: bruxismo-jan2026</code>. Você sabe exatamente qual anúncio converteu.
                    </div>
                </div>

                <!-- Persona 3: Redes Sociais -->
                <div class="feature-block">
                    <h3 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: black; font-weight: 600; margin-bottom: 0.5rem;">📱 PERSONA 3: INSTAGRAM / FACEBOOK</h3>
                    <p style="font-size: 1rem; font-weight: 500; color: black; margin-bottom: 1rem;">"Ana, 28 anos, viu seu story sobre Botox para bruxismo"</p>
                    
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; font-size: 0.8125rem; margin-bottom: 1rem;">
                        <span style="background: white; padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary);">📲 Vê story/post</span>
                        <span style="color: var(--text-tertiary);">→</span>
                        <span style="background: white; padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary);">🔗 Clica no link da bio</span>
                        <span style="color: var(--text-tertiary);">→</span>
                        <span style="background: white; padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary);">📄 Lê página do tratamento</span>
                        <span style="color: var(--text-tertiary);">→</span>
                        <span style="background: var(--accent); color: white; padding: 0.5rem 0.75rem; font-weight: 600; border-radius: var(--radius-sm); box-shadow: var(--shadow-sm);">💬 Contato</span>
                    </div>
                    
                    <div style="background: var(--bg-hover); border-radius: var(--radius-md); padding: 1rem; font-size: 0.8125rem; color: var(--text-secondary); border: 1px solid var(--border);">
                        <strong>📊 Rastreamento:</strong> Sistema captura <code style="background: #FFFBEB; color: #B45309; border: 1px solid #FCD34D; padding: 0.1rem 0.3rem; border-radius: 4px;">fbclid</code> (Facebook/Instagram) + <code style="background: #FFFBEB; color: #B45309; border: 1px solid #FCD34D; padding: 0.1rem 0.3rem; border-radius: 4px;">utm_source: instagram</code>, <code style="background: #FFFBEB; color: #B45309; border: 1px solid #FCD34D; padding: 0.1rem 0.3rem; border-radius: 4px;">utm_medium: stories</code>.
                    </div>
                </div>

                <!-- Persona 4: Indicação -->
                <div class="feature-block">
                    <h3 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: black; font-weight: 600; margin-bottom: 0.5rem;">🤝 PERSONA 4: INDICAÇÃO DE PACIENTE</h3>
                    <p style="font-size: 1rem; font-weight: 500; color: black; margin-bottom: 1rem;">"João, 50 anos, indicado por um primo que já é paciente"</p>
                    
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; font-size: 0.8125rem; margin-bottom: 1rem;">
                        <span style="background: white; padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary);">💬 Recebe indicação</span>
                        <span style="color: var(--text-tertiary);">→</span>
                        <span style="background: white; padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary);">🌐 Acessa site diretamente</span>
                        <span style="color: var(--text-tertiary);">→</span>
                        <span style="background: white; padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary);">📋 Preenche formulário</span>
                        <span style="color: var(--text-tertiary);">→</span>
                        <span style="background: var(--accent); color: white; padding: 0.5rem 0.75rem; font-weight: 600; border-radius: var(--radius-sm); box-shadow: var(--shadow-sm);">✅ Lead</span>
                    </div>
                    
                    <div style="background: var(--bg-hover); border-radius: var(--radius-md); padding: 1rem; font-size: 0.8125rem; color: var(--text-secondary); border: 1px solid var(--border);">
                        <strong>📊 Rastreamento:</strong> Sem parâmetros UTM = registrado como <code style="background: #FFFBEB; color: #B45309; border: 1px solid #FCD34D; padding: 0.1rem 0.3rem; border-radius: 4px;">origem: direta</code>. No futuro, pode-se adicionar campo "Como nos conheceu?" no formulário.
                    </div>
                </div>

                <!-- Callout final -->
                <div class="callout">
                    <p><strong>💡 O diferencial invisível:</strong> Em todos os cenários, o sistema trabalha nos bastidores capturando dados. Você consegue comparar: "Qual canal trouxe mais leads este mês? Google Ads ou Instagram?" — e investir de forma inteligente.</p>
                </div>

                <h2 id="sub-03"><span style="color: var(--accent);">03.</span> Mapa Completo de Funcionalidades</h2>
                <p>Abaixo está uma visão detalhada de tudo que o sistema oferece, dividido por área:</p>
                
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 22%;">Área</th>
                                <th style="width: 30%;">O Que Faz</th>
                                <th>Detalhes</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Site Público</strong></td>
                                <td>A "vitrine" da sua clínica na internet</td>
                                <td>Página inicial profissional, páginas dedicadas para cada tratamento odontológico - como clínica e cirurgia geral, Bruxismo, Placa Miorrelaxante, prótese dentária e implantes; e de harmonização - como botox, preenchimento com hialurônico, bioestimulador etc; seção de contato e localização.</td>
                            </tr>
                            <tr>
                                <td><strong>Blog Integrado</strong></td>
                                <td>Publica artigos que atraem pacientes via Google</td>
                                <td>Sistema de categorias e tags, exibição automática de artigos relacionados, contador de visualizações, tempo de leitura estimado.</td>
                            </tr>
                            <tr>
                                <td><strong>Formulário de Contato</strong></td>
                                <td>Captura dados do paciente interessado</td>
                                <td>Nome, telefone, e-mail, tratamento de interesse. Rastreia automaticamente: Google Ads (gclid), Facebook/Instagram Ads (fbclid), campanhas UTM.</td>
                            </tr>
                            <tr>
                                <td><strong>Painel Admin</strong></td>
                                <td>Sua área de controle</td>
                                <td>Dashboard com estatísticas; gestão financeira com receita, despesas e NFe; artigos do blog; lista de contatos recebidos; gerenciamento de atendimentos e agendamentos; portal médico para registro de atendimentos, com proteção de dados garantido em leis atualizadas.</td>
                            </tr>
                            <tr>
                                <td><strong>Editor de Conteúdo</strong></td>
                                <td>Cria artigos como se fosse um processador de texto</td>
                                <td>Formatação rica (negrito, itálico, listas), inserção de imagens, links, e títulos. Não requer conhecimento técnico.</td>
                            </tr>
                            <tr>
                                <td><strong>SEO Automático</strong></td>
                                <td>Otimiza seu site para aparecer no Google</td>
                                <td>Campos para meta-título e meta-descrição em cada artigo, URLs amigáveis automáticas, estrutura de dados para rich snippets.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h2 id="sub-04"><span style="color: var(--accent);">04.</span> Benefícios Estratégicos Para Sua Clínica</h2>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin: 2rem 0;">
                    
                    <!-- Card 1 -->
                    <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.5rem; box-shadow: var(--shadow-sm);">
                        <div style="font-size: 2.5rem; margin-bottom: 1rem;">🔓</div>
                        <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem; color: var(--text-primary);">Independência Total</h3>
                        <p style="font-size: 0.875rem; line-height: 1.6; color: var(--text-secondary); margin-bottom: 1rem;">Faça alterações você mesmo, sem depender de agência.</p>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                            <span style="background: var(--bg-hover); padding: 0.25rem 0.75rem; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); border-radius: var(--radius-sm);">Textos</span>
                            <span style="background: var(--bg-hover); padding: 0.25rem 0.75rem; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); border-radius: var(--radius-sm);">Imagens</span>
                            <span style="background: var(--bg-hover); padding: 0.25rem 0.75rem; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); border-radius: var(--radius-sm);">Artigos</span>
                        </div>
                    </div>

                    <!-- Card 2 -->
                    <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.5rem; box-shadow: var(--shadow-sm);">
                        <div style="font-size: 2.5rem; margin-bottom: 1rem;">📊</div>
                        <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem; color: var(--text-primary);">Decisões com Dados</h3>
                        <p style="font-size: 0.875rem; line-height: 1.6; color: var(--text-secondary); margin-bottom: 1rem;">Saiba exatamente de onde vêm seus pacientes.</p>
                        <div style="font-family: var(--font-mono); font-size: 0.8rem; background: var(--bg-hover); padding: 0.75rem; border-radius: var(--radius-sm); color: var(--text-secondary);">
                            Se Instagram não traz resultado → redirecione para Google Ads
                        </div>
                    </div>

                    <!-- Card 3 -->
                    <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.5rem; box-shadow: var(--shadow-sm);">
                        <div style="font-size: 2.5rem; margin-bottom: 1rem;">🏆</div>
                        <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem; color: var(--text-primary);">Autoridade Online</h3>
                        <p style="font-size: 0.875rem; line-height: 1.6; color: var(--text-secondary); margin-bottom: 1rem;">Artigos bem escritos = pacientes que já confiam em você.</p>
                        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: var(--text-secondary);">
                            <span style="color: var(--accent); font-size: 1.25rem;">✓</span>
                            <span>Percepção de especialista</span>
                        </div>
                    </div>
                </div>

                <div class="callout">
                    <p><strong>💡 Resumindo:</strong> Seu site deixa de ser um "cartão de visitas" e vira uma <strong>máquina de captação</strong> que você controla.</p>
                </div>
            `,
        },
        {
            id: "architecture",
            title: "Arquitetura & Stack",
            icon: "layers",
            subsections: [
                { id: "arch-01", num: "01", title: "Visão Geral da Stack" },
                { id: "arch-02", num: "02", title: "Por Que Essas Tecnologias?" },
                { id: "arch-03", num: "03", title: "Como se Comunicam" }
            ],
            content: `
                <!-- Hero Section -->
                <div style="margin-bottom: 2.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                        <div style="width: 48px; height: 48px; background: var(--bg-hover); border: 1px solid var(--border); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm);">
                            <span style="font-size: 1.5rem;">⚙️</span>
                        </div>
                        <div>
                            <h1 style="margin: 0; font-size: 1.75rem;">Arquitetura Tecnológica</h1>
                            <div style="font-size: 0.75rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em;">Stack de Última Geração</div>
                        </div>
                    </div>
                    
                    <p style="font-size: 1.125rem; color: var(--text-secondary); line-height: 1.7; margin-bottom: 1.5rem;">
                        <strong style="color: var(--text-primary);">Tecnologia de ponta, não por modismo.</strong> Cada escolha foi feita pensando em <strong style="color: var(--accent);">velocidade</strong>, <strong style="color: var(--accent);">segurança</strong> e <strong style="color: var(--accent);">facilidade de manutenção</strong> a longo prazo.
                    </p>
                </div>

                <!-- Status Cards -->
                <div class="card-grid">
                    <div class="stat-card">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.375rem;">
                            <span style="font-size: 1rem;">🚀</span>
                            <div class="label" style="margin: 0;">Performance</div>
                        </div>
                        <div class="value">95+ no Lighthouse</div>
                    </div>
                    <div class="stat-card">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.375rem;">
                            <span style="font-size: 1rem;">🔒</span>
                            <div class="label" style="margin: 0;">Segurança</div>
                        </div>
                        <div class="value">Auth + HTTPS + CORS</div>
                    </div>
                    <div class="stat-card">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.375rem;">
                            <span style="font-size: 1rem;">📈</span>
                            <div class="label" style="margin: 0;">Escalabilidade</div>
                        </div>
                        <div class="value">Pronto para crescer</div>
                    </div>
                </div>

                <h2 id="arch-01"><span style="color: var(--accent);">01.</span> Visão Geral da Stack</h2>
                <p>O sistema é construído com 4 pilares tecnológicos principais:</p>
                
                <!-- Tech Cards with Collapsibles -->
                <div class="feature-block">
                    <h3 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-tertiary); font-weight: 600; margin-bottom: 0.5rem;">⚡ NEXT.JS 15</h3>
                    <p style="font-size: 1.25rem; font-weight: 600; color: var(--text-primary); line-height: 1.4; margin-bottom: 1rem;">"O cérebro do site — processa páginas e lógica de negócio."</p>
                    
                    <div class="collapsible-item">
                        <button class="collapsible-trigger" onclick="this.parentElement.classList.toggle('open')">
                            <span class="bullet"></span>
                            <span>O que isso significa para você?</span>
                            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                        <div class="collapsible-content">
                            <div class="collapsible-inner">
                                <strong>Carregamento rápido:</strong> Páginas carregam em menos de 2 segundos. Google prioriza sites rápidos no ranking de busca.<br><br>
                                <strong>SEO nativo:</strong> Diferente de sites antigos que dependem só de JavaScript, o Next.js entrega HTML pronto para o Google indexar.<br><br>
                                <strong>Manutenção simplificada:</strong> Código organizado significa que futuras alterações custam menos tempo e dinheiro.
                            </div>
                        </div>
                    </div>
                </div>

                <div class="feature-block">
                    <h3 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-tertiary); font-weight: 600; margin-bottom: 0.5rem;">🔷 TYPESCRIPT 5</h3>
                    <p style="font-size: 1.25rem; font-weight: 600; color: var(--text-primary); line-height: 1.4; margin-bottom: 1rem;">"O verificador de qualidade — previne erros antes de acontecerem."</p>
                    
                    <div class="collapsible-item">
                        <button class="collapsible-trigger" onclick="this.parentElement.classList.toggle('open')">
                            <span class="bullet"></span>
                            <span>O que isso significa para você?</span>
                            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                        <div class="collapsible-content">
                            <div class="collapsible-inner">
                                <strong>Menos bugs:</strong> O código é verificado automaticamente. Erros que em outros sistemas só apareceriam quando o paciente tentasse agendar, aqui são pegos antes de publicar.<br><br>
                                <strong>Documentação embutida:</strong> Cada função do sistema tem descrição do que faz e que dados espera. Facilita para qualquer desenvolvedor futuro entender e modificar.
                            </div>
                        </div>
                    </div>
                </div>

                <div class="feature-block">
                    <h3 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-tertiary); font-weight: 600; margin-bottom: 0.5rem;">🎨 TAILWIND CSS v4</h3>
                    <p style="font-size: 1.25rem; font-weight: 600; color: var(--text-primary); line-height: 1.4; margin-bottom: 1rem;">"O estilista — define cores, fontes e visual de tudo."</p>
                    
                    <div class="collapsible-item">
                        <button class="collapsible-trigger" onclick="this.parentElement.classList.toggle('open')">
                            <span class="bullet"></span>
                            <span>O que isso significa para você?</span>
                            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                        <div class="collapsible-content">
                            <div class="collapsible-inner">
                                <strong>Visual consistente:</strong> Todas as páginas seguem o mesmo padrão visual. Não há "páginas feias" esquecidas.<br><br>
                                <strong>Design responsivo:</strong> O site se adapta automaticamente a celular, tablet e computador. Pacientes podem agendar de qualquer dispositivo.<br><br>
                                <strong>Alterações rápidas:</strong> Quer mudar a cor principal da clínica? Uma linha de código altera todo o site de uma vez.
                            </div>
                        </div>
                    </div>
                </div>

                <div class="feature-block">
                    <h3 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-tertiary); font-weight: 600; margin-bottom: 0.5rem;">🗄️ PRISMA + POSTGRESQL</h3>
                    <p style="font-size: 1.25rem; font-weight: 600; color: var(--text-primary); line-height: 1.4; margin-bottom: 1rem;">"O arquivo — armazena pacientes, artigos e contatos com segurança."</p>
                    
                    <div class="collapsible-item">
                        <button class="collapsible-trigger" onclick="this.parentElement.classList.toggle('open')">
                            <span class="bullet"></span>
                            <span>O que isso significa para você?</span>
                            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                        <div class="collapsible-content">
                            <div class="collapsible-inner">
                                <strong>Dados seguros:</strong> PostgreSQL é usado por empresas como Instagram e Spotify. Seus dados de leads estão em mãos confiáveis.<br><br>
                                <strong>Backups automáticos:</strong> O Railway (servidor) faz backup diário. Se algo der errado, podemos restaurar.<br><br>
                                <strong>Relacionamentos inteligentes:</strong> O sistema sabe que o Lead X veio do Artigo Y via Campanha Z. Tudo conectado.
                            </div>
                        </div>
                    </div>
                </div>

                <h2 id="arch-02"><span style="color: var(--accent);">02.</span> Por Que Essas Tecnologias?</h2>
                <p>Comparação com alternativas comuns no mercado:</p>
                
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 25%;">Aspecto</th>
                                <th style="width: 37%;">❌ Sites Tradicionais (WordPress)</th>
                                <th style="width: 38%;">✅ Este Sistema (Next.js)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Velocidade</strong></td>
                                <td>3-5 segundos para carregar</td>
                                <td style="color: var(--success);"><strong>&lt;2 segundos</strong></td>
                            </tr>
                            <tr>
                                <td><strong>Segurança</strong></td>
                                <td>Alvo frequente de hackers (plugins desatualizados)</td>
                                <td style="color: var(--success);"><strong>Sem plugins vulneráveis, código fechado</strong></td>
                            </tr>
                            <tr>
                                <td><strong>SEO</strong></td>
                                <td>Depende de plugins (Yoast, etc.)</td>
                                <td style="color: var(--success);"><strong>Nativo, otimizado por padrão</strong></td>
                            </tr>
                            <tr>
                                <td><strong>Manutenção</strong></td>
                                <td>Atualizar WordPress + 20 plugins mensalmente</td>
                                <td style="color: var(--success);"><strong>Código estável, menos atualizações críticas</strong></td>
                            </tr>
                            <tr>
                                <td><strong>Custo de servidor</strong></td>
                                <td>~R$50-150/mês (hosting + banco)</td>
                                <td style="color: var(--success);"><strong>~R$20-50/mês (Railway)</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h2 id="arch-03"><span style="color: var(--accent);">03.</span> Como os Componentes se Comunicam</h2>
                <p>Diagrama simplificado do fluxo de dados:</p>
                
                <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; margin: 1.5rem auto; box-shadow: var(--shadow-sm); width: fit-content;">
                    <div style="display: flex; flex-direction: column; gap: 1rem; margin: 0 auto; width: fit-content;">
                        <!-- Visitante -->
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div style="width: 50px; height: 50px; background: var(--bg-hover); color: var(--text-primary); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0;">👤</div>
                            <div style="flex: 1;">
                                <strong style="color: var(--text-primary);">Visitante acessa o site</strong>
                                <div style="font-size: 0.8125rem; color: var(--text-tertiary);">Navegador (Chrome, Safari, etc.)</div>
                            </div>
                        </div>
                        
                        <div style="display: flex; justify-content: center; padding: 0.5rem 0;">
                            <div style="color: var(--text-tertiary); font-weight: 700; font-size: 1.25rem;">↓</div>
                        </div>
                        
                        <!-- Next.js -->
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div style="width: 50px; height: 50px; background: var(--bg-hover); color: var(--text-primary); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.25rem; flex-shrink: 0;">N</div>
                            <div style="flex: 1;">
                                <strong style="color: var(--text-primary);">Next.js processa a requisição</strong>
                                <div style="font-size: 0.8125rem; color: var(--text-tertiary);">Renderiza HTML, aplica lógica de negócio</div>
                            </div>
                        </div>
                        
                        <div style="display: flex; justify-content: center; padding: 0.5rem 0;">
                            <div style="color: var(--text-tertiary); font-weight: 700; font-size: 1.25rem;">↓</div>
                        </div>
                        
                        <!-- Prisma -->
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div style="width: 50px; height: 50px; background: var(--bg-hover); color: var(--text-primary); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.25rem; flex-shrink: 0;">P</div>
                            <div style="flex: 1;">
                                <strong style="color: var(--text-primary);">Prisma busca/salva dados</strong>
                                <div style="font-size: 0.8125rem; color: var(--text-tertiary);">Traduz código para linguagem de banco de dados</div>
                            </div>
                        </div>
                        
                        <div style="display: flex; justify-content: center; padding: 0.5rem 0;">
                            <div style="color: var(--text-tertiary); font-weight: 700; font-size: 1.25rem;">↓</div>
                        </div>
                        
                        <!-- PostgreSQL -->
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div style="width: 50px; height: 50px; background: var(--bg-hover); color: var(--text-primary); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; flex-shrink: 0;">🐘</div>
                            <div style="flex: 1;">
                                <strong style="color: var(--text-primary);">PostgreSQL armazena</strong>
                                <div style="font-size: 0.8125rem; color: var(--text-tertiary);">Leads, artigos, usuários, categorias</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="callout">
                    <p><strong>💡 Resumo:</strong> Você não precisa entender cada tecnologia em detalhes. O importante é saber que são escolhas <strong>modernas, seguras e de baixa manutenção</strong> — usadas por empresas como Vercel, Netflix e TikTok.</p>
                </div>
            `,
        },
        {
            id: "database",
            title: "Banco de Dados",
            icon: "database",
            subsections: [
                { id: "db-01", num: "01", title: "O Que São os Modelos?" },
                { id: "db-02", num: "02", title: "Modelo Lead (Contatos)" },
                { id: "db-03", num: "03", title: "Modelo Post (Artigos)" },
                { id: "db-04", num: "04", title: "Modelo User (Usuários)" }
            ],
            content: `
                <!-- Hero Section -->
                <div style="margin-bottom: 2.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                        <div style="width: 48px; height: 48px; background: var(--bg-hover); border: 1px solid var(--border); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm);">
                            <span style="font-size: 1.5rem;">🗄️</span>
                        </div>
                        <div>
                            <h1 style="margin: 0; font-size: 1.75rem;">Banco de Dados</h1>
                            <div style="font-size: 0.75rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em;">Modelagem Inteligente</div>
                        </div>
                    </div>
                    
                    <p style="font-size: 1.125rem; color: var(--text-secondary); line-height: 1.7; margin-bottom: 1.5rem;">
                        <strong style="color: var(--text-primary);">Mais que um depósito de dados.</strong> O banco foi projetado para <strong style="color: var(--accent);">relacionar informações</strong>, permitindo você saber exatamente <strong style="color: var(--accent);">qual campanha trouxe qual paciente</strong>.
                    </p>
                </div>

                <!-- Status Cards -->
                <div class="card-grid">
                    <div class="stat-card">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.375rem;">
                            <span style="font-size: 1rem;">📊</span>
                            <div class="label" style="margin: 0;">Modelos</div>
                        </div>
                        <div class="value">9 tabelas conectadas</div>
                    </div>
                    <div class="stat-card">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.375rem;">
                            <span style="font-size: 1rem;">🔗</span>
                            <div class="label" style="margin: 0;">Relacionamentos</div>
                        </div>
                        <div class="value">Lead ↔ Post ↔ UTM</div>
                    </div>
                    <div class="stat-card">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.375rem;">
                            <span style="font-size: 1rem;">🔒</span>
                            <div class="label" style="margin: 0;">Segurança</div>
                        </div>
                        <div class="value">Senhas criptografadas</div>
                    </div>
                </div>

                <h2 id="db-01"><span style="color: var(--accent);">01.</span> O Que São os Modelos?</h2>
                <p>Pense em "modelos" como <strong>fichas organizadoras</strong>. Cada modelo define que informações armazenar:</p>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1.5rem 0;">
                    <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.5rem; text-align: center; box-shadow: var(--shadow-sm);">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.8;">👤</div>
                        <strong style="display: block; margin-bottom: 0.5rem; color: var(--text-primary);">User</strong>
                        <div style="font-size: 0.75rem; color: var(--text-tertiary);">Quem acessa o painel</div>
                    </div>
                    <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.5rem; text-align: center; box-shadow: var(--shadow-sm);">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.8;">📝</div>
                        <strong style="display: block; margin-bottom: 0.5rem; color: var(--text-primary);">Post</strong>
                        <div style="font-size: 0.75rem; color: var(--text-tertiary);">Artigos do blog</div>
                    </div>
                    <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.5rem; text-align: center; box-shadow: var(--shadow-sm);">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.8;">📞</div>
                        <strong style="display: block; margin-bottom: 0.5rem; color: var(--text-primary);">Lead</strong>
                        <div style="font-size: 0.75rem; color: var(--text-tertiary);">Contatos recebidos</div>
                    </div>
                    <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.5rem; text-align: center; box-shadow: var(--shadow-sm);">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.8;">🏷️</div>
                        <strong style="display: block; margin-bottom: 0.5rem; color: var(--text-primary);">Category/Tag</strong>
                        <div style="font-size: 0.75rem; color: var(--text-tertiary);">Organização do conteúdo</div>
                    </div>
                </div>

                <h2 id="db-02"><span style="color: var(--accent);">02.</span> Modelo Lead (Contatos)</h2>
                <p>O modelo mais estratégico do sistema — cada contato recebido é armazenado com inteligência de marketing:</p>
                
                <div class="feature-block">
                    <h3 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-tertiary); font-weight: 600; margin-bottom: 0.5rem;">📞 LEAD</h3>
                    <p style="font-size: 1.25rem; font-weight: 600; color: var(--text-primary); line-height: 1.4; margin-bottom: 1rem;">"Cada contato é uma ficha completa com dados de identificação e origem."</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem; box-shadow: var(--shadow-sm);">
                            <div style="font-size: 0.6875rem; text-transform: uppercase; color: var(--text-tertiary); font-weight: 600; margin-bottom: 0.5rem;">📋 Dados Pessoais</div>
                            <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.8125rem; color: var(--text-secondary);">
                                <li>• Nome completo</li>
                                <li>• Telefone</li>
                                <li>• E-mail</li>
                                <li>• Mensagem</li>
                            </ul>
                        </div>
                        <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem; box-shadow: var(--shadow-sm);">
                            <div style="font-size: 0.6875rem; text-transform: uppercase; color: var(--text-tertiary); font-weight: 600; margin-bottom: 0.5rem;">📊 Dados de Marketing</div>
                            <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.8125rem; color: var(--text-secondary);">
                                <li>• <code>utmSource</code> (origem)</li>
                                <li>• <code>utmMedium</code> (mídia)</li>
                                <li>• <code>utmCampaign</code> (campanha)</li>
                                <li>• <code>gclid</code> / <code>fbclid</code></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="collapsible-item">
                        <button class="collapsible-trigger" onclick="this.parentElement.classList.toggle('open')">
                            <span class="bullet"></span>
                            <span>Ver campos adicionais capturados automaticamente</span>
                            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                        <div class="collapsible-content">
                            <div class="collapsible-inner">
                                <strong>IP Address:</strong> Endereço de rede (para detecção de fraude ou geolocalização aproximada).<br><br>
                                <strong>User Agent:</strong> Navegador e dispositivo usado (ex: "Chrome no iPhone 15").<br><br>
                                <strong>Status:</strong> Campo editável: <code>new</code>, <code>contacted</code>, <code>converted</code>, <code>lost</code>.<br><br>
                                <strong>Created At:</strong> Data e hora exata do contato — útil para ver horários de pico.
                            </div>
                        </div>
                    </div>
                </div>

                <h2 id="db-03"><span style="color: var(--accent);">03.</span> Modelo Post (Artigos)</h2>
                <p>Cada artigo do blog é armazenado com campos otimizados para SEO e organização:</p>
                
                <div class="feature-block">
                    <h3 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: black; font-weight: 600; margin-bottom: 0.5rem;">📝 POST</h3>
                    <p style="font-size: 1.25rem; font-weight: 600; color: black; line-height: 1.4; margin-bottom: 1rem;">"Cada artigo é como uma página de livro — com título, conteúdo e índice."</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem; box-shadow: var(--shadow-sm);">
                            <div style="font-size: 0.6875rem; text-transform: uppercase; color: var(--text-tertiary); font-weight: 600; margin-bottom: 0.5rem;">✍️ Conteúdo</div>
                            <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.8125rem; color: var(--text-secondary);">
                                <li>• Título</li>
                                <li>• Slug (URL amigável)</li>
                                <li>• Conteúdo (HTML)</li>
                                <li>• Resumo (excerpt)</li>
                                <li>• Imagem destacada</li>
                            </ul>
                        </div>
                        <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem; box-shadow: var(--shadow-sm);">
                            <div style="font-size: 0.6875rem; text-transform: uppercase; color: var(--text-tertiary); font-weight: 600; margin-bottom: 0.5rem;">🔍 SEO</div>
                            <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.8125rem; color: var(--text-secondary);">
                                <li>• <code>metaTitle</code></li>
                                <li>• <code>metaDescription</code></li>
                                <li>• Categoria</li>
                                <li>• Tags (múltiplas)</li>
                                <li>• Status (rascunho/publicado)</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="collapsible-item">
                        <button class="collapsible-trigger" onclick="this.parentElement.classList.toggle('open')">
                            <span class="bullet"></span>
                            <span>Por que esses campos de SEO importam?</span>
                            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                        <div class="collapsible-content">
                            <div class="collapsible-inner">
                                <strong>metaTitle:</strong> O título que aparece na aba do navegador e nos resultados do Google. Máximo ~60 caracteres para não cortar.<br><br>
                                <strong>metaDescription:</strong> O resumo de 2 linhas que aparece abaixo do título no Google. Convence o usuário a clicar. Máximo ~160 caracteres.<br><br>
                                <strong>Slug:</strong> A URL do artigo. "bruxismo-tratamento" é melhor para SEO que "artigo-123".
                            </div>
                        </div>
                    </div>
                </div>

                <h2 id="db-04"><span style="color: var(--accent);">04.</span> Modelo User (Usuários)</h2>
                <p>Controle de acesso ao painel administrativo com níveis de permissão:</p>
                
                <div class="feature-block">
                    <h3 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: black; font-weight: 600; margin-bottom: 0.5rem;">👤 USER</h3>
                    <p style="font-size: 1.25rem; font-weight: 600; color: black; line-height: 1.4; margin-bottom: 1rem;">"Quem pode acessar o painel e o que pode fazer."</p>
                    
                    <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1rem;">
                        <div style="background: white; padding: 0.75rem 1rem; border: 1px solid var(--border); border-radius: var(--radius-md); text-align: center; flex: 1; min-width: 120px; box-shadow: var(--shadow-sm);">
                            <div style="font-size: 1.25rem; margin-bottom: 0.25rem;">👑</div>
                            <strong style="font-size: 0.875rem; color: var(--text-primary);">ADMIN</strong>
                            <div style="font-size: 0.6875rem; color: var(--text-tertiary);">Acesso total</div>
                        </div>
                        <div style="background: white; padding: 0.75rem 1rem; border: 1px solid var(--border); border-radius: var(--radius-md); text-align: center; flex: 1; min-width: 120px; box-shadow: var(--shadow-sm);">
                            <div style="font-size: 1.25rem; margin-bottom: 0.25rem;">✏️</div>
                            <strong style="font-size: 0.875rem; color: var(--text-primary);">EDITOR</strong>
                            <div style="font-size: 0.6875rem; color: var(--text-tertiary);">Cria/edita posts</div>
                        </div>
                        <div style="background: white; padding: 0.75rem 1rem; border: 1px solid var(--border); border-radius: var(--radius-md); text-align: center; flex: 1; min-width: 120px; box-shadow: var(--shadow-sm);">
                            <div style="font-size: 1.25rem; margin-bottom: 0.25rem;">👁️</div>
                            <strong style="font-size: 0.875rem; color: var(--text-primary);">VIEWER</strong>
                            <div style="font-size: 0.6875rem; color: var(--text-tertiary);">Apenas visualiza</div>
                        </div>
                    </div>
                    
                    <div class="collapsible-item">
                        <button class="collapsible-trigger" onclick="this.parentElement.classList.toggle('open')">
                            <span class="bullet"></span>
                            <span>Como a segurança é garantida?</span>
                            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                        <div class="collapsible-content">
                            <div class="collapsible-inner">
                                <strong>Senhas criptografadas:</strong> Usamos bcrypt — mesmo que alguém acesse o banco, não vê a senha real.<br><br>
                                <strong>Sessões seguras:</strong> NextAuth v5 gerencia login com tokens temporários. Não há senha trafegando a cada clique.<br><br>
                                <strong>Middleware de proteção:</strong> Rotas <code>/admin/*</code> só podem ser acessadas por usuários logados. Tentativas sem login redirecionam para a página de login.
                            </div>
                        </div>
                    </div>
                </div>

                <div class="callout">
                    <p><strong>💡 Resumo:</strong> O banco de dados foi projetado para <strong>inteligência de marketing</strong>. A cada contato recebido, você sabe nome, telefone, e-mail, <strong>e também</strong> qual campanha específica trouxe esse paciente — permitindo decisões baseadas em dados.</p>
                </div>
            `,
        },
        {
            id: "code-structure",
            title: "Estrutura de Código",
            icon: "code",
            subsections: [
                { id: "code-01", num: "01", title: "Visão Geral das Pastas" },
                { id: "code-02", num: "02", title: "Área Administrativa" },
                { id: "code-03", num: "03", title: "Área Pública (Blog)" },
                { id: "code-04", num: "04", title: "Componentes e APIs" }
            ],
            content: `
                <!-- Hero Section -->
                <div style="margin-bottom: 2.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                        <div style="width: 48px; height: 48px; background: var(--bg-hover); border: 1px solid var(--border); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow-sm);">
                            <span style="font-size: 1.5rem;">📁</span>
                        </div>
                        <div>
                            <h1 style="margin: 0; font-size: 1.75rem;">Organização Modular</h1>
                            <div style="font-size: 0.75rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em;">Estrutura de Código</div>
                        </div>
                    </div>
                    
                    <p style="font-size: 1.125rem; color: var(--text-secondary); line-height: 1.7; margin-bottom: 1.5rem;">
                        <strong style="color: var(--text-primary);">Organização = Manutenibilidade.</strong> O código está separado em <strong style="color: var(--accent);">pastas por responsabilidade</strong>, facilitando encontrar e modificar qualquer funcionalidade.
                    </p>
                </div>

                <!-- Status Cards -->
                <div class="card-grid">
                    <div class="stat-card">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.375rem;">
                            <span style="font-size: 1rem;">🔒</span>
                            <div class="label" style="margin: 0;">Admin</div>
                        </div>
                        <div class="value">Área Protegida</div>
                    </div>
                    <div class="stat-card">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.375rem;">
                            <span style="font-size: 1rem;">🌐</span>
                            <div class="label" style="margin: 0;">Blog</div>
                        </div>
                        <div class="value">Área Pública SEO</div>
                    </div>
                    <div class="stat-card">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.375rem;">
                            <span style="font-size: 1rem;">🧩</span>
                            <div class="label" style="margin: 0;">Components</div>
                        </div>
                        <div class="value">40+ Componentes</div>
                    </div>
                </div>

                <h2 id="code-01"><span style="color: var(--accent);">01.</span> Visão Geral das Pastas</h2>
                <p>O projeto segue a convenção Next.js App Router. Aqui está o mapa geral:</p>
                
                <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin: 1.5rem 0; font-family: var(--font-mono); font-size: 0.8125rem;">
                    <div style="color: var(--text-tertiary);">📂 dental-website/</div>
                    <div style="padding-left: 1.5rem;">
                        <div style="color: var(--text-tertiary);">├── 📂 <span style="color: var(--text-primary); font-weight: 500;">src/</span> <span style="color: var(--text-tertiary); font-weight: 400; font-style: italic;">← Todo o código aqui</span></div>
                        <div style="padding-left: 1.5rem;">
                            <div>├── 📂 <span style="color: #EF4444; font-weight: 500;">app/admin/</span> <span style="color: var(--text-tertiary); font-weight: 400; font-size: 0.75rem;">🔒 Painel administrativo</span></div>
                            <div>├── 📂 <span style="color: var(--success); font-weight: 500;">app/blog/</span> <span style="color: var(--text-tertiary); font-weight: 400; font-size: 0.75rem;">🌐 Artigos públicos</span></div>
                            <div>├── 📂 <span style="color: var(--accent); font-weight: 500;">components/</span> <span style="color: var(--text-tertiary); font-weight: 400; font-size: 0.75rem;">🧩 UI reutilizável</span></div>
                            <div>├── 📂 <span style="color: #8B5CF6; font-weight: 500;">lib/</span> <span style="color: var(--text-tertiary); font-weight: 400; font-size: 0.75rem;">⚙️ Utilitários</span></div>
                            <div>└── 📂 <span style="color: var(--warning); font-weight: 500;">app/api/</span> <span style="color: var(--text-tertiary); font-weight: 400; font-size: 0.75rem;">🔌 Endpoints</span></div>
                        </div>
                        <div style="color: var(--text-tertiary);">├── 📂 <span style="color: var(--text-primary); font-weight: 500;">prisma/</span> <span style="font-weight: 400; font-style: italic;">← Schema do banco</span></div>
                        <div style="color: var(--text-tertiary);">└── 📂 <span style="color: var(--text-primary); font-weight: 500;">public/</span> <span style="font-weight: 400; font-style: italic;">← Imagens e assets</span></div>
                    </div>
                </div>

                <h2 id="code-02"><span style="color: var(--accent);">02.</span> Área Administrativa</h2>
                <p>Tudo que está em <code>src/app/admin/</code> é protegido por autenticação:</p>
                
                <div class="feature-block">
                    <h3 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: black; font-weight: 600; margin-bottom: 0.5rem;">🔒 ADMIN ZONE</h3>
                    <p style="font-size: 1.25rem; font-weight: 600; color: black; line-height: 1.4; margin-bottom: 1rem;">"Apenas usuários logados veem esta área."</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div style="background: white; padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
                            <div style="font-size: 0.6875rem; text-transform: uppercase; color: black; font-weight: 600; margin-bottom: 0.5rem;">📊 Dashboard</div>
                            <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.8125rem; color: var(--text-secondary);">
                                <li>• <code>/admin</code> — Visão geral</li>
                                <li>• <code>/admin/leads</code> — Lista de contatos</li>
                                <li>• <code>/admin/posts</code> — Gerenciar artigos</li>
                            </ul>
                        </div>
                        <div style="background: white; padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
                            <div style="font-size: 0.6875rem; text-transform: uppercase; color: black; font-weight: 600; margin-bottom: 0.5rem;">📝 Edição</div>
                            <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.8125rem; color: var(--text-secondary);">
                                <li>• <code>/admin/posts/new</code> — Criar artigo</li>
                                <li>• <code>/admin/posts/[id]</code> — Editar artigo</li>
                                <li>• <code>/admin/categories</code> — Categorias</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="collapsible-item">
                        <button class="collapsible-trigger" onclick="this.parentElement.classList.toggle('open')">
                            <span class="bullet"></span>
                            <span>Como a proteção funciona?</span>
                            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                        <div class="collapsible-content">
                            <div class="collapsible-inner">
                                <strong>Middleware:</strong> O arquivo <code>src/middleware.ts</code> intercepta todas as requisições para <code>/admin/*</code>.<br><br>
                                <strong>Verificação:</strong> Se não houver sessão válida (usuário logado), redireciona para <code>/login</code>.<br><br>
                                <strong>Níveis de acesso:</strong> Apenas usuários com role <code>ADMIN</code> ou <code>EDITOR</code> podem modificar conteúdo.
                            </div>
                        </div>
                    </div>
                </div>

                <h2 id="code-03"><span style="color: var(--accent);">03.</span> Área Pública (Blog)</h2>
                <p>O conteúdo em <code>src/app/blog/</code> é visível para todos e otimizado para SEO:</p>
                
                <div class="feature-block">
                    <h3 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: black; font-weight: 600; margin-bottom: 0.5rem;">🌐 BLOG ZONE</h3>
                    <p style="font-size: 1.25rem; font-weight: 600; color: black; line-height: 1.4; margin-bottom: 1rem;">"O que o Google e os pacientes veem."</p>
                    
                    <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1rem;">
                        <div style="background: white; padding: 0.75rem 1rem; border: 1px solid var(--border); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); flex: 1; min-width: 150px;">
                            <div style="font-size: 1rem; margin-bottom: 0.25rem;">📄</div>
                            <strong style="font-size: 0.875rem; color: black;">/blog</strong>
                            <div style="font-size: 0.6875rem; color: black;">Lista de artigos</div>
                        </div>
                        <div style="background: white; padding: 0.75rem 1rem; border: 1px solid var(--border); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); flex: 1; min-width: 150px;">
                            <div style="font-size: 1rem; margin-bottom: 0.25rem;">📖</div>
                            <strong style="font-size: 0.875rem; color: black;">/blog/[slug]</strong>
                            <div style="font-size: 0.6875rem; color: black;">Artigo individual</div>
                        </div>
                        <div style="background: white; padding: 0.75rem 1rem; border: 1px solid var(--border); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); flex: 1; min-width: 150px;">
                            <div style="font-size: 1rem; margin-bottom: 0.25rem;">🏷️</div>
                            <strong style="font-size: 0.875rem; color: black;">/blog/categoria/[slug]</strong>
                            <div style="font-size: 0.6875rem; color: black;">Por categoria</div>
                        </div>
                    </div>
                    
                    <div class="collapsible-item">
                        <button class="collapsible-trigger" onclick="this.parentElement.classList.toggle('open')">
                            <span class="bullet"></span>
                            <span>Por que isso é bom para SEO?</span>
                            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                        <div class="collapsible-content">
                            <div class="collapsible-inner">
                                <strong>Server-Side Rendering (SSR):</strong> O HTML é gerado no servidor e entregue pronto ao Google — não precisa esperar JavaScript carregar.<br><br>
                                <strong>URLs amigáveis:</strong> <code>/blog/tratamento-bruxismo</code> é melhor que <code>/post?id=123</code> para ranqueamento.<br><br>
                                <strong>Meta tags dinâmicas:</strong> Cada artigo tem seu próprio <code>&lt;title&gt;</code> e <code>&lt;meta description&gt;</code> gerados automaticamente.
                            </div>
                        </div>
                    </div>
                </div>

                <h2 id="code-04"><span style="color: var(--accent);">04.</span> Componentes e APIs</h2>
                <p>Elementos reutilizáveis e endpoints do sistema:</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1.5rem 0;">
                    <div class="feature-block">
                        <h3 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: black; font-weight: 600; margin-bottom: 0.5rem;">🧩 COMPONENTS</h3>
                        <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.8125rem; color: var(--text-secondary);">
                            <li style="padding: 0.25rem 0;">• <code>Navbar</code> — Menu de navegação</li>
                            <li style="padding: 0.25rem 0;">• <code>Footer</code> — Rodapé</li>
                            <li style="padding: 0.25rem 0;">• <code>LeadForm</code> — Formulário de contato</li>
                            <li style="padding: 0.25rem 0;">• <code>TiptapEditor</code> — Editor de texto</li>
                            <li style="padding: 0.25rem 0;">• <code>WhatsAppButton</code> — Botão flutuante</li>
                        </ul>
                    </div>
                    
                    <div class="feature-block">
                        <h3 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: black; font-weight: 600; margin-bottom: 0.5rem;">🔌 API ROUTES</h3>
                        <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.8125rem; color: var(--text-secondary);">
                            <li style="padding: 0.25rem 0;">• <code>/api/leads</code> — CRUD de leads</li>
                            <li style="padding: 0.25rem 0;">• <code>/api/posts</code> — CRUD de artigos</li>
                            <li style="padding: 0.25rem 0;">• <code>/api/auth</code> — NextAuth</li>
                            <li style="padding: 0.25rem 0;">• <code>/api/upload</code> — Upload de imagens</li>
                            <li style="padding: 0.25rem 0;">• <code>/api/categories</code> — Categorias</li>
                        </ul>
                    </div>
                </div>

                <div class="callout">
                    <p><strong>💡 Resumo:</strong> A separação clara entre <strong style="color: #EF4444;">Admin</strong> (protegido), <strong style="color: var(--success);">Blog</strong> (público) e <strong style="color: var(--accent);">Components</strong> (reutilizável) permite que qualquer desenvolvedor futuro entenda e modifique o sistema rapidamente.</p>
                </div>
            `,
        },
        {
            id: "deployment",
            title: "Deploy & Infra",
            icon: "cloud",
            subsections: [
                { id: "deploy-01", num: "01", title: "O Que é Railway?" },
                { id: "deploy-02", num: "02", title: "Arquitetura na Nuvem" },
                { id: "deploy-03", num: "03", title: "Como Fazer Deploy" }
            ],
            content: `
                <!-- Hero Section -->
                <div style="margin-bottom: 2.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                        <div style="width: 48px; height: 48px; background: var(--bg-hover); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 1.5rem;">☁️</span>
                        </div>
                        <div>
                            <h1 style="margin: 0; font-size: 1.75rem;">Preparação para Deploy</h1>
                            <div style="font-size: 0.75rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em;">Infraestrutura em Nuvem</div>
                        </div>
                    </div>
                    
                    <p style="font-size: 1.125rem; color: var(--text-secondary); line-height: 1.7; margin-bottom: 1.5rem;">
                        <strong style="color: var(--text-primary);">Pronto para produção.</strong> O sistema está configurado para rodar no <strong style="color: black;">Railway</strong>, uma plataforma moderna que <strong style="color: black;">simplifica o deploy</strong> e <strong style="color: black;">escala automaticamente</strong>.
                    </p>
                </div>

                <!-- Status Cards -->
                <div class="card-grid">
                    <div class="stat-card">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.375rem;">
                            <span style="font-size: 1rem;">✅</span>
                            <div class="label" style="margin: 0;">Dockerfile</div>
                        </div>
                        <div class="value">Pronto e Otimizado</div>
                    </div>
                    <div class="stat-card">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.375rem;">
                            <span style="font-size: 1rem;">📄</span>
                            <div class="label" style="margin: 0;">Documentação</div>
                        </div>
                        <div class="value">RAILWAY_DEPLOYMENT.md</div>
                    </div>
                    <div class="stat-card">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.375rem;">
                            <span style="font-size: 1rem;">🗄️</span>
                            <div class="label" style="margin: 0;">Migrations</div>
                        </div>
                        <div class="value">Scripts Prontos</div>
                    </div>
                </div>

                <h2 id="deploy-01"><span style="color: var(--accent);">01.</span> O Que é Railway?</h2>
                <p>Railway é uma plataforma de hospedagem moderna que elimina a complexidade de gerenciar servidores:</p>
                
                <div class="feature-block">
                    <h3 style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: black; font-weight: 600; margin-bottom: 0.5rem;">🚂 RAILWAY</h3>
                    <p style="font-size: 1.25rem; font-weight: 600; color: black; line-height: 1.4; margin-bottom: 1rem;">"Faça deploy com um clique. Sem configurar servidor."</p>
                    
                    <!-- Before/After -->
                    <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 0.75rem; align-items: center; margin-bottom: 1.25rem;">
                        <div style="background: white; padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius-md); text-align: center; box-shadow: var(--shadow-sm);">
                            <div style="font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-tertiary); font-weight: 600; margin-bottom: 0.5rem;">😰 Hosting Tradicional</div>
                            <div style="font-size: 0.8125rem; color: var(--text-secondary);">SSH, Linux, Nginx, SSL...</div>
                        </div>
                        <div style="font-size: 1.25rem; color: var(--text-tertiary);">→</div>
                        <div style="background: var(--bg-active); padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius-md); text-align: center;">
                            <div style="font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-primary); font-weight: 600; margin-bottom: 0.5rem;">🚂 Railway</div>
                            <div style="font-size: 0.8125rem; color: var(--text-primary); font-weight: 500;">Conecta GitHub, faz deploy!</div>
                        </div>
                    </div>
                    
                    <div class="collapsible-item">
                        <button class="collapsible-trigger" onclick="this.parentElement.classList.toggle('open')">
                            <span class="bullet"></span>
                            <span>Vantagens do Railway</span>
                            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                        <div class="collapsible-content">
                            <div class="collapsible-inner">
                                <strong>Deploy automático:</strong> A cada commit no GitHub, o Railway re-deploya automaticamente.<br><br>
                                <strong>HTTPS grátis:</strong> Certificado SSL automático para seu domínio.<br><br>
                                <strong>Banco de dados integrado:</strong> PostgreSQL com 1 clique, já conectado ao app.<br><br>
                                <strong>Logs em tempo real:</strong> Veja erros e acessos diretamente no painel.
                            </div>
                        </div>
                    </div>
                </div>

                <h2 id="deploy-02"><span style="color: var(--accent);">02.</span> Arquitetura na Nuvem</h2>
                <p>Como os componentes ficam organizados na infraestrutura:</p>
                
                <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; margin: 1.5rem 0; box-shadow: var(--shadow-sm);">
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        <!-- Usuário -->
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div style="width: 60px; height: 60px; background: white; border: 1px solid var(--border); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; box-shadow: var(--shadow-sm);">🌐</div>
                            <div style="flex: 1;">
                                <strong style="color: var(--text-primary);">Usuário acessa seusite.com.br</strong>
                                <div style="font-size: 0.8125rem; color: var(--text-tertiary);">Domínio personalizado</div>
                            </div>
                        </div>
                        
                        <div style="text-align: center; color: var(--text-tertiary); font-weight: 800;">↓</div>
                        
                        <!-- Railway -->
                        <div style="display: flex; align-items: center; gap: 1rem; background: var(--bg-hover); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem;">
                            <div style="width: 60px; height: 60px; background: white; border-radius: var(--radius-sm); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0;">🚂</div>
                            <div style="flex: 1;">
                                <strong style="color: var(--text-primary);">Railway (Região: US-West)</strong>
                                <div style="font-size: 0.8125rem; color: var(--text-secondary);">Orquestra os serviços abaixo:</div>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-left: 2rem;">
                            <div style="display: flex; align-items: center; gap: 0.75rem; background: white; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); box-shadow: var(--shadow-sm);">
                                <div style="width: 40px; height: 40px; background: var(--text-primary); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.875rem;">N</div>
                                <div>
                                    <strong style="font-size: 0.875rem; color: var(--text-primary);">Next.js App</strong>
                                    <div style="font-size: 0.6875rem; color: var(--text-tertiary);">Container Docker</div>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.75rem; background: white; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); box-shadow: var(--shadow-sm);">
                                <div style="width: 40px; height: 40px; background: white; border: 1px solid var(--border); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">🐘</div>
                                <div>
                                    <strong style="font-size: 0.875rem; color: var(--text-primary);">PostgreSQL</strong>
                                    <div style="font-size: 0.6875rem; color: var(--text-tertiary);">Banco gerenciado</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <h2 id="deploy-03"><span style="color: var(--accent);">03.</span> Como Fazer Deploy</h2>
                <p>Passo a passo simplificado (detalhes completos em <code>RAILWAY_DEPLOYMENT.md</code>):</p>
                
                <div style="display: flex; flex-direction: column; gap: 0.75rem; margin: 1.5rem 0;">
                    <div style="display: flex; align-items: center; gap: 1rem; background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem; box-shadow: var(--shadow-sm);">
                        <div style="width: 32px; height: 32px; background: var(--bg-hover); color: var(--text-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; flex-shrink: 0;">1</div>
                        <div>
                            <strong style="color: var(--text-primary);">Criar projeto no Railway</strong>
                            <div style="font-size: 0.8125rem; color: var(--text-secondary);">Acesse railway.app → New Project → Deploy from GitHub repo</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem; background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem; box-shadow: var(--shadow-sm);">
                        <div style="width: 32px; height: 32px; background: var(--bg-hover); color: var(--text-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; flex-shrink: 0;">2</div>
                        <div>
                            <strong style="color: var(--text-primary);">Adicionar PostgreSQL</strong>
                            <div style="font-size: 0.8125rem; color: var(--text-secondary);">New Service → Database → PostgreSQL → Railway gera a DATABASE_URL</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem; background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem; box-shadow: var(--shadow-sm);">
                        <div style="width: 32px; height: 32px; background: var(--bg-hover); color: var(--text-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; flex-shrink: 0;">3</div>
                        <div>
                            <strong style="color: var(--text-primary);">Configurar variáveis de ambiente</strong>
                            <div style="font-size: 0.8125rem; color: var(--text-secondary);"><code>DATABASE_URL</code>, <code>NEXTAUTH_SECRET</code>, <code>NEXTAUTH_URL</code></div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem; background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem; box-shadow: var(--shadow-sm);">
                        <div style="width: 32px; height: 32px; background: var(--bg-hover); color: var(--text-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; flex-shrink: 0;">4</div>
                        <div>
                            <strong style="color: var(--text-primary);">Rodar migrations</strong>
                            <div style="font-size: 0.8125rem; color: var(--text-secondary);"><code>npx prisma migrate deploy</code> via Railway CLI ou terminal integrado</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem; background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1rem; box-shadow: var(--shadow-sm);">
                        <div style="width: 32px; height: 32px; background: var(--success); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; flex-shrink: 0;">✓</div>
                        <div>
                            <strong style="color: var(--text-primary);">Site no ar!</strong>
                            <div style="font-size: 0.8125rem; color: var(--text-secondary);">Acesse a URL temporária do Railway ou configure seu domínio</div>
                        </div>
                    </div>
                </div>

                <div class="callout">
                    <p><strong>💡 Resumo:</strong> Railway remove toda a complexidade de servidores. Você foca no negócio, e a plataforma cuida de SSL, backups, escalabilidade e deploy automático.</p>
                </div>
            `,
        },
        {
            id: "roadmap",
            title: "Roadmap Evolutivo",
            icon: "map",
            subsections: [
                { id: "road-01", num: "01", title: "Melhorias Críticas" },
                { id: "road-02", num: "02", title: "Funcionalidades Desejáveis" },
                { id: "road-03", num: "03", title: "Visão de Longo Prazo" }
            ],
            content: `
                <!-- Hero Section -->
                <div style="margin-bottom: 2.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                        <div style="width: 48px; height: 48px; background: var(--bg-hover); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 1.5rem;">🗺️</span>
                        </div>
                        <div>
                            <h1 style="margin: 0; font-size: 1.75rem;">Plano de Evolução</h1>
                            <div style="font-size: 0.75rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em;">Roadmap de Melhorias</div>
                        </div>
                    </div>
                    
                    <p style="font-size: 1.125rem; color: var(--text-secondary); line-height: 1.7; margin-bottom: 1.5rem;">
                        <strong style="color: var(--text-primary);">O sistema está funcional, mas pode evoluir.</strong> Abaixo estão <strong style="color: black;">melhorias sugeridas</strong> para tornar a plataforma ainda mais poderosa e automatizada.
                    </p>
                </div>

                <!-- Legend -->
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 12px; height: 12px; background: #EF4444; border-radius: 50%;"></div>
                        <span style="font-size: 0.75rem; color: var(--text-secondary);">Crítico</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 12px; height: 12px; background: var(--warning); border-radius: 50%;"></div>
                        <span style="font-size: 0.75rem; color: var(--text-secondary);">Alta Prioridade</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 12px; height: 12px; background: var(--accent); border-radius: 50%;"></div>
                        <span style="font-size: 0.75rem; color: var(--text-secondary);">Média Prioridade</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 12px; height: 12px; background: #9CA3AF; border-radius: 50%;"></div>
                        <span style="font-size: 0.75rem; color: var(--text-secondary);">Futuro</span>
                    </div>
                </div>

                <h2 id="road-01"><span style="color: var(--accent);">01.</span> Melhorias Críticas</h2>
                <p>Itens que devem ser implementados para garantir a estabilidade em produção:</p>
                
                <div class="feature-block">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <span style="background: #EF4444; color: white; font-size: 0.625rem; padding: 0.25rem 0.5rem; border-radius: var(--radius-sm); font-weight: 600; text-transform: uppercase;">Crítico</span>
                    </div>
                    <h3 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">☁️ Persistência de Mídia (S3/R2)</h3>
                    <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem;">Atualmente, imagens enviadas ficam armazenadas localmente no container. Se o container reiniciar, as imagens são perdidas.</p>
                    
                    <div class="collapsible-item">
                        <button class="collapsible-trigger" onclick="this.parentElement.classList.toggle('open')">
                            <span class="bullet"></span>
                            <span>O que precisa ser feito?</span>
                            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                        <div class="collapsible-content">
                            <div class="collapsible-inner">
                                <strong>Solução:</strong> Integrar AWS S3 ou Cloudflare R2 para armazenamento permanente em nuvem.<br><br>
                                <strong>Impacto:</strong> Imagens de artigos e mídia do blog nunca serão perdidas.<br><br>
                                <strong>Esforço estimado:</strong> 4-8 horas de desenvolvimento.
                            </div>
                        </div>
                    </div>
                </div>

                <div class="feature-block">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <span style="background: var(--warning); color: var(--text-primary); border-radius: var(--radius-sm); font-size: 0.625rem; padding: 0.25rem 0.5rem; font-weight: 600; text-transform: uppercase;">Alta</span>
                    </div>
                    <h3 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">📧 Notificações de Novos Leads</h3>
                    <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem;">Hoje, leads chegam silenciosamente ao painel. A recepção precisa verificar manualmente.</p>
                    
                    <div class="collapsible-item">
                        <button class="collapsible-trigger" onclick="this.parentElement.classList.toggle('open')">
                            <span class="bullet"></span>
                            <span>O que precisa ser feito?</span>
                            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                        <div class="collapsible-content">
                            <div class="collapsible-inner">
                                <strong>Solução:</strong> Integrar serviço de e-mail (Resend, SendGrid ou Nodemailer) para disparar alerta instantâneo quando um lead chegar.<br><br>
                                <strong>Impacto:</strong> A recepção é notificada em segundos, aumentando a taxa de conversão por resposta rápida.<br><br>
                                <strong>Esforço estimado:</strong> 2-4 horas de desenvolvimento.
                            </div>
                        </div>
                    </div>
                </div>

                <h2 id="road-02"><span style="color: var(--accent);">02.</span> Funcionalidades Desejáveis</h2>
                <p>Melhorias que agregariam valor significativo ao sistema:</p>
                
                <div class="feature-block">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <span style="background: var(--accent); color: white; border-radius: var(--radius-sm); font-size: 0.625rem; padding: 0.25rem 0.5rem; font-weight: 600; text-transform: uppercase;">Média</span>
                    </div>
                    <h3 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">📊 Dashboard com Gráficos (BI)</h3>
                    <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem;">Visualização de dados com gráficos: leads por mês, origem de tráfego, taxa de conversão.</p>
                </div>

                <div class="feature-block">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <span style="background: var(--accent); color: white; border-radius: var(--radius-sm); font-size: 0.625rem; padding: 0.25rem 0.5rem; font-weight: 600; text-transform: uppercase;">Média</span>
                    </div>
                    <h3 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">📅 Agendamento de Publicações</h3>
                    <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem;">Criar artigo hoje e programar para publicar em data futura automaticamente.</p>
                </div>

                <div class="feature-block">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <span style="background: var(--accent); color: white; border-radius: var(--radius-sm); font-size: 0.625rem; padding: 0.25rem 0.5rem; font-weight: 600; text-transform: uppercase;">Média</span>
                    </div>
                    <h3 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">🔍 Campo "Como nos conheceu?"</h3>
                    <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem;">Adicionar pergunta no formulário de contato para capturar origem quando não há UTM (indicações).</p>
                </div>

                <h2 id="road-03"><span style="color: var(--accent);">03.</span> Visão de Longo Prazo</h2>
                <p>Possibilidades para crescimento futuro da plataforma:</p>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1.5rem 0;">
                    <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.5rem; box-shadow: var(--shadow-sm);">
                        <div style="font-size: 1.5rem; margin-bottom: 0.5rem; opacity: 0.8;">🤖</div>
                        <strong style="font-size: 0.875rem; color: var(--text-primary);">Chatbot WhatsApp</strong>
                        <p style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 0.25rem;">Respostas automáticas para perguntas frequentes</p>
                    </div>
                    <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.5rem; box-shadow: var(--shadow-sm);">
                        <div style="font-size: 1.5rem; margin-bottom: 0.5rem; opacity: 0.8;">🌐</div>
                        <strong style="font-size: 0.875rem; color: var(--text-primary);">Múltiplas Unidades</strong>
                        <p style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 0.25rem;">Expandir para gerenciar várias clínicas</p>
                    </div>
                    <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.5rem; box-shadow: var(--shadow-sm);">
                        <div style="font-size: 1.5rem; margin-bottom: 0.5rem; opacity: 0.8;">📱</div>
                        <strong style="font-size: 0.875rem; color: var(--text-primary);">App Mobile</strong>
                        <p style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 0.25rem;">Gerenciar leads pelo celular</p>
                    </div>
                    <div style="background: white; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.5rem; box-shadow: var(--shadow-sm);">
                        <div style="font-size: 1.5rem; margin-bottom: 0.5rem; opacity: 0.8;">🧠</div>
                        <strong style="font-size: 0.875rem; color: var(--text-primary);">IA para Conteúdo</strong>
                        <p style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 0.25rem;">Sugestões de artigos baseadas em buscas</p>
                    </div>
                </div>

                <div class="callout">
                    <p><strong>💡 Próximos passos:</strong> Recomendamos priorizar as melhorias <strong style="color: black;">críticas</strong> primeiro (S3 + Notificações), depois avançar para as funcionalidades <strong style="color: black;">desejáveis</strong> conforme necessidade e orçamento.</p>
                </div>
            `,
        },
    ],
};
