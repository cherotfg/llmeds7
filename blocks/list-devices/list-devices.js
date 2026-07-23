// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  { name: 'iPhone 17 Pro Max', description: 'Apple flagship on an M1 plan with $632 off, 600GB data, and $0.99/day roaming.', image_url: 'https://mcprod.m1.com.sg/media/catalog/product/5/3/530-iphone_17_pro_max_cosmic_orange_1_1.jpg?quality=80&bg-color=255,255,255&fit=bounds&height=&width=', price: '$0 upfront, $74.95/mth', category: 'Apple' },
  { name: 'iPhone 17 Pro', description: 'iPhone 17 Pro with $632 off any M1 plan and $0 upfront.', image_url: 'https://mcprod.m1.com.sg/media/catalog/product/5/3/530-iphone_17_pro_orange_1_1.jpg?quality=80&bg-color=255,255,255&fit=bounds&height=&width=', price: '$0 upfront, $70.95/mth', category: 'Apple' },
  { name: 'iPhone 17', description: 'Standard iPhone 17 with $632 off any M1 plan and $0 upfront.', image_url: 'https://mcprod.m1.com.sg/media/catalog/product/5/3/530_iphone_17_black_1_1.jpg?quality=80&bg-color=255,255,255&fit=bounds&height=&width=', price: '$0 upfront, $58.95/mth', category: 'Apple' },
  { name: 'iPhone Air', description: 'Slim iPhone Air with $632 off any M1 plan and $0 upfront.', image_url: 'https://mcprod.m1.com.sg/media/catalog/product/5/3/530-iphone_air_cloud_white_1.jpg?quality=80&bg-color=255,255,255&fit=bounds&height=&width=', price: '$0 upfront, $66.95/mth', category: 'Apple' },
  { name: 'Samsung Galaxy S26 Ultra', description: 'Galaxy S26 Ultra with 30% off plan plus a free Galaxy Tab A11 worth $348.', image_url: 'https://mcprod.m1.com.sg/media/catalog/product/5/3/530_galaxys26u_black_front.jpg?quality=80&bg-color=255,255,255&fit=bounds&height=&width=', price: '$0 upfront, $67.95/mth', category: 'Samsung' },
  { name: 'Samsung Galaxy S26+', description: 'Galaxy S26+ available at $0 upfront on an M1 plan.', image_url: 'https://mcprod.m1.com.sg/media/catalog/product/5/3/530_galaxys26plus_black_front.jpg?quality=80&bg-color=255,255,255&fit=bounds&height=&width=', price: '$0 upfront', category: 'Samsung' },
  { name: 'Samsung Galaxy Z Fold7 5G', description: 'Foldable Galaxy Z Fold7 5G available on an M1 plan.', image_url: 'https://mcprod.m1.com.sg/media/catalog/product/5/3/530_zfold_jetblack_front_1.png?quality=80&bg-color=255,255,255&fit=bounds&height=&width=', price: '$0 upfront', category: 'Samsung' },
  { name: 'OPPO Reno16 5G', description: 'OPPO Reno16 5G available on an M1 plan with gifts up to $295.', image_url: 'https://mcprod.m1.com.sg/media/catalog/product/5/3/530_opporeno16_white_front.jpg?quality=80&bg-color=255,255,255&fit=bounds&height=&width=', price: '$0 upfront', category: 'OPPO' },
  { name: 'Samsung Galaxy S25 Ultra', description: 'Previous-gen Galaxy S25 Ultra flagship available on an M1 plan.', image_url: 'https://mcprod.m1.com.sg/media/catalog/product/5/3/530_galaxy_s25ultra_black_front_1.jpg?quality=80&bg-color=255,255,255&fit=bounds&height=&width=', price: '$0 upfront', category: 'Samsung' },
];

