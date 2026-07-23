// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  { name: 'Bespoke SIM-only 300GB', description: '300GB data forever, 1000 mins & 1000 SMS on True 5G, no contract, includes $15/mth device voucher and $0.99/day roaming.', price: '$11.95/mth', category: 'SIM-only', image_url: 'https://www.m1.com.sg/content/dam/M1/hero-banner-carousel/2025/may/simo/30525/simo.webp' },
  { name: 'Bespoke SIM-only 1TB', description: '1TB (1024GB) data forever, 1000 mins & 1000 SMS on True 5G, no contract, includes $15/mth device voucher and $0.99/day roaming.', price: '$14.95/mth', category: 'SIM-only', image_url: 'https://www.m1.com.sg/content/dam/M1/tile-carousel-images/promotions-mobile-tile-img13.jpg' },
  { name: 'HomePac 10Gbps', description: '10Gbps XGSPON fibre broadband with free registration, ONT activation and fixed voice; optional Wi-Fi 7 router top-up from $4/mth.', price: '$26.90/mth', category: 'Home Broadband', image_url: 'https://www.m1.com.sg/content/dam/M1/hero-banner-carousel/2025/june/5625/750x500_10gbps.webp' },
  { name: 'HomePac 3Gbps', description: '3Gbps XGSPON fibre broadband with free registration, ONT activation and a free TP-Link Archer EB210 Pro router worth $299.', price: '$29.90/mth', category: 'Home Broadband', image_url: 'https://www.m1.com.sg/content/dam/M1/hero-banner-carousel/2025/feb/fbb-new-pages/fbbmob1.jpg' },
  { name: 'Bespoke SIM-only 1TB + Worldwide Roaming', description: '1TB data forever with 1GB worldwide roaming, 1000 mins & 1000 SMS on True 5G, no contract, includes $15/mth device voucher.', price: '$17.95/mth', category: 'SIM-only' },
];

// Brand palette from BuildWidgetRequest.
const PALETTE = ['#ff9e1b'];
function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s=c/255; return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4); };
  const relLum = (r,g,b) => 0.2126*lum(r)+0.7152*lum(g)+0.0722*lum(b);
  if (relLum(r,g,b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo=0, hi=1;
  for (let i=0; i<20; i++) { const m=(lo+hi)/2; if (relLum(Math.round(r*m),Math.round(g*m),Math.round(b*m)) > 0.12) hi=m; else lo=m; }
  const dr=Math.round(r*lo), dg=Math.round(g*lo), db=Math.round(b*lo);
  return { bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`, fg:'#ffffff' };
}
const theme = getThemedCardBg(PALETTE);
const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];

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
      // structuredContent.plans — bare array outputSchema; key derived from actionName "list_plans"
      items = structuredContent?.plans || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  block.textContent = '';
  renderPlans(block, items, bridge);

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

function renderPlans(block, items, bridge) {
  const plans = (items || []).filter((p) => !p.is_deal).slice(0, 10);

  const wrapper = document.createElement('div');
  wrapper.className = 'list-plans-wrapper';

  const track = document.createElement('div');
  track.className = 'list-plans-track';

  plans.forEach((plan, i) => {
    const card = document.createElement('div');
    card.className = 'list-plans-card';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'list-plans-image';
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
      imageContainer.appendChild(img);
    } else {
      imageContainer.appendChild(colorDiv());
    }
    card.appendChild(imageContainer);

    const info = document.createElement('div');
    info.className = 'list-plans-info';
    info.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

    const title = document.createElement('h3');
    title.className = 'list-plans-name';
    title.textContent = plan.name || '';
    info.appendChild(title);

    if (plan.category) {
      const badge = document.createElement('span');
      badge.className = 'list-plans-badge';
      badge.textContent = plan.category;
      info.appendChild(badge);
    }

    if (plan.description) {
      const desc = document.createElement('p');
      desc.className = 'list-plans-desc';
      desc.textContent = plan.description;
      info.appendChild(desc);
    }

    if (plan.price) {
      const price = document.createElement('span');
      price.className = 'list-plans-price';
      price.textContent = plan.price;
      info.appendChild(price);
    }

    const btn = document.createElement('button');
    btn.className = 'list-plans-cta';
    btn.type = 'button';
    btn.textContent = 'Get this plan';
    if (bridge) {
      btn.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about ${plan.name}`);
      });
    }
    info.appendChild(btn);

    card.appendChild(info);
    track.appendChild(card);
  });

  const fade = document.createElement('div');
  fade.className = 'list-plans-fade';
  fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;`;

  const mkArrow = (dir) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `list-plans-arrow list-plans-arrow-${dir}`;
    b.setAttribute('aria-label', dir === 'left' ? 'Scroll left' : 'Scroll right');
    b.textContent = dir === 'left' ? '◀' : '▶';
    const scrollBy = () => {
      const cardEl = track.querySelector('.list-plans-card');
      const amt = cardEl ? cardEl.offsetWidth + 16 : 220;
      track.scrollBy({ left: dir === 'left' ? -amt : amt, behavior: 'smooth' });
    };
    b.addEventListener('click', scrollBy);
    b.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollBy(); }
    });
    return b;
  };
  const leftArrow = mkArrow('left');
  const rightArrow = mkArrow('right');

  const updateArrows = () => {
    const maxScroll = track.scrollWidth - track.clientWidth;
    leftArrow.style.display = track.scrollLeft <= 2 ? 'none' : 'flex';
    rightArrow.style.display = track.scrollLeft >= maxScroll - 2 ? 'none' : 'flex';
  };
  track.addEventListener('scroll', updateArrows);

  wrapper.appendChild(track);
  wrapper.appendChild(fade);
  wrapper.appendChild(leftArrow);
  wrapper.appendChild(rightArrow);
  block.appendChild(wrapper);

  requestAnimationFrame(updateArrows);
}
