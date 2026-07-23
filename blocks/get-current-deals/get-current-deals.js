// synthetic fixture — no sample data available from Action Planner
// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    name: 'M1 Unlimited 5G Plus',
    description: 'Enjoy unlimited 5G data with free caller ID and 12 months half-price subscription.',
    price: '$25/mo (U.P. $50)',
    image_url: 'https://picsum.photos/seed/m1deal1/400/225',
  },
  {
    name: 'iPhone 16 Pro Bundle',
    description: 'Get the latest iPhone 16 Pro with a 24-month plan and free AirPods worth $299.',
    price: '$0 upfront',
    image_url: 'https://picsum.photos/seed/m1deal2/400/225',
  },
  {
    name: 'Partner Card Cashback',
    description: 'Sign up with a partner credit card and receive up to $180 cashback over 6 months.',
    price: 'Up to $180 back',
    image_url: 'https://picsum.photos/seed/m1deal3/400/225',
  },
];

// Brand palette from BuildWidgetRequest — used to derive card info-strip background.
const PALETTE = ['#ff9e1b'];

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
  for (let i = 0; i < 20; i++) {
    const m = (lo + hi) / 2;
    if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m;
  }
  const dr = Math.round(r * lo), dg = Math.round(g * lo), db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}
const theme = getThemedCardBg(PALETTE);

const CARD_COLORS = ['#378ef0', '#9256d9', '#0fb5ae', '#e68619', '#d83790', '#2dca72', '#4046ca', '#72b340'];
const ACCENT = '#ff9e1b';

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
      // structuredContent.deals — bare array outputSchema; key derived from actionName "get_current_deals"
      items = structuredContent?.deals || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  block.textContent = '';
  renderDeals(block, items, bridge);

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

function renderDeals(block, items, bridge) {
  const wrapper = document.createElement('div');
  wrapper.className = 'get-current-deals-wrapper';

  const track = document.createElement('div');
  track.className = 'get-current-deals-track';

  items.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'get-current-deals-card';

    const imageWrap = document.createElement('div');
    imageWrap.className = 'get-current-deals-image';

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
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      img.onerror = () => img.parentNode.replaceChild(colorDiv(), img);
      imageWrap.appendChild(img);
    } else {
      imageWrap.appendChild(colorDiv());
    }

    const badge = document.createElement('span');
    badge.className = 'get-current-deals-badge';
    badge.textContent = 'DEAL';
    imageWrap.appendChild(badge);

    card.appendChild(imageWrap);

    const info = document.createElement('div');
    info.className = 'get-current-deals-info';
    info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'};`;

    const name = document.createElement('h3');
    name.className = 'get-current-deals-name';
    name.textContent = item.name || '';
    info.appendChild(name);

    const desc = document.createElement('p');
    desc.className = 'get-current-deals-desc';
    desc.textContent = item.description || '';
    info.appendChild(desc);

    if (item.price) {
      const price = document.createElement('span');
      price.className = 'get-current-deals-price';
      price.textContent = item.price;
      info.appendChild(price);
    }

    const btn = document.createElement('button');
    btn.className = 'get-current-deals-cta';
    btn.type = 'button';
    btn.textContent = 'View Deal';
    if (bridge) {
      btn.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about ${item.name}`);
      });
    }
    info.appendChild(btn);

    card.appendChild(info);
    track.appendChild(card);
  });

  wrapper.appendChild(track);

  const fade = document.createElement('div');
  fade.className = 'get-current-deals-fade';
  fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;
  wrapper.appendChild(fade);

  const mkArrow = (dir, label) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `get-current-deals-arrow get-current-deals-arrow-${dir}`;
    b.setAttribute('aria-label', label);
    b.textContent = dir === 'left' ? '◀' : '▶';
    return b;
  };
  const leftArrow = mkArrow('left', 'Scroll left');
  const rightArrow = mkArrow('right', 'Scroll right');

  const cardStep = 236;
  const scrollBy = (delta) => track.scrollBy({ left: delta, behavior: 'smooth' });
  leftArrow.addEventListener('click', () => scrollBy(-cardStep));
  rightArrow.addEventListener('click', () => scrollBy(cardStep));

  const updateArrows = () => {
    const atStart = track.scrollLeft <= 2;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    leftArrow.style.display = atStart ? 'none' : 'flex';
    rightArrow.style.display = atEnd ? 'none' : 'flex';
  };
  track.addEventListener('scroll', updateArrows);

  wrapper.appendChild(leftArrow);
  wrapper.appendChild(rightArrow);
  block.appendChild(wrapper);
  requestAnimationFrame(updateArrows);
}
