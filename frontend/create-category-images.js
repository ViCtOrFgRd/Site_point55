const fs = require('fs');
const path = require('path');

// Criar diretório se não existir
const dir = path.join(__dirname, 'public', 'images', 'categories');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Configurações das categorias
const categories = [
  {
    slug: 'roupas-femininas',
    nome: 'Roupas Femininas',
    emoji: '👗',
    color: '#FFB6C1',
  },
  {
    slug: 'roupas-masculinas',
    nome: 'Roupas Masculinas',
    emoji: '👔',
    color: '#4A90E2',
  },
  {
    slug: 'acessorios',
    nome: 'Acessórios',
    emoji: '👜',
    color: '#F5A623',
  },
  {
    slug: 'calcados',
    nome: 'Calçados',
    emoji: '👟',
    color: '#9B59B6',
  },
  {
    slug: 'calcas',
    nome: 'Calças',
    emoji: '👖',
    color: '#7B68EE',
  },
  {
    slug: 'camisas',
    nome: 'Camisas',
    emoji: '👕',
    color: '#FF6B6B',
  },
  {
    slug: 'tenis',
    nome: 'Tênis',
    emoji: '👟',
    color: '#4ECDC4',
  },
  {
    slug: 'outros',
    nome: 'Outros',
    emoji: '🛍️',
    color: '#FF69B4',
  },
];

// Criar SVG para cada categoria
categories.forEach((category) => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad_${category.slug}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${category.color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${adjustColorBrightness(category.color, -30)};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Fundo gradiente -->
  <rect width="400" height="300" fill="url(#grad_${category.slug})" />
  
  <!-- Emoji no centro -->
  <text x="200" y="120" font-size="80" text-anchor="middle" dominant-baseline="middle">
    ${category.emoji}
  </text>
  
  <!-- Nome da categoria -->
  <text x="200" y="230" font-size="28" font-weight="bold" text-anchor="middle" fill="white" font-family="Arial, sans-serif">
    ${category.nome}
  </text>
</svg>`;

  const filename = path.join(dir, `${category.slug}.svg`);
  fs.writeFileSync(filename, svg, 'utf8');
  console.log(`✅ Criada: ${filename}`);
});

console.log('✅ Todas as imagens de categorias foram criadas como SVG!');

// Função auxiliar para ajustar brilho da cor
function adjustColorBrightness(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return '#' + [R, G, B].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}
