// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    name: 'Bespoke SIM-only 300GB',
    description: '300GB data, 1000 mins, 1000 SMS, True 5G, free eSIM, unlimited weekend data, no contract, with $15/mth device voucher.',
    price: '$11.95/mth (U.P. $14.95/mth)',
    category: 'SIM-only',
  },
  {
    name: 'Bespoke SIM-only 1TB',
    description: '1TB data, 1000 mins, 1000 SMS, True 5G, free eSIM, unlimited weekend data, no contract, with $15/mth device voucher.',
    price: '$14.95/mth (U.P. $17.95/mth)',
    category: 'SIM-only',
  },
  {
    name: 'Bespoke SIM-only 1TB + Roaming',
    description: '1TB data, 1000 mins, 1000 SMS, 1GB worldwide roaming, True 5G, unlimited weekend data, no contract.',
    price: '$17.95/mth (U.P. $22.95/mth)',
    category: 'SIM-only',
  },
  {
    name: 'HomePac 10Gbps (Plan only)',
    description: '10Gbps XGSPON fibre broadband with ONT, free fixed voice and mobile line, optional router top-up from $4/mth. 24-month contract.',
    price: '$26.90/mth (U.P. $135.00/mth)',
    category: 'Home Broadband',
    image_url: 'https://www.m1.com.sg/content/dam/en/offers/offers-guest.png',
  },
  {
    name: 'HomePac 3Gbps',
    description: '3Gbps XGSPON fibre broadband with ONT, free registration and ONT activation, free TP-Link Archer EB210 Pro router. 24-month contract.',
    price: '$29.90/mth (U.P. $65.00/mth)',
    category: 'Home Broadband',
  },
];

// Brand palette from BuildWidgetRequest. getThemedCardBg() darkens palette[0]
// to luminance <= 0.12 so white text meets WCAG AA contrast.
const PALETTE = ['#ff9e1b', '#1f1f1f'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;
  const [r, g, b] = [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const relLum = (rr, gg, bb) => 0.2126 * lum(rr) + 0.7152 * lum(gg) + 0.0722 * lum(bb);
  if (relLum(r, g, b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo = 0; let hi = 1;
  for (let i = 0; i < 20; i += 1) {
    const m = (lo + hi) / 2;
    if (relLum(Math.round(r * m), Math.round(g * m), Math.round(b * m)) > 0.12) hi = m; else lo = m;
  }
  const dr = Math.round(r * lo); const dg = Math.round(g * lo); const db = Math.round(b * lo);
  return { bg: `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`, fg: '#ffffff' };
}
const theme = getThemedCardBg(PALETTE);

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
      // structuredContent.plans — bare array outputSchema; key derived from actionName "list_broadband_plans"
      items = structuredContent?.plans || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  const plans = (items || []).filter((p) => p && p.category === 'Home Broadband');

  block.textContent = '';
  renderPlans(block, plans, bridge);

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

function renderPlans(block, plans, bridge) {
  const wrapper = document.createElement('div');
  wrapper.className = 'lbp-wrapper';

  const track = document.createElement('div');
  track.className = 'lbp-track';

  plans.forEach((plan, i) => {
    const card = document.createElement('article');
    card.className = 'lbp-card';

    const imageBox = document.createElement('div');
    imageBox.className = 'lbp-image';
    const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
    const colorDiv = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      return d;
    };
    if (plan.image_url) {
      const img = document.createElement('img');
      img.src = plan.image_url;
      img.alt = plan.name || '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      img.onerror = () => img.parentNode.replaceChild(colorDiv(), img);
      imageBox.appendChild(img);
    } else {
      imageBox.appendChild(colorDiv());
    }
    card.appendChild(imageBox);

    const info = document.createElement('div');
    info.className = 'lbp-info';
    info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

    if (plan.category) {
      const badge = document.createElement('span');
      badge.className = 'lbp-badge';
      badge.textContent = plan.category;
      info.appendChild(badge);
    }

    const title = document.createElement('h3');
    title.className = 'lbp-name';
    title.textContent = plan.name || '';
    info.appendChild(title);

    if (plan.description) {
      const desc = document.createElement('p');
      desc.className = 'lbp-desc';
      desc.textContent = plan.description;
      info.appendChild(desc);
    }

    const price = document.createElement('div');
    price.className = 'lbp-price';
    price.textContent = plan.price || '';
    info.appendChild(price);

    const btn = document.createElement('button');
    btn.className = 'lbp-cta';
    btn.type = 'button';
    btn.textContent = 'Sign Up Now';
    if (bridge) {
      btn.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about ${plan.name}`);
      });
    }
    info.appendChild(btn);

    card.appendChild(info);
    track.appendChild(card);
  });

  wrapper.appendChild(track);

  const fade = document.createElement('div');
  fade.className = 'lbp-fade';
  fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;
  wrapper.appendChild(fade);

  const mkArrow = (dir) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `lbp-arrow lbp-arrow-${dir}`;
    b.setAttribute('aria-label', dir === 'left' ? 'Scroll left' : 'Scroll right');
    b.textContent = dir === 'left' ? '◀' : '▶';
    const scroll = () => {
      const card = track.querySelector('.lbp-card');
      const amount = card ? card.offsetWidth + 16 : 220;
      track.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    };
    b.addEventListener('click', scroll);
    b.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scroll(); }
    });
    return b;
  };
  const leftArrow = mkArrow('left');
  const rightArrow = mkArrow('right');
  wrapper.appendChild(leftArrow);
  wrapper.appendChild(rightArrow);

  const updateArrows = () => {
    const maxScroll = track.scrollWidth - track.clientWidth - 1;
    leftArrow.style.display = track.scrollLeft <= 0 ? 'none' : 'flex';
    rightArrow.style.display = track.scrollLeft >= maxScroll ? 'none' : 'flex';
    fade.style.display = track.scrollLeft >= maxScroll ? 'none' : 'block';
  };
  track.addEventListener('scroll', updateArrows);
  requestAnimationFrame(updateArrows);

  block.appendChild(wrapper);
}
