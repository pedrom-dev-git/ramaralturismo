# R. Amaral — Projeto de Turismo e Transporte

> Projeto extraído do Figma (R amaral)
> Arquivo: [R amaral](https://www.figma.com/proto/pxCxtAsVGsQj5MxlghwW75/R-amaral?node-id=45-4946)
> Última atualização Figma: 24/02/2026

---

## Informações do Projeto

| Campo             | Valor                                          |
|-------------------|------------------------------------------------|
| Marca             | **R. Amaral**                                  |
| Segmento          | Turismo e Transporte Escolar                   |
| Telefone/WhatsApp | +48 999503368                                  |
| Tipo              | Website / Landing Page                         |
| Canvas            | 1440 × 5864 px (Desktop)                       |
| File ID (Figma)   | `pxCxtAsVGsQj5MxlghwW75`                       |

---

## Paleta de Cores

| Nome              | Hex (aprox.)  | Uso                                  |
|-------------------|---------------|--------------------------------------|
| Primary (Azul)    | `#0138AD`     | Headlines, CTAs, ícones, WhatsApp     |
| Accent (Vermelho) | `#9D0013`     | Destaques, CTAs secundários           |
| Dark (Navbar)     | `#143E58`     | Fundo da navbar / header             |
| White             | `#FFFFFF`     | Fundo principal, cards, textos       |
| Light Gray        | `#F5F5F5`     | Fundo seções alternadas              |
| Dark Gray         | `#333333`     | Texto principal (body)               |
| Medium Gray       | `#666666`     | Texto secundário / descrições        |
| Light Blue (icon) | `#DCF0F7`     | Fundo dos ícones de benefícios       |
| Footer Dark       | `#143E58`     | Fundo do footer / Feature News       |

---

## Tipografia

| Estilo         | Família (aprox.) | Peso      | Tamanho (aprox.) | Uso                          |
|----------------|------------------|-----------|-------------------|------------------------------|
| Hero Title     | Sans-serif       | Bold      | 36-42px           | "Sua Jornada Começa Aqui!"   |
| Section Title  | Sans-serif       | Bold      | 24-28px           | Títulos de seção (uppercase) |
| Card Title     | Sans-serif       | SemiBold  | 16-18px           | Títulos de cards/serviços    |
| Body           | Sans-serif       | Regular   | 14-16px           | Texto corrido/descrições     |
| Caption        | Sans-serif       | Regular   | 12-13px           | Legendas, sub-textos         |
| Nav Links      | Sans-serif       | Regular   | 14px              | Menu de navegação            |

---

## Seções da Página (Top → Bottom)

### 1. Header / Navbar
- Logo: **R. Amaral** (texto branco, fundo escuro)
- Menu: Home | Destinations | Blog | News | Contact
- Fundo: overlay escuro semi-transparente sobre hero

### 2. Hero Section
- Imagem de fundo: Van/micro-ônibus com passageiros em paisagem montanhosa
- Telefone no topo: WhatsApp icon + **+48 999503368**
- Card branco sobreposto com:
  - Headline: **"Sua Jornada Começa Aqui!"** (azul)
  - Subtítulo: "Atendimento personalizado para transporte escolar e viagens em grupo."
  - Formulário inline com 4 campos:
    - Tipo de serviço (Escolar / Turismo)
    - Origem (Add dates)
    - Destino (Add dates)
    - Solicitar Orçamento no WhatsApp (botão azul circular)

### 3. Por Que Escolher a Nossa Van?
- 4 cards com ícones azul claro:
  - **Segurança em primeiro lugar** — Veículo vistoriado e regularizado
  - **Pontualidade** — Compromisso com horários
  - **Conforto** — Ar-condicionado, espaço e comodidade
  - **Atendimento rápido** — Ar-condicionado, espaço e comodidade

### 4. Nossos Parceiros
- Carousel/barra horizontal com logos de parceiros:
  - Cozybnb | Serendipity | Hideaway | Earthly | The Nook | Hon...

### 5. Nossos Serviços
- 2 cards com imagens:
  - **Transporte Escolar** (imagem de café da manhã/serviço)
  - **Turismo e Viagens** (imagem de van na estrada) + "saiba mais"
- Botão: **"See all →"** (outlined)

### 6. Feature News
- Fundo escuro
- Carousel de notícias com setas de navegação (< >)
- Cards com imagens de destinos turísticos (praia, resort)

---

## Componentes Identificados

| Componente              | Tipo         | Notas                              |
|-------------------------|--------------|-------------------------------------|
| Navbar                  | Header       | Fundo escuro, logo + 5 links       |
| Hero Card               | Card         | Branco, formulário inline           |
| WhatsApp CTA            | Botão        | Circular, azul, ícone WhatsApp      |
| Benefit Card            | Card         | Ícone azul claro + título + texto   |
| Partner Logo            | Logo/Imagem  | Carousel horizontal                 |
| Service Card            | Card         | Imagem + título + "saiba mais"      |
| See All Button          | Botão        | Outlined, com seta                  |
| News Card               | Card         | Imagem + conteúdo (fundo escuro)    |
| Carousel Arrows         | Navegação    | Setas < > para Feature News         |

---

## Ícones Necessários

| Ícone                  | Uso                          | Formato  |
|------------------------|------------------------------|----------|
| WhatsApp               | CTA hero + telefone          | SVG      |
| Segurança (escudo)     | Card benefício               | SVG      |
| Pontualidade (relógio) | Card benefício               | SVG      |
| Conforto (ar-cond.)    | Card benefício               | SVG      |
| Atendimento (raio)     | Card benefício               | SVG      |
| Seta direita           | Botão "See all"              | SVG      |
| Seta navegação         | Carousel news                | SVG      |

---

## Imagens Necessárias

| Imagem                      | Seção         | Localização              |
|-----------------------------|---------------|--------------------------|
| Van com passageiros         | Hero          | `assets/images/hero/`    |
| Café da manhã / serviço     | Serviços      | `assets/images/gallery/` |
| Van na estrada              | Serviços      | `assets/images/gallery/` |
| Destino praia 1             | Feature News  | `assets/images/gallery/` |
| Destino resort              | Feature News  | `assets/images/gallery/` |
| Destino praia 2             | Feature News  | `assets/images/gallery/` |
| Logo R. Amaral                 | Navbar        | `assets/images/logos/`   |
| Logos parceiros (6+)        | Parceiros     | `assets/images/logos/`   |

---

## Estrutura de Pastas

```
projeto-turismo/
├── assets/
│   ├── fonts/
│   ├── images/
│   │   ├── hero/        → Van com passageiros (hero background)
│   │   ├── gallery/     → Fotos de serviços, destinos, news
│   │   ├── icons/       → WhatsApp, escudo, relógio, etc.
│   │   └── logos/       → R. Amaral + logos parceiros
│   └── videos/
├── design/
│   ├── exports/
│   │   ├── components/
│   │   ├── screens/
│   │   └── icons/
│   └── figma/
├── docs/
├── public/
├── src/
│   ├── components/      → Navbar, HeroCard, BenefitCard, ServiceCard, etc.
│   ├── hooks/
│   ├── pages/
│   ├── styles/
│   └── utils/
├── ASSETS.md
└── README.md
```