// Brand palette from the action payload.
const PALETTE = ['#ff9e1b', '#1f1f1f'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const relLum = (rr, gg, bb) => 0.2126 * lum(rr) + 0.7152 * lum(gg) + 0.0722 * lum(bb);
  if (relLum(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo = 0, hi = 1;
  for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m; }
  const dr = Math.round(r * lo), dg = Math.round(g * lo), db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}
const theme = getThemedCardBg(PALETTE);
const ACCENT = PALETTE[0] || '#ff9e1b';
const CARD_COLORS = ['#378ef0', '#9256d9', '#0fb5ae', '#e68619', '#d83790', '#2dca72', '#4046ca', '#72b340'];

export default async function decorate(block, bridge) {
  let items;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      items = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.devices — bare array outputSchema; key derived from actionName "list_devices"
      items = structuredContent?.devices || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  block.textContent = '';
  renderItems(block, items, bridge);

  if (bridge) {
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => bridge.reportSize(block.offsetWidth, block.offsetHeight), 150);
    });
    ro.observe(block);
  }
}

function renderItems(block, items, bridge) {
  const wrapper = document.createElement('div');
  wrapper.className = 'list-devices-wrapper';

  const track = document.createElement('div');
  track.className = 'list-devices-track';

  items.slice(0, 10).forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'list-devices-card';

    const imageBox = document.createElement('div');
    imageBox.className = 'list-devices-image';
    const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
    const colorDiv = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      return d;
    };
    if (item.image_url) {
      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.name || '';
      img.loading = 'lazy';
      img.onerror = () => { if (img.parentNode) img.parentNode.replaceChild(colorDiv(), img); };
      imageBox.appendChild(img);
    } else {
      imageBox.appendChild(colorDiv());
    }
    card.appendChild(imageBox);

    const info = document.createElement('div');
    info.className = 'list-devices-info';
    info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'};`;

    if (item.category) {
      const badge = document.createElement('span');
      badge.className = 'list-devices-badge';
      badge.textContent = item.category;
      badge.style.cssText = `background:${ACCENT};`;
      info.appendChild(badge);
    }

    const title = document.createElement('h3');
    title.className = 'list-devices-name';
    title.textContent = item.name || '';
    info.appendChild(title);

    if (item.description) {
      const desc = document.createElement('p');
      desc.className = 'list-devices-desc';
      desc.textContent = item.description;
      info.appendChild(desc);
    }

    if (item.price) {
      const price = document.createElement('span');
      price.className = 'list-devices-price';
      price.textContent = item.price;
      info.appendChild(price);
    }

    const cta = document.createElement('button');
    cta.className = 'list-devices-cta';
    cta.type = 'button';
    cta.textContent = 'Buy Now';
    cta.style.cssText = `background:${ACCENT};`;
    if (bridge) {
      cta.addEventListener('click', () => bridge.sendMessage(`Tell me more about ${item.name}`));
    }
    info.appendChild(cta);

    card.appendChild(info);
    track.appendChild(card);
  });

  wrapper.appendChild(track);

  const fade = document.createElement('div');
  fade.className = 'list-devices-fade';
  fade.style.cssText = `background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);`;
  wrapper.appendChild(fade);

  const mkArrow = (dir) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `list-devices-arrow list-devices-arrow-${dir}`;
    b.setAttribute('aria-label', dir === 'left' ? 'Scroll left' : 'Scroll right');
    b.textContent = dir === 'left' ? '◀' : '▶';
    b.addEventListener('click', () => {
      const delta = 236 * (dir === 'left' ? -1 : 1);
      track.scrollBy({ left: delta, behavior: 'smooth' });
    });
    b.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.click(); }
    });
    return b;
  };
  const leftArrow = mkArrow('left');
  const rightArrow = mkArrow('right');
  wrapper.appendChild(leftArrow);
  wrapper.appendChild(rightArrow);

  const updateArrows = () => {
    const atStart = track.scrollLeft <= 2;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    leftArrow.style.display = atStart ? 'none' : 'flex';
    rightArrow.style.display = atEnd ? 'none' : 'flex';
    fade.style.display = atEnd ? 'none' : 'block';
  };
  track.addEventListener('scroll', updateArrows);
  requestAnimationFrame(updateArrows);

  block.appendChild(wrapper);
}
