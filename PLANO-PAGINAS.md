# Plano: Páginas Restantes do Site R. Amaral

## Contexto
O site atualmente é uma single-page (landing page) com seções: Navbar → Hero → Benefits → Partners → Services → NewsCarousel → Footer. A empresa R. Amaral fica em **Tijucas, SC** e atua com transporte escolar, turismo em grupo e corporativo. Os links da navbar (Destinos, Blog, Novidades, Contato) apontam para anchors `#` que ainda não existem como páginas reais.

O objetivo é expandir para um site multi-página completo, aproveitando a localização estratégica de Tijucas (entre Florianópolis e Balneário Camboriú, próxima a Bombinhas, Porto Belo, Beto Carrero World).

---

## Páginas a Criar

### 1. `/destinos` — Destinos Populares
**Propósito:** Mostrar os destinos turísticos que a empresa atende saindo de Tijucas/região.

**Conteúdo:**
- Hero menor com título "Nossos Destinos" + subtítulo sobre a localização privilegiada de Tijucas
- Grid de cards de destinos com imagem, nome, distância aproximada de Tijucas e breve descrição:
  - **Balneário Camboriú** (~30 min) — Praia, teleférico, vida noturna
  - **Bombinhas** (~40 min) — Capital do mergulho, praias paradisíacas
  - **Florianópolis** (~1h) — Ilha da Magia, 42 praias
  - **Beto Carrero World** (~1h30) — Maior parque temático da América Latina
  - **Penha / Praia de Armação** (~1h) — Praias tranquilas, turismo familiar
  - **Porto Belo** (~20 min) — Ilha de Porto Belo, mergulho
  - **Praia do Rosa** (~2h30) — Observação de baleias, natureza
  - **Serra Catarinense (Urubici/São Joaquim)** (~3h30) — Frio, neve, vinícolas
  - **Blumenau** (~1h30) — Oktoberfest, cultura alemã, cervejarias
  - **Gramado/Canela (RS)** (~5h) — Serra Gaúcha, chocolate, inverno
- CTA em cada card: "Solicitar Orçamento" → WhatsApp com destino pré-preenchido
- Seção final: mapa embed mostrando Tijucas como ponto central

**Componentes novos:**
- `DestinationCard.astro` — card reutilizável (imagem, título, distância, descrição, CTA)
- `PageHero.astro` — hero reutilizável para páginas internas (título + subtítulo + breadcrumb)

**Arquivo:** `src/pages/destinos.astro`

---

### 2. `/servicos` — Detalhes dos Serviços
**Propósito:** Expandir os 2 cards da landing page em descrições completas dos 3 serviços.

**Conteúdo:**
- PageHero com "Nossos Serviços"
- 3 seções alternadas (bg-white / bg-light-gray) com layout imagem + texto:

  **Transporte Escolar:**
  - Rotas em Tijucas e municípios vizinhos (Canelinha, São João Batista, Nova Trento, Itapema)
  - Destaques: motorista habilitado e treinado, veículo vistoriado, monitoramento de rota, contato direto com pais via WhatsApp
  - Lista de escolas atendidas (reaproveitar dados do `escola-select` no Hero)

  **Turismo e Viagens em Grupo:**
  - Excursões para destinos do litoral e serra catarinense
  - Viagens de igreja, terceira idade, empresas, confraternizações
  - Veículos com ar-condicionado, Wi-Fi, poltronas reclináveis

  **Corporativo:**
  - Transfer executivo, eventos empresariais, convenções
  - Transporte de funcionários (rota fixa ou sob demanda)
  - Atendimento na Grande Florianópolis e Vale do Itajaí

- CTA por serviço → WhatsApp com tipo de serviço pré-preenchido

**Arquivo:** `src/pages/servicos.astro`

---

### 3. `/contato` — Página de Contato
**Propósito:** Centralizar formas de contato e mostrar localização física.

**Conteúdo:**
- PageHero com "Fale Conosco"
- Grid 2 colunas:
  - **Coluna esquerda:** Informações de contato
    - Endereço em Tijucas, SC (Rua a definir ou genérico "Tijucas, SC - Brasil")
    - Telefone/WhatsApp: +48 999503368
    - E-mail: contato@ramaral.com.br
    - Horário de atendimento: Seg-Sex 7h-19h, Sáb 8h-12h
    - Links para redes sociais (Instagram, Facebook, WhatsApp)
  - **Coluna direita:** Google Maps embed de Tijucas, SC
