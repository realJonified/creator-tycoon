// Häuser: das erste ist kostenlos, danach 50.000 und jedes weitere × 10.
// Jedes Haus: Aufrufe × BALANCE.houseMult und Platz für bessere Geräte (siehe gear.js "house").
// Aussehen: wall/roof = Farben, floors = Stockwerke, width = Breite (1–3),
// roof = giebel | flach | kuppel | turm, sky = Himmel, ground = Boden, deco = Emoji daneben.
export const HOUSES = [
  { id: 'gartenhaus',  icon: '🛖', name: 'Gartenhäuschen',     price: 0,    wall: '#c8a27a', roof: '#7a4b2a', floors: 1, width: 1, roof_: 'giebel', sky: '#bfe3ff', ground: '#7ccf6b', deco: '🌻' },
  { id: 'reihenhaus',  icon: '🏠', name: 'Reihenhaus',         price: 5e4,  wall: '#e8d5b5', roof: '#b5432f', floors: 2, width: 1, roof_: 'giebel', sky: '#bfe3ff', ground: '#7ccf6b', deco: '🌳' },
  { id: 'altbau',      icon: '🏘️', name: 'Altbauwohnung',      price: 5e5,  wall: '#d9c3a0', roof: '#5b6b7a', floors: 3, width: 2, roof_: 'flach',  sky: '#c9e6ff', ground: '#9aa4ad', deco: '🚲' },
  { id: 'familie',     icon: '🏡', name: 'Familienhaus',       price: 5e6,  wall: '#f2efe6', roof: '#2f6db5', floors: 2, width: 2, roof_: 'giebel', sky: '#bfe3ff', ground: '#6fc35d', deco: '🌷' },
  { id: 'loft',        icon: '🏭', name: 'Loft am Fluss',      price: 5e7,  wall: '#a65a3c', roof: '#3d3d46', floors: 3, width: 3, roof_: 'flach',  sky: '#b4dcff', ground: '#5aa9e6', deco: '⛵' },
  { id: 'strand',      icon: '🏖️', name: 'Strandhaus',         price: 5e8,  wall: '#ffffff', roof: '#29b6c9', floors: 2, width: 2, roof_: 'flach',  sky: '#9fd8ff', ground: '#f3d98b', deco: '🌴' },
  { id: 'chalet',      icon: '🏔️', name: 'Bergchalet',         price: 5e9,  wall: '#8b5a34', roof: '#e9eef2', floors: 2, width: 2, roof_: 'giebel', sky: '#d6ecff', ground: '#eef4f8', deco: '🌲' },
  { id: 'stadtvilla',  icon: '🏛️', name: 'Stadtvilla',         price: 5e10, wall: '#f4ead2', roof: '#6b4a8f', floors: 3, width: 3, roof_: 'giebel', sky: '#c0e2ff', ground: '#7fcf72', deco: '⛲' },
  { id: 'penthouse',   icon: '🌆', name: 'Penthouse',          price: 5e11, wall: '#3b4a63', roof: '#ffd166', floors: 5, width: 2, roof_: 'flach',  sky: '#ffb88a', ground: '#4b5563', deco: '🚁' },
  { id: 'glaspalast',  icon: '💠', name: 'Glaspalast',         price: 5e12, wall: '#9fe3f5', roof: '#3fa7c9', floors: 4, width: 3, roof_: 'kuppel', sky: '#bfe9ff', ground: '#86d27a', deco: '🦢' },
  { id: 'insel',       icon: '🏝️', name: 'Inselvilla',         price: 5e13, wall: '#fff7e0', roof: '#e07a3f', floors: 3, width: 3, roof_: 'giebel', sky: '#8fd3ff', ground: '#33b3d6', deco: '🐬' },
  { id: 'burg',        icon: '🏰', name: 'Burg Klickenstein',  price: 5e14, wall: '#a8a29e', roof: '#7f1d1d', floors: 4, width: 3, roof_: 'turm',   sky: '#c7d8ea', ground: '#5e9e4f', deco: '🐴' },
  { id: 'hochhaus',    icon: '🏙️', name: 'Wolkenkratzer',      price: 5e15, wall: '#5b7fa6', roof: '#c0d4e8', floors: 9, width: 2, roof_: 'turm',   sky: '#a7d3ff', ground: '#6b7280', deco: '🚕' },
  { id: 'kuppel',      icon: '🫧', name: 'Unterwasserkuppel',  price: 5e16, wall: '#64d2c8', roof: '#c4f1ff', floors: 2, width: 3, roof_: 'kuppel', sky: '#1f6fa8', ground: '#e8c97a', deco: '🐠' },
  { id: 'vulkan',      icon: '🌋', name: 'Vulkanfestung',      price: 5e17, wall: '#3f3f46', roof: '#f97316', floors: 4, width: 3, roof_: 'turm',   sky: '#7c2d12', ground: '#292524', deco: '🔥' },
  { id: 'schwebe',     icon: '☁️', name: 'Schwebende Insel',   price: 5e18, wall: '#f5f3ff', roof: '#a78bfa', floors: 3, width: 2, roof_: 'kuppel', sky: '#c4b5fd', ground: '#ffffff', deco: '🦄' },
  { id: 'mond',        icon: '🌙', name: 'Mondbasis',          price: 5e19, wall: '#d1d5db', roof: '#93c5fd', floors: 2, width: 3, roof_: 'kuppel', sky: '#0b1026', ground: '#9ca3af', deco: '🛰️' },
  { id: 'mars',        icon: '🔴', name: 'Marsstation',        price: 5e20, wall: '#fde2d2', roof: '#ef4444', floors: 3, width: 3, roof_: 'kuppel', sky: '#3b0d0d', ground: '#b4532a', deco: '🤖' },
  { id: 'raumstation', icon: '🛸', name: 'Raumstation Orbita', price: 5e21, wall: '#e5e7eb', roof: '#22d3ee', floors: 3, width: 3, roof_: 'turm',   sky: '#05060f', ground: '#1e1b4b', deco: '🪐' },
  { id: 'sternschloss', icon: '✨', name: 'Sternenschloss',    price: 5e22, wall: '#fef3c7', roof: '#f59e0b', floors: 5, width: 3, roof_: 'turm',   sky: '#1e1046', ground: '#4c1d95', deco: '🌠' },
];