- Seção FAQ (perguntas frequentes):
  - "Qual a área de atendimento?" → Tijucas e região (Grande Florianópolis, Vale do Itajaí, litoral norte SC)
  - "Como solicito um orçamento?" → Pelo formulário do site ou WhatsApp direto
  - "Vocês fazem viagens para fora de SC?" → Sim, atendemos RS, PR e outros estados
  - "Quantos passageiros cabem?" → Veículos de 15 a 20 lugares
  - "O transporte escolar é regularizado?" → Sim, veículos vistoriados conforme legislação

**Arquivo:** `src/pages/contato.astro`

---

### 4. `/blog` — Blog / Novidades
**Propósito:** Conteúdo para SEO e engajamento. Posts sobre destinos, dicas de viagem, notícias da empresa.

**Conteúdo:**
- PageHero com "Blog"
- Grid de cards de posts (imagem, título, data, resumo, tag de categoria)
- Categorias: Destinos, Dicas de Viagem, Notícias, Transporte Escolar
- Posts iniciais (conteúdo estático — sem CMS por enquanto):
  1. "5 praias imperdíveis perto de Tijucas"
  2. "Guia completo: Beto Carrero World saindo de Tijucas"
  3. "Transporte escolar seguro: o que os pais devem exigir"
  4. "Serra Catarinense no inverno: roteiro de 3 dias"
- Página individual de post: `src/pages/blog/[slug].astro`

**Componentes novos:**
- `BlogCard.astro` — card de preview do post
- Layout de post individual reutilizando `BaseLayout`

**Arquivos:**
- `src/pages/blog/index.astro` (listagem)
- `src/pages/blog/[slug].astro` (post individual)
- `src/data/posts.ts` (array de posts estáticos)

---

### 5. `/sobre` — Quem Somos
**Propósito:** Gerar confiança, humanizar a marca, contar a história da empresa.

**Conteúdo:**
- PageHero com "Quem Somos"
- Seção "Nossa História":
  - Empresa de Tijucas, SC
  - Atuação na região do Vale do Itajaí e litoral catarinense
  - Compromisso com segurança e atendimento personalizado
- Seção "Nossos Números" (counters animados):
  - X anos de experiência
  - X passageiros transportados
  - X destinos atendidos
  - X escolas parceiras
- Seção "Nossa Frota":
  - Cards dos veículos com especificações (capacidade, ar-condicionado, etc.)
- Seção de depoimentos/avaliações de clientes
- CTA final → WhatsApp

**Arquivo:** `src/pages/sobre.astro`

---

## Alterações em Arquivos Existentes

### Navbar (`src/components/Navbar.astro`)
Atualizar links para apontar às novas páginas:
```js
const links = [
  { label: "Home", href: "/" },
  { label: "Destinos", href: "/destinos" },
  { label: "Serviços", href: "/servicos" },
  { label: "Blog", href: "/blog" },
  { label: "Sobre", href: "/sobre" },
  { label: "Contato", href: "/contato" },
];
```

### Footer (`src/components/Footer.astro`)
Mesma atualização de links + adicionar endereço completo de Tijucas.

### BaseLayout (`src/layouts/BaseLayout.astro`)
- Adicionar `WhatsAppButton` (botão flutuante) — componente já existe mas não está importado
- Adicionar prop `page` para controlar active state na navbar

---

## Componentes Reutilizáveis Novos

| Componente | Descrição |
|---|---|
| `PageHero.astro` | Hero compacto para páginas internas (título, subtítulo, breadcrumb opcional) |
| `DestinationCard.astro` | Card de destino (imagem, nome, distância, CTA) |
| `BlogCard.astro` | Card de post do blog (imagem, título, data, resumo) |
| `FAQ.astro` | Accordion de perguntas frequentes |
| `Counter.astro` | Número animado para seção "Nossos Números" |

---

## Ordem de Implementação Sugerida

1. **`PageHero.astro`** — componente base reutilizado por todas as páginas
2. **`/destinos`** — página mais impactante para conversão (destinos reais da região)
3. **`/servicos`** — detalha os 3 tipos de serviço
4. **`/contato`** — essencial para conversão
5. **`/sobre`** — confiança e branding
6. **`/blog`** — SEO e conteúdo (mais complexo por ter sub-rotas)
7. **Atualizar Navbar + Footer** — após todas as páginas existirem

## Verificação
```bash
npm run build        # Garantir que todas as páginas geram HTML estático
npm run preview      # Verificar navegação entre páginas
npm test             # Testes existentes continuam passando
```
Para cada página nova, criar teste E2E correspondente em `tests/<pagina>.spec.ts`.
