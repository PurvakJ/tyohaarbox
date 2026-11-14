import React, { useCallback, useEffect, useRef, useState } from 'react';
import { HashRouter, Routes, Route, NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import './App.css';

/* ───────────── config (edit these) ───────────── */
const CLOUD = {
  name: process.env.REACT_APP_CLOUDINARY_CLOUD || 'dm9gg8yss',
  preset: process.env.REACT_APP_CLOUDINARY_PRESET || 'images',
};

// Paste your deployed Apps Script Web App URL (ends with /exec)
const API_URL = process.env.REACT_APP_API_URL || 'https://script.google.com/macros/s/AKfycbzzurWhWVQx1iaH3XhrZXuaMjvwp6Bgrbnl0_yjXeCbCnCHP3ZzaPjt3eE2CNK87dTk/exec';

// Paste your logo image link here (Cloudinary URL, or a file in /public like '/logo.png')
const LOGO_URL = 'https://res.cloudinary.com/dm9gg8yss/image/upload/v1794127182/image/f02cc1b8-c048-47bf-91f3-932a77b787da_noufnx.png';

// Intro loader: how long it stays fully visible before fading out (ms). Keep between 2000 and 3000.
const LOADER_MS = 2600;

const SITE = {
  name: 'Tyohaar Box',
  tagline: 'Curated Gifts. Timeless Memories.',
  sub: 'Celebrate | Gift | Spread Happiness',
  phones: ['94179 08933', '76966 81584'],
  whatsapp: '919417908933',
  email: '',
  instagram: 'https://www.instagram.com/tyohaarbox.in/',
  updated: 'November 8, 2026',
};
const tel = (p) => `tel:+91${p.replace(/\s/g, '')}`;
const waLink = (text) => `https://wa.me/${SITE.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

/* ───────────── site content (edit freely) ───────────── */
const OCCASIONS = ['Diwali', 'Rakhi', 'Lohri', 'Karwa Chauth', 'Weddings', 'Birthdays', 'Anniversaries', 'Baby Showers', 'Corporate Gifting', 'Christmas', 'New Year', 'Thank You Gifts'];

const PERKS = [
  { k: 'star', t: 'Premium Quality', d: 'Carefully chosen snacks, sweets and treats.' },
  { k: 'heart', t: 'Handpacked with Love', d: 'Every hamper is beautifully arranged by hand.' },
  { k: 'sparkle', t: 'Customisable', d: 'Tell us your budget and occasion, we design around it.' },
  { k: 'truck', t: 'Delivery Available', d: 'Message us and we will get it to your loved ones.' },
];

const COLLECTIONS = [
  { k: 'festive', t: 'Festive Hampers', d: 'Diwali, Rakhi, Lohri and every celebration that deserves a gift.' },
  { k: 'personal', t: 'Personal Gifting', d: 'Birthdays, anniversaries and thank-yous made special and personal.' },
  { k: 'corporate', t: 'Corporate Gifting', d: 'Tasteful hampers for clients, partners and your team.' },
  { k: 'kids', t: 'Little Joy Box', d: 'A tasty treat with a surprise gift inside, made for little smiles.' },
];

const ITEMS = [
  { k: 'jar', t: 'Gourmet jars' },
  { k: 'snacks', t: 'Snacks & munchies' },
  { k: 'sweets', t: 'Festive sweets' },
  { k: 'candle', t: 'Candles & décor' },
  { k: 'choc', t: 'Chocolates' },
  { k: 'nuts', t: 'Dry fruits' },
];

const STEPS = [
  { t: 'Choose', d: 'Browse our hampers or tell us the occasion and your budget.' },
  { t: 'Customise', d: 'Add a message, change items or pick a theme. We will confirm everything with you.' },
  { t: 'Delight', d: 'We pack it with care and arrange delivery to your loved ones.' },
];

const FAQS = [
  ['How do I place an order?', 'Tap “Order on WhatsApp” on any hamper, or call us. We confirm the hamper, your message card and delivery details with you directly.'],
  ['Can I customise a hamper?', 'Yes. Tell us your budget, the occasion and any preferences, and we will put together a hamper that fits.'],
  ['Do you offer corporate or bulk gifting?', 'Yes. We create festive and corporate gifting for teams, clients and partners. Message us with the quantity and budget for a quote.'],
  ['Is delivery available?', 'Yes, delivery is available. Share the delivery address with us and we will confirm how and when it can reach.'],
  ['Can you add a personal message?', 'Of course. Send us the message and we will include it with the hamper.'],
  ['How do I contact you quickly?', 'WhatsApp or call us on 94179 08933 or 76966 81584. You can also use the contact form and we will get back to you.'],
];

/* ───────────── API + Cloudinary ───────────── */
// Apps Script web apps don't answer CORS preflight, so POST uses text/plain.
const checkUrl = () => {
  if (!/^https:\/\/script\.google\.com\//.test(API_URL)) {
    throw new Error('Add your Apps Script Web App URL to API_URL at the top of App.js');
  }
};

async function parse(res) {
  let json;
  try { json = await res.json(); } catch (e) {
    throw new Error('Server did not return JSON. Deploy Code.gs as a Web app with access "Anyone" and use the URL ending in /exec');
  }
  if (!json.ok) throw new Error(json.error || 'Request failed');
  return json.data;
}

async function post(payload) {
  checkUrl();
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
  return parse(res);
}

async function get(action) {
  checkUrl();
  return parse(await fetch(`${API_URL}?action=${action}`));
}

const asList = (d) => {
  if (!Array.isArray(d)) throw new Error('Unexpected response. Redeploy Code.gs as a New version');
  return d;
};

const api = {
  products: () => get('products').then(asList),
  reviews: () => get('reviews').then(asList),
  addReview: (review) => post({ action: 'addReview', review }),
  sendMessage: (message) => post({ action: 'sendMessage', message }),
  login: (key) => post({ action: 'login', key }),
  changePassword: (key, newKey) => post({ action: 'changePassword', key, newKey }),
  addProduct: (key, product) => post({ action: 'addProduct', key, product }),
  updateProduct: (key, product) => post({ action: 'updateProduct', key, product }),
  deleteProduct: (key, id) => post({ action: 'deleteProduct', key, id }),
  deleteReview: (key, id) => post({ action: 'deleteReview', key, id }),
  messages: (key) => post({ action: 'listMessages', key }).then(asList),
  deleteMessage: (key, id) => post({ action: 'deleteMessage', key, id }),
};

// Only a wrong-password error should sign the admin out
const isAuthError = (e) => /wrong admin password/i.test((e && e.message) || '');

// Unsigned upload to Cloudinary using the preset from config
async function uploadImage(file) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  if (file.size > 8 * 1024 * 1024) throw new Error('Image must be under 8 MB.');
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUD.preset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD.name}/image/upload`, { method: 'POST', body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Image upload failed');
  return json.secure_url;
}

// Cloudinary on-the-fly optimisation. Only resizes (never crops), so the whole photo stays visible.
const optimise = (url, w = 800) =>
  url && url.includes('/upload/') ? url.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${w}/`) : url;

/* ───────────── small helpers ───────────── */
function useAsync(fn) {
  const [state, setState] = useState({ loading: true, data: null, error: '' });
  const run = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    fn()
      .then((data) => setState({ loading: false, data, error: '' }))
      .catch((e) => setState({ loading: false, data: null, error: e.message }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { run(); }, [run]);
  return { ...state, reload: run };
}

// Products come only from what you add in Admin
function useProducts() {
  const r = useAsync(api.products);
  return { ...r, list: r.data || [] };
}

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const inr = (n) => '₹' + Math.round(Number(n)).toLocaleString('en-IN');
const hasPrice = (p) => p.price !== '' && p.price != null && !isNaN(Number(p.price)) && Number(p.price) > 0;

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.1 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${on ? 'in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

const Stars = ({ value, onChange }) => (
  <span className={`stars ${onChange ? 'input' : ''}`} aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <button type="button" key={n} disabled={!onChange} className={n <= value ? 'on' : ''} onClick={() => onChange && onChange(n)} aria-label={`${n} star`}>★</button>
    ))}
  </span>
);

function Status({ loading, error, empty, children }) {
  if (loading) return <div className="status"><span className="spinner" /> Loading…</div>;
  if (error) return <div className="status err">Couldn’t load data: {error}. Check API_URL at the top of App.js.</div>;
  if (empty) return <div className="status">{empty}</div>;
  return children;
}

/* ───────────── artwork (inline SVG, no image files needed) ───────────── */
// Shared gold gradient used by many drawings. Rendered once in <App/>.
function Defs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="tbGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2d58a" />
          <stop offset=".55" stopColor="#d4a24c" />
          <stop offset="1" stopColor="#a9792a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Icon({ k }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {k === 'star' && <path {...p} d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z" />}
      {k === 'heart' && <path {...p} d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" />}
      {k === 'sparkle' && <path {...p} d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />}
      {k === 'gift' && <path {...p} d="M3 10h18v4H3zM5 14h14v7H5zM12 10v11M12 10c-4-1-6-6-3-6 2 0 3 3 3 6zM12 10c4-1 6-6 3-6-2 0-3 3-3 6z" />}
      {k === 'chat' && <path {...p} d="M4 5h16v11H9l-5 4z" />}
      {k === 'truck' && (
        <g {...p}>
          <path d="M2 6h11v10H2zM13 9.5h4l3.5 3.5V16H13z" />
          <circle cx="6.5" cy="18" r="2" />
          <circle cx="17" cy="18" r="2" />
        </g>
      )}
    </svg>
  );
}

function Hamper() {
  return (
    <svg viewBox="0 0 400 360" role="img" aria-label="A premium festive gift hamper">
      <ellipse cx="200" cy="338" rx="150" ry="14" fill="#000" opacity=".25" />
      <path d="M62 208C52 70 150 40 200 40s148 30 138 168z" fill="#fff6e5" opacity=".14" stroke="#f2d58a" strokeWidth="2" />
      <rect x="92" y="136" width="62" height="64" rx="6" fill="#8a1c33" stroke="#f2d58a" strokeWidth="2" />
      <path d="M123 136v64M92 168h62" stroke="#f2d58a" strokeWidth="5" />
      <rect x="164" y="104" width="48" height="96" rx="9" fill="#c0392b" />
      <rect x="164" y="96" width="48" height="16" rx="5" fill="url(#tbGold)" />
      <rect x="172" y="132" width="32" height="30" rx="4" fill="#fff6e5" opacity=".85" />
      <rect x="222" y="120" width="48" height="80" rx="9" fill="#2e7d4f" />
      <rect x="222" y="112" width="48" height="16" rx="5" fill="url(#tbGold)" />
      <rect x="230" y="146" width="32" height="26" rx="4" fill="#fff6e5" opacity=".85" />
      <rect x="278" y="132" width="54" height="68" rx="8" fill="#f08a24" />
      <path d="M278 150h54" stroke="#fff6e5" strokeWidth="4" strokeDasharray="6 5" />
      <circle cx="305" cy="176" r="10" fill="#fff6e5" opacity=".9" />
      <path d="M52 196h296l-26 118q-122 28-244 0z" fill="url(#tbGold)" />
      <g stroke="#8c5f1c" strokeWidth="2.5" opacity=".45" fill="none">
        <path d="M60 226h280M68 256h264M76 286h248" />
        <path d="M110 198l-14 108M160 198l-8 116M210 198v120M260 198l8 116M310 198l14 108" />
      </g>
      <rect x="40" y="188" width="320" height="16" rx="8" fill="#f2d58a" stroke="#a9792a" strokeWidth="2" />
      <path d="M200 44c-30-34-74-22-62 4s52 16 62-4zM200 44c30-34 74-22 62 4s-52 16-62 4z" fill="#d4a24c" stroke="#f2d58a" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="200" cy="46" r="9" fill="#a9792a" />
      <path d="M194 52l-16 34M206 52l16 34" stroke="#f2d58a" strokeWidth="5" strokeLinecap="round" />
      <rect x="150" y="212" width="92" height="40" rx="6" fill="#fff6e5" stroke="#a9792a" strokeWidth="2" transform="rotate(-6 196 232)" />
      <text x="196" y="236" textAnchor="middle" fontSize="13" fontWeight="700" fill="#6e1226" fontFamily="Playfair Display, serif" transform="rotate(-6 196 232)">TYOHAAR BOX</text>
      <path d="M356 70l5 12 12 5-12 5-5 12-5-12-12-5 12-5zM48 104l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="#f2d58a" />
    </svg>
  );
}

// Hanging festive lantern (swings gently, see CSS)
function Lantern({ color = '#c0392b', className = '' }) {
  return (
    <svg className={`lantern ${className}`} viewBox="0 0 60 132" aria-hidden="true">
      <path d="M30 0v26" stroke="#d4a24c" strokeWidth="2" />
      <rect x="21" y="26" width="18" height="8" rx="2" fill="url(#tbGold)" />
      <path d="M30 34c-22 0-27 24-27 37s5 37 27 37 27-24 27-37-5-37-27-37z" fill={color} stroke="#d4a24c" strokeWidth="2" />
      <path d="M30 34c-10 8-13 28-13 37s3 29 13 37M30 34c10 8 13 28 13 37s-3 29-13 37M30 34v74" fill="none" stroke="#f2d58a" strokeWidth="1.6" opacity=".7" />
      <rect x="21" y="106" width="18" height="7" rx="2" fill="url(#tbGold)" />
      <path d="M30 113v12" stroke="#d4a24c" strokeWidth="2" />
      <circle cx="30" cy="127" r="3.5" fill="#f2d58a" />
    </svg>
  );
}

function DiyaShapes() {
  return (
    <g>
      <circle cx="50" cy="26" r="26" fill="#ffd36b" opacity=".22" />
      <g className="flame">
        <path d="M50 4c10 11 11 20 0 29-11-9-10-18 0-29z" fill="#f08a24" />
        <path d="M50 14c5 6 5 11 0 16-5-5-5-10 0-16z" fill="#ffe08a" />
      </g>
      <rect x="48" y="30" width="4" height="8" rx="2" fill="#6e1226" />
      <path d="M8 38h84c0 20-17 30-42 30S8 58 8 38z" fill="url(#tbGold)" stroke="#a9792a" strokeWidth="2" />
      <path d="M20 50q30 12 60 0" fill="none" stroke="#8a1c33" strokeWidth="3" strokeLinecap="round" />
      <circle cx="30" cy="46" r="2.2" fill="#8a1c33" /><circle cx="50" cy="52" r="2.2" fill="#8a1c33" /><circle cx="70" cy="46" r="2.2" fill="#8a1c33" />
    </g>
  );
}

function Diya({ className = '' }) {
  return <svg className={`diya ${className}`} viewBox="0 0 100 70" aria-hidden="true"><DiyaShapes /></svg>;
}

function BigMandala() {
  const petals = Array.from({ length: 16 }, (_, i) => i * 22.5);
  const dots = Array.from({ length: 32 }, (_, i) => i * 11.25);
  return (
    <svg viewBox="0 0 400 400" aria-hidden="true">
      <g fill="none" stroke="#f2d58a" strokeWidth="1.6">
        <circle cx="200" cy="200" r="20" /><circle cx="200" cy="200" r="52" /><circle cx="200" cy="200" r="96" />
        <circle cx="200" cy="200" r="150" /><circle cx="200" cy="200" r="190" />
        {petals.map((a) => <path key={a} d="M200 108c14 22 14 44 0 66-14-22-14-44 0-66z" transform={`rotate(${a} 200 200)`} />)}
        {petals.map((a) => <path key={`b${a}`} d="M200 30c12 26 12 52 0 78-12-26-12-52 0-78z" transform={`rotate(${a + 11.25} 200 200)`} />)}
      </g>
      <g fill="#f2d58a">
        {dots.map((a) => <circle key={a} cx="200" cy="22" r="3" transform={`rotate(${a} 200 200)`} />)}
      </g>
    </svg>
  );
}

function Burst({ x, y, r, color }) {
  return (
    <g stroke={color} strokeWidth="2.5" strokeLinecap="round">
      {Array.from({ length: 10 }, (_, i) => i * 36).map((a) => (
        <path key={a} d={`M${x} ${y - r * 0.4}L${x} ${y - r}`} transform={`rotate(${a} ${x} ${y})`} />
      ))}
      <circle cx={x} cy={y} r="3" fill={color} />
    </g>
  );
}

const HEART = 'M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z';

// Scenes for the four collections (and a generic gift box for products without a photo)
function CollectionArt({ c }) {
  const k = c.k;
  return (
    <svg viewBox="0 0 320 170" aria-hidden="true">
      {k === 'festive' && (
        <>
          <rect width="320" height="170" fill="#4a0a18" />
          <circle cx="160" cy="120" r="90" fill="#8a1c33" opacity=".5" />
          <Burst x={64} y={52} r={30} color="#f2d58a" />
          <Burst x={256} y={44} r={24} color="#f08a24" />
          <Burst x={160} y={30} r={18} color="#ff9fb2" />
          <path d="M0 18Q80 44 160 18T320 18" fill="none" stroke="#d4a24c" strokeWidth="1.6" />
          {[20, 70, 120, 170, 220, 270].map((x, i) => <circle key={x} cx={x} cy={i % 2 ? 30 : 36} r="4.5" fill={i % 2 ? '#f08a24' : '#f2d58a'} />)}
          <svg x="105" y="88" width="110" height="77" viewBox="0 0 100 70"><DiyaShapes /></svg>
        </>
      )}
      {k === 'personal' && (
        <>
          <rect width="320" height="170" fill="#b3315a" />
          <circle cx="40" cy="150" r="60" fill="#e4577a" opacity=".5" />
          <path d="M90 82C84 118 100 138 120 150M232 70C240 108 226 132 206 150" fill="none" stroke="#f2d58a" strokeWidth="1.6" />
          <path d={HEART} transform="translate(60 22) scale(3.6)" fill="#ff9fb2" stroke="#f2d58a" strokeWidth=".5" />
          <path d={HEART} transform="translate(196 14) scale(3.2)" fill="#ffd36b" stroke="#fff6e5" strokeWidth=".5" />
          <path d={HEART} transform="translate(150 60) scale(1.4)" fill="#fff6e5" opacity=".8" />
          <rect x="120" y="116" width="80" height="50" rx="5" fill="#fff6e5" stroke="#d4a24c" strokeWidth="3" />
          <path d="M160 116v50M120 140h80" stroke="#d4a24c" strokeWidth="6" />
          <path d="M160 116c-8-18-26-16-22-6s16 8 22 6zM160 116c8-18 26-16 22-6s-16 8-22 6z" fill="none" stroke="#f2d58a" strokeWidth="4" />
          {[[30, 40], [290, 90], [270, 30], [50, 100], [300, 150]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill={i % 2 ? '#ffd36b' : '#fff6e5'} />)}
        </>
      )}
      {k === 'corporate' && (
        <>
          <rect width="320" height="170" fill="#33060f" />
          <path d="M-20 170L120 0M40 170L180 0M100 170L240 0M160 170L300 0M220 170L360 0" stroke="#d4a24c" strokeWidth="1" opacity=".25" />
          <rect x="88" y="64" width="144" height="92" rx="8" fill="#6e1226" stroke="#d4a24c" strokeWidth="3" />
          <rect x="78" y="46" width="164" height="28" rx="7" fill="#8a1c33" stroke="#d4a24c" strokeWidth="3" />
          <path d="M160 46v110" stroke="url(#tbGold)" strokeWidth="14" />
          <path d="M160 46c-9-28-40-26-34-8s28 14 34 8zM160 46c9-28 40-26 34-8s-28 14-34 8z" fill="none" stroke="#f2d58a" strokeWidth="5" strokeLinejoin="round" />
          <rect x="196" y="104" width="52" height="34" rx="4" fill="#fff6e5" transform="rotate(8 222 121)" />
          <path d="M204 118h34M204 128h22" stroke="#6e1226" strokeWidth="3" strokeLinecap="round" transform="rotate(8 222 121)" />
          <path d="M44 40l4 10 10 4-10 4-4 10-4-10-10-4 10-4zM282 110l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#f2d58a" />
        </>
      )}
      {k === 'kids' && (
        <>
          <rect width="320" height="170" fill="#e4577a" />
          <circle cx="280" cy="30" r="50" fill="#ffd36b" opacity=".35" />
          <path d="M70 70C74 100 90 120 110 140M250 64C246 98 230 122 210 140M160 40C160 80 160 110 160 128" fill="none" stroke="#fff6e5" strokeWidth="1.5" />
          <ellipse cx="68" cy="52" rx="22" ry="27" fill="#ffd36b" /><ellipse cx="252" cy="46" rx="22" ry="27" fill="#4bc2c8" /><ellipse cx="160" cy="26" rx="22" ry="27" fill="#fff6e5" />
          <path d="M92 150c0-34 28-58 68-58s68 24 68 58z" fill="#fff6e5" opacity=".35" stroke="#fff6e5" strokeWidth="2" />
          <rect x="106" y="132" width="108" height="30" rx="8" fill="url(#tbGold)" />
          <rect x="124" y="104" width="30" height="34" rx="4" fill="#c0392b" /><rect x="158" y="100" width="34" height="38" rx="4" fill="#2e7d4f" /><rect x="190" y="110" width="22" height="28" rx="4" fill="#f08a24" />
          <circle cx="160" cy="76" r="14" fill="#ffd36b" stroke="#fff6e5" strokeWidth="2" />
          <circle cx="155" cy="73" r="1.8" fill="#6e1226" /><circle cx="165" cy="73" r="1.8" fill="#6e1226" /><path d="M153 80q7 6 14 0" fill="none" stroke="#6e1226" strokeWidth="2" strokeLinecap="round" />
          {[[24, 120], [300, 100], [40, 20], [200, 90], [120, 20]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill={['#ffd36b', '#4bc2c8', '#fff6e5', '#f08a24', '#ffd36b'][i]} />)}
        </>
      )}
      {!k && (
        <>
          <rect width="320" height="170" fill={c.a} />
          <circle cx="40" cy="30" r="28" fill={c.b} opacity=".25" />
          <circle cx="290" cy="140" r="40" fill={c.b} opacity=".22" />
          <circle cx="270" cy="30" r="10" fill="#f2d58a" opacity=".6" />
          <rect x="95" y="68" width="130" height="80" rx="8" fill="#fff6e5" stroke="#d4a24c" strokeWidth="3" />
          <rect x="86" y="52" width="148" height="28" rx="7" fill={c.b} stroke="#d4a24c" strokeWidth="3" />
          <path d="M160 52v96" stroke="#d4a24c" strokeWidth="9" />
          <path d="M160 52c-8-26-36-24-30-8s24 12 30 8zM160 52c8-26 36-24 30-8s-24 12-30 8z" fill="none" stroke="#f2d58a" strokeWidth="5" strokeLinejoin="round" />
          <text x="160" y="128" textAnchor="middle" fontSize="30" fill={c.a}>{c.mark}</text>
        </>
      )}
    </svg>
  );
}

// "What goes inside": little illustrations of typical hamper goodies
function ItemArt({ k }) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      {k === 'jar' && (
        <>
          <rect x="36" y="20" width="48" height="14" rx="4" fill="url(#tbGold)" />
          <rect x="30" y="32" width="60" height="72" rx="14" fill="#c0392b" />
          <rect x="38" y="54" width="44" height="32" rx="5" fill="#fff6e5" />
          <path d="M50 70h20M54 62h12M52 78h16" stroke="#8a1c33" strokeWidth="3" strokeLinecap="round" />
          <path d="M38 46c2-6 6-9 11-10" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".45" fill="none" />
        </>
      )}
      {k === 'snacks' && (
        <>
          <g transform="rotate(-9 42 64)">
            <rect x="16" y="24" width="48" height="72" rx="5" fill="#f08a24" />
            <path d="M16 31l6-7 6 7 6-7 6 7 6-7 6 7 6-7" fill="none" stroke="#fff6e5" strokeWidth="3" />
            <circle cx="40" cy="58" r="13" fill="#fff6e5" /><path d="M34 58h12M40 52v12" stroke="#c0392b" strokeWidth="3" strokeLinecap="round" />
          </g>
          <g transform="rotate(9 80 64)">
            <rect x="56" y="30" width="48" height="68" rx="5" fill="#2e7d4f" />
            <path d="M56 37l6-7 6 7 6-7 6 7 6-7 6 7 6-7" fill="none" stroke="#fff6e5" strokeWidth="3" />
            <circle cx="80" cy="64" r="12" fill="#ffd36b" /><path d="M74 66q6 5 12 0" fill="none" stroke="#6e1226" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </>
      )}
      {k === 'sweets' && (
        <>
          <rect x="16" y="62" width="88" height="42" rx="6" fill="#8a1c33" stroke="#d4a24c" strokeWidth="2.5" />
          {[[38, 60], [60, 50], [82, 60]].map(([x, y]) => (
            <g key={x}>
              <circle cx={x} cy={y} r="14" fill="#f08a24" />
              {[[-5, -4], [4, -5], [0, 3], [-6, 4], [6, 3]].map(([dx, dy], i) => <circle key={i} cx={x + dx} cy={y + dy} r="1.5" fill="#ffd36b" />)}
            </g>
          ))}
          <path d="M16 78h88" stroke="#d4a24c" strokeWidth="3" />
          <rect x="20" y="70" width="80" height="30" rx="4" fill="#8a1c33" />
          <path d="M34 85l6-6 6 6-6 6zM60 85l6-6 6 6-6 6zM86 85l-6-6-6 6 6 6z" fill="#f2d58a" />
        </>
      )}
      {k === 'candle' && (
        <>
          <circle cx="60" cy="38" r="22" fill="#ffd36b" opacity=".3" />
          <g className="flame">
            <path d="M60 14c7 8 8 15 0 22-8-7-7-14 0-22z" fill="#f08a24" />
            <path d="M60 22c3 4 3 8 0 11-3-3-3-7 0-11z" fill="#ffe08a" />
          </g>
          <path d="M60 34v10" stroke="#6e1226" strokeWidth="3" />
          <rect x="32" y="48" width="56" height="58" rx="12" fill="#fff6e5" stroke="#d4a24c" strokeWidth="3" opacity=".95" />
          <rect x="38" y="54" width="44" height="46" rx="8" fill="#ffe3b0" />
          <path d="M44 74h32M48 84h24" stroke="#d4a24c" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {k === 'choc' && (
        <>
          <g transform="rotate(-10 52 66)">
            <rect x="16" y="38" width="72" height="54" rx="6" fill="#5a2a1c" />
            <path d="M40 38v54M64 38v54M16 56h72M16 74h72" stroke="#3a1a1f" strokeWidth="2" />
            <rect x="16" y="68" width="72" height="24" rx="4" fill="url(#tbGold)" opacity=".95" />
            <text x="52" y="85" textAnchor="middle" fontSize="11" fontWeight="700" fill="#6e1226" fontFamily="Playfair Display, serif">CHOCO</text>
          </g>
          <circle cx="92" cy="92" r="12" fill="#3a1a1f" /><circle cx="88" cy="88" r="3.5" fill="#fff" opacity=".35" />
          <circle cx="102" cy="68" r="10" fill="#5a2a1c" /><circle cx="99" cy="65" r="3" fill="#fff" opacity=".3" />
        </>
      )}
      {k === 'nuts' && (
        <>
          <path d="M14 62h92c0 26-20 42-46 42S14 88 14 62z" fill="url(#tbGold)" stroke="#a9792a" strokeWidth="2.5" />
          {[[34, 58, -30], [52, 52, 15], [72, 54, -15], [90, 58, 30], [44, 66, 40], [64, 64, -35], [82, 66, 20]].map(([x, y, r], i) => (
            <ellipse key={i} cx={x} cy={y} rx="9" ry="5.5" fill={i % 3 === 0 ? '#d9a066' : i % 3 === 1 ? '#f0c987' : '#c98a4d'} transform={`rotate(${r} ${x} ${y})`} />
          ))}
          {[[28, 66], [100, 66], [58, 74], [76, 72]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill="#5a2a3a" />)}
          <path d="M26 82q34 12 68 0" fill="none" stroke="#8a1c33" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function EmptyArt({ text }) {
  return (
    <div className="empty-art">
      <CollectionArt c={{ a: '#8a1c33', b: '#d4a24c', mark: '✦' }} />
      <p>{text}</p>
    </div>
  );
}

function PageHead({ title, sub, bg }) {
  return (
    <header className="page-head">
      <BgPhoto url={bg} />
      <div className="garland top" aria-hidden="true" />
      <Lantern className="l1" color="#f08a24" />
      <Lantern className="l3" color="#c0392b" />
      <Lantern className="l4" color="#f08a24" />
      <h1>{title}</h1>
      <div className="orn" aria-hidden="true"><span>✦</span></div>
      {sub && <p>{sub}</p>}
    </header>
  );
}

// Full-width coloured band (tone: '', 'cream', 'blush', 'maroon')
function Full({ tone = '', children }) {
  return <div className={`full ${tone}`}>{children}</div>;
}

// Eyebrow + title + gold ornament
function SecIntro({ eyebrow, title, sub }) {
  return (
    <Reveal>
      <div className="sec-intro">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        <div className="orn" aria-hidden="true"><span>✦</span></div>
        {sub && <p>{sub}</p>}
      </div>
    </Reveal>
  );
}

/* ───────────── PHOTOS: paste your own image links (Cloudinary or /public). '' = show illustration ───────────── */
const PHOTOS = {
  hero: '',      // faint background behind the home hero
  packing: '',   // hampers being packed
  festive: '',   // festive lights / diyas
  corporate: '', // corporate gift boxes
  delivery: '',  // delivery / courier
  gifting: '',   // hamper on a table
};

// True only after the image has really loaded, so a bad link never shows a broken image
function useLoaded(url) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!url) { setOk(false); return undefined; }
    let live = true;
    const im = new Image();
    im.onload = () => live && setOk(true);
    im.onerror = () => live && setOk(false);
    im.src = url;
    return () => { live = false; };
  }, [url]);
  return ok;
}

function BgPhoto({ url }) {
  const ok = useLoaded(url);
  return ok ? <div className="bg-photo" style={{ backgroundImage: `url(${optimise(url, 1800)})` }} aria-hidden="true" /> : null;
}

/* ───────────── intro loader (festive: spinning mandala, swinging lanterns, flickering diyas) ───────────── */
function Loader() {
  const [phase, setPhase] = useState('show'); // show -> out (fade) -> gone (removed)
  const [logoBad, setLogoBad] = useState(false);
  const logoOk = useLoaded(LOGO_URL);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // no scrolling behind the loader
    const fade = setTimeout(() => setPhase('out'), LOADER_MS);
    const done = setTimeout(() => { setPhase('gone'); document.body.style.overflow = prev; }, LOADER_MS + 650);
    return () => { clearTimeout(fade); clearTimeout(done); document.body.style.overflow = prev; };
  }, []);

  if (phase === 'gone') return null;
  const showLogo = LOGO_URL && logoOk && !logoBad;

  return (
    <div className={`loader ${phase === 'out' ? 'out' : ''}`} role="status" aria-live="polite" aria-label="Loading Tyohaar Box">
      <div className="bokeh" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
      <div className="loader-mandala" aria-hidden="true"><BigMandala /></div>
      <div className="garland loader-garland" aria-hidden="true" />
      <Lantern className="l1 ll" color="#f08a24" />
      <Lantern className="l2 ll" color="#c0392b" />
      <Lantern className="l3 ll" color="#f08a24" />
      <Lantern className="l4 ll" color="#8a1c33" />
      <Diya className="loader-diya left" />
      <Diya className="loader-diya right" />

      <div className="loader-core">
        <div className="loader-ring">
          <div className={`loader-disc ${showLogo ? '' : 'dark'}`}>
            {showLogo
              ? <img src={optimise(LOGO_URL, 400)} alt="" onError={() => setLogoBad(true)} />
              : <Hamper />}
          </div>
        </div>
        <h2 className="loader-name">TYOHAAR BOX</h2>
        <p className="loader-tag">{SITE.tagline}</p>
        <p className="loader-sub">Wrapping your festive hampers with love…</p>
        <div className="loader-bar" aria-hidden="true"><i /></div>
        <p className="loader-wish">{SITE.sub}</p>
      </div>
    </div>
  );
}

/* ───────────── occasion illustrations ───────────── */
const OCC = [
  ['diwali', 'Diwali', '#4a0a18'], ['rakhi', 'Rakhi', '#b3315a'], ['lohri', 'Lohri', '#7a2a10'], ['karwa', 'Karwa Chauth', '#2a1a4a'],
  ['wedding', 'Weddings', '#8a1c33'], ['birthday', 'Birthdays', '#e4577a'], ['anniversary', 'Anniversaries', '#6e1226'], ['baby', 'Baby Showers', '#2fa9b0'],
  ['corporate', 'Corporate Gifting', '#33060f'], ['christmas', 'Christmas', '#1d5a3a'], ['newyear', 'New Year', '#1a1440'], ['thanks', 'Thank You Gifts', '#e07a1c'],
];

function OccasionArt({ k, bg }) {
  const ring = (n, r, f) => Array.from({ length: n }, (_, i) => (i * 360) / n).map((a) => (
    <circle key={a} cx={80 + r * Math.cos((a * Math.PI) / 180)} cy={60 + r * Math.sin((a * Math.PI) / 180)} r={f} fill="#f08a24" />
  ));
  return (
    <svg viewBox="0 0 160 120" aria-hidden="true">
      <rect width="160" height="120" fill={bg} />
      <circle cx="136" cy="18" r="38" fill="#f2d58a" opacity=".12" />
      <circle cx="16" cy="104" r="30" fill="#fff" opacity=".07" />
      {k === 'diwali' && (<>
        <Burst x={30} y={30} r={16} color="#f2d58a" /><Burst x={132} y={28} r={14} color="#f08a24" />
        <svg x="40" y="38" width="80" height="56" viewBox="0 0 100 70"><DiyaShapes /></svg>
      </>)}
      {k === 'rakhi' && (<>
        <path d="M8 36Q40 104 64 68M152 36Q120 104 96 68" fill="none" stroke="#f2d58a" strokeWidth="3" />
        {ring(8, 24, 6)}
        <circle cx="80" cy="60" r="15" fill="url(#tbGold)" /><circle cx="80" cy="60" r="7" fill="#c0392b" />
      </>)}
      {k === 'lohri' && (<>
        <path d="M80 16c15 17 18 31 0 48-18-17-15-31 0-48z" fill="#f08a24" />
        <path d="M56 38c10 10 12 20 2 30-12-9-10-19-2-30zM104 38c-10 10-12 20-2 30 12-9 10-19 2-30z" fill="#e4572e" />
        <path d="M80 36c8 9 9 16 0 24-9-8-8-15 0-24z" fill="#ffe08a" />
        <rect x="40" y="82" width="80" height="10" rx="5" fill="#5a2a1c" transform="rotate(-8 80 87)" />
        <rect x="40" y="82" width="80" height="10" rx="5" fill="#7a3a24" transform="rotate(8 80 87)" />
      </>)}
      {k === 'karwa' && (<>
        <circle cx="106" cy="38" r="20" fill="#fff6e5" /><circle cx="114" cy="33" r="18" fill={bg} />
        <circle cx="62" cy="76" r="26" fill="none" stroke="#f2d58a" strokeWidth="3" />
        {[[-10, -8], [0, -8], [10, -8], [-10, 2], [0, 2], [10, 2], [-5, 12], [5, 12]].map(([dx, dy], i) => <circle key={i} cx={62 + dx} cy={76 + dy} r="2.2" fill="#f2d58a" />)}
        <circle cx="30" cy="24" r="2.5" fill="#fff6e5" /><circle cx="140" cy="86" r="2.5" fill="#fff6e5" />
      </>)}
      {k === 'wedding' && (<>
        <circle cx="66" cy="70" r="22" fill="none" stroke="#f2d58a" strokeWidth="6" />
        <circle cx="96" cy="70" r="22" fill="none" stroke="#d4a24c" strokeWidth="6" />
        <path d="M90 34l6-9h8l6 9-10 11z" fill="#fff6e5" />
        <path d={HEART} transform="translate(18 10) scale(1.2)" fill="#ff9fb2" />
      </>)}
      {k === 'birthday' && (<>
        <rect x="42" y="72" width="76" height="32" rx="6" fill="#fff6e5" />
        <rect x="50" y="50" width="60" height="26" rx="6" fill="#f2d58a" />
        <path d="M42 78q9.5 8 19 0t19 0 19 0 19 0" fill="none" stroke="#c0392b" strokeWidth="4" />
        {[62, 80, 98].map((x) => (
          <g key={x}><rect x={x - 2} y="34" width="4" height="16" fill="#fff6e5" /><path d={`M${x} 22c4 5 4 8 0 11-4-3-4-6 0-11z`} fill="#ffd36b" /></g>
        ))}
      </>)}
      {k === 'anniversary' && (<>
        <path d={HEART} transform="translate(30 24) scale(3.6)" fill="#ff9fb2" stroke="#f2d58a" strokeWidth=".4" />
        <path d={HEART} transform="translate(76 40) scale(3.2)" fill="#f2d58a" />
        <circle cx="30" cy="20" r="3" fill="#fff6e5" /><circle cx="140" cy="100" r="3" fill="#fff6e5" />
      </>)}
      {k === 'baby' && (<>
        <circle cx="72" cy="46" r="24" fill="#fff6e5" /><circle cx="72" cy="46" r="14" fill="#ffd36b" />
        <rect x="67" y="68" width="9" height="30" rx="4" fill="#fff6e5" transform="rotate(-20 72 68)" />
        <circle cx="62" cy="104" r="8" fill="none" stroke="#fff6e5" strokeWidth="4" />
        <path d="M118 30l3 8 8 3-8 3-3 8-3-8-8-3 8-3zM126 82l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#ffd36b" />
      </>)}
      {k === 'corporate' && (<>
        <rect x="42" y="48" width="76" height="52" rx="8" fill="#6e1226" stroke="#d4a24c" strokeWidth="3" />
        <path d="M66 48v-8a6 6 0 0 1 6-6h16a6 6 0 0 1 6 6v8" fill="none" stroke="#d4a24c" strokeWidth="4" />
        <path d="M42 72h76" stroke="#d4a24c" strokeWidth="3" /><rect x="74" y="66" width="12" height="11" rx="2" fill="#f2d58a" />
      </>)}
      {k === 'christmas' && (<>
        <path d="M80 14l20 28H88l18 24H92l20 26H48l20-26H54l18-24H60z" fill="#4bb37a" />
        <rect x="74" y="92" width="12" height="14" fill="#5a2a1c" />
        <circle cx="80" cy="14" r="5" fill="#f2d58a" />
        {[[70, 50], [90, 62], [64, 78], [96, 84]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.4" fill={i % 2 ? '#f2d58a' : '#c0392b'} />)}
      </>)}
      {k === 'newyear' && (<>
        <Burst x={50} y={44} r={30} color="#f2d58a" /><Burst x={112} y={36} r={26} color="#ff9fb2" /><Burst x={82} y={86} r={22} color="#4bc2c8" />
        {[[22, 90], [140, 80], [128, 108], [34, 14]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="#fff6e5" />)}
      </>)}
      {k === 'thanks' && (<>
        <path d={HEART} transform="translate(38 12) scale(3.5)" fill="#fff6e5" />
        <text x="80" y="58" textAnchor="middle" fontSize="16" fontStyle="italic" fontWeight="700" fill="#c0392b" fontFamily="Playfair Display, serif">Thank you</text>
        <rect x="64" y="92" width="32" height="20" rx="3" fill="#8a1c33" stroke="#f2d58a" strokeWidth="2" /><path d="M80 92v20" stroke="#f2d58a" strokeWidth="3" />
      </>)}
    </svg>
  );
}

function Occasions() {
  return (
    <div className="occ-grid">
      {OCC.map(([k, t, bg], i) => (
        <Reveal key={k} delay={(i % 4) * 70}>
          <Link to="/products" className="card occ">
            <div className="occ-art"><OccasionArt k={k} bg={bg} /></div>
            <h4>{t}</h4>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}

/* ───────────── large scenes + photo with illustration fallback ───────────── */
function Scene({ k }) {
  if (k === 'gifting') {
    return <div className="scene scene-hamper"><Hamper /></div>;
  }
  return (
    <div className="scene">
      <svg viewBox="0 0 480 340" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {k === 'packing' && (<>
          <rect width="480" height="340" fill="#fbe9e0" />
          <circle cx="410" cy="60" r="80" fill="#f2d58a" opacity=".4" />
          <rect y="262" width="480" height="78" fill="#d4a24c" opacity=".35" />
          <path d="M116 156h248l-22 118H138z" fill="#8a1c33" stroke="#d4a24c" strokeWidth="4" />
          <rect x="104" y="140" width="272" height="26" rx="6" fill="#6e1226" stroke="#d4a24c" strokeWidth="4" />
          <rect x="150" y="66" width="56" height="82" rx="10" fill="#c0392b" /><rect x="150" y="58" width="56" height="16" rx="5" fill="url(#tbGold)" />
          <rect x="218" y="88" width="52" height="62" rx="6" fill="#f08a24" /><path d="M218 96l7-8 7 8 7-8 7 8 7-8 7 8" stroke="#fff6e5" strokeWidth="3" fill="none" />
          <rect x="282" y="74" width="50" height="76" rx="12" fill="#fff6e5" stroke="#d4a24c" strokeWidth="3" />
          <path d="M307 44c7 9 7 16 0 23-7-7-7-14 0-23z" fill="#f08a24" />
          <path d="M240 166v108" stroke="url(#tbGold)" strokeWidth="14" />
          <path d="M240 160c-14-30-48-26-40-8s32 14 40 8zM240 160c14-30 48-26 40-8s-32 14-40 8z" fill="none" stroke="#f2d58a" strokeWidth="6" strokeLinejoin="round" />
          <circle cx="70" cy="290" r="32" fill="none" stroke="#d4a24c" strokeWidth="11" /><circle cx="70" cy="290" r="9" fill="#8a1c33" />
          <rect x="392" y="236" width="70" height="44" rx="6" fill="#fff6e5" stroke="#a9792a" strokeWidth="2" transform="rotate(-8 427 258)" />
          <text x="427" y="262" textAnchor="middle" fontSize="12" fontWeight="700" fill="#6e1226" fontFamily="Playfair Display, serif" transform="rotate(-8 427 258)">With love</text>
          <path d="M60 60l5 12 12 5-12 5-5 12-5-12-12-5 12-5z" fill="#d4a24c" />
        </>)}
        {k === 'delivery' && (<>
          <rect width="480" height="340" fill="#fff6e5" />
          <circle cx="90" cy="70" r="46" fill="#f2d58a" opacity=".5" />
          {[[10, 120, 60], [80, 90, 90], [170, 130, 50], [240, 100, 80], [330, 120, 60], [400, 90, 80]].map(([x, y, w], i) => <rect key={i} x={x} y={y} width={w} height={270 - y} fill="#ecd9b8" />)}
          <rect y="262" width="480" height="78" fill="#4a0a18" /><path d="M0 300h480" stroke="#f2d58a" strokeWidth="4" strokeDasharray="26 20" />
          <rect x="90" y="166" width="210" height="94" rx="12" fill="#8a1c33" stroke="#d4a24c" strokeWidth="3" />
          <path d="M300 186h52l34 38v36h-86z" fill="#6e1226" stroke="#d4a24c" strokeWidth="3" />
          <path d="M312 196h34l22 26h-56z" fill="#c4e6ed" />
          <rect x="90" y="214" width="210" height="8" fill="url(#tbGold)" />
          <text x="195" y="248" textAnchor="middle" fontSize="18" fontWeight="700" fill="#f2d58a" fontFamily="Playfair Display, serif">TYOHAAR BOX</text>
          <circle cx="150" cy="262" r="22" fill="#33060f" /><circle cx="150" cy="262" r="9" fill="#d4a24c" />
          <circle cx="340" cy="262" r="22" fill="#33060f" /><circle cx="340" cy="262" r="9" fill="#d4a24c" />
          <path d="M30 190h40M14 210h56M40 230h30" stroke="#d4a24c" strokeWidth="4" strokeLinecap="round" />
          <path d="M420 40a22 22 0 0 1 22 22c0 18-22 40-22 40s-22-22-22-40a22 22 0 0 1 22-22z" fill="#e4577a" /><circle cx="420" cy="62" r="8" fill="#fff6e5" />
          <rect x="400" y="236" width="50" height="40" rx="5" fill="#fff6e5" stroke="#d4a24c" strokeWidth="3" /><path d="M425 236v40M400 254h50" stroke="#d4a24c" strokeWidth="5" />
        </>)}
        {k === 'festive' && (<>
          <rect width="480" height="340" fill="#4a0a18" />
          <circle cx="240" cy="260" r="200" fill="#8a1c33" opacity=".5" />
          <path d="M0 30Q120 90 240 30T480 30" fill="none" stroke="#d4a24c" strokeWidth="2.5" />
          {[30, 90, 150, 210, 270, 330, 390, 450].map((x, i) => <circle key={x} cx={x} cy={i % 2 ? 62 : 50} r="7" fill={i % 2 ? '#f08a24' : '#f2d58a'} />)}
          <Burst x={90} y={130} r={34} color="#f2d58a" /><Burst x={390} y={120} r={30} color="#f08a24" /><Burst x={240} y={110} r={24} color="#ff9fb2" />
          <svg x="40" y="210" width="130" height="91" viewBox="0 0 100 70"><DiyaShapes /></svg>
          <svg x="175" y="230" width="130" height="91" viewBox="0 0 100 70"><DiyaShapes /></svg>
          <svg x="310" y="210" width="130" height="91" viewBox="0 0 100 70"><DiyaShapes /></svg>
        </>)}
        {k === 'corporate' && (<>
          <rect width="480" height="340" fill="#33060f" />
          <path d="M-20 340L140 0M60 340L220 0M140 340L300 0M220 340L380 0M300 340L460 0" stroke="#d4a24c" strokeWidth="1" opacity=".22" />
          <rect x="120" y="190" width="240" height="120" rx="8" fill="#6e1226" stroke="#d4a24c" strokeWidth="3" />
          <rect x="108" y="166" width="264" height="34" rx="7" fill="#8a1c33" stroke="#d4a24c" strokeWidth="3" />
          <path d="M240 166v144" stroke="url(#tbGold)" strokeWidth="16" />
          <path d="M240 166c-14-36-54-32-46-10s38 16 46 10zM240 166c14-36 54-32 46-10s-38 16-46 10z" fill="none" stroke="#f2d58a" strokeWidth="6" strokeLinejoin="round" />
          <rect x="150" y="82" width="150" height="70" rx="6" fill="#8a1c33" stroke="#d4a24c" strokeWidth="3" /><path d="M225 82v70" stroke="url(#tbGold)" strokeWidth="10" />
          <rect x="316" y="214" width="100" height="62" rx="4" fill="#fff6e5" transform="rotate(7 366 245)" />
          <path d="M330 232h60M330 246h44M330 260h54" stroke="#6e1226" strokeWidth="4" strokeLinecap="round" transform="rotate(7 366 245)" />
          <path d="M60 60l5 12 12 5-12 5-5 12-5-12-12-5 12-5zM420 80l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="#f2d58a" />
        </>)}
      </svg>
    </div>
  );
}

function Photo({ src, scene, alt, badge }) {
  const [bad, setBad] = useState(false);
  const show = src && !bad;
  return (
    <figure className="photo">
      {show ? <img src={optimise(src, 1000)} alt={alt} loading="lazy" onError={() => setBad(true)} /> : <Scene k={scene} />}
      {badge && <figcaption className="photo-badge"><i /> {badge}</figcaption>}
    </figure>
  );
}

// Picture on one side, text on the other
function Showcase({ photo, scene, badge, eyebrow, title, sub, points, reverse, cta }) {
  return (
    <div className={`showcase ${reverse ? 'rev' : ''}`}>
      <Reveal><Photo src={photo} scene={scene} alt={title} badge={badge} /></Reveal>
      <Reveal delay={100}>
        <div className="show-copy">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h2>{title}</h2>
          <div className="orn left" aria-hidden="true"><span>✦</span></div>
          {sub && <p>{sub}</p>}
          <ul className="ticks">{points.map((x) => <li key={x}>{x}</li>)}</ul>
          {cta && <div className="cta-row"><Link className="btn primary" to={cta[1]}>{cta[0]}</Link></div>}
        </div>
      </Reveal>
    </div>
  );
}

// Small drawings for the three "How it works" steps (drawn for the dark maroon band)
function StepArt({ k }) {
  return (
    <svg viewBox="0 0 120 90" aria-hidden="true">
      {k === 0 && (<>
        <rect x="14" y="12" width="64" height="66" rx="8" fill="#fff6e5" stroke="#d4a24c" strokeWidth="3" />
        <rect x="24" y="22" width="22" height="18" rx="3" fill="#c0392b" /><rect x="52" y="22" width="18" height="18" rx="3" fill="#f08a24" />
        <path d="M24 52h46M24 62h30" stroke="#8a1c33" strokeWidth="4" strokeLinecap="round" />
        <circle cx="86" cy="58" r="16" fill="none" stroke="#f2d58a" strokeWidth="5" /><path d="M98 70l14 14" stroke="#f2d58a" strokeWidth="6" strokeLinecap="round" />
      </>)}
      {k === 1 && (<>
        <rect x="14" y="16" width="72" height="56" rx="6" fill="#fff6e5" stroke="#d4a24c" strokeWidth="3" />
        <path d="M26 34h48M26 46h36M26 58h24" stroke="#8a1c33" strokeWidth="4" strokeLinecap="round" />
        <path d="M72 78l6-22 28-28 12 12-28 28z" fill="#f2d58a" stroke="#a9792a" strokeWidth="2" /><path d="M72 78l-2 8 8-2z" fill="#8a1c33" />
        <path d={HEART} transform="translate(60 14) scale(1)" fill="#ff9fb2" />
      </>)}
      {k === 2 && (<>
        <rect x="30" y="38" width="60" height="42" rx="5" fill="#8a1c33" stroke="#d4a24c" strokeWidth="3" />
        <rect x="24" y="28" width="72" height="16" rx="4" fill="#6e1226" stroke="#d4a24c" strokeWidth="3" />
        <path d="M60 28v52" stroke="#f2d58a" strokeWidth="7" />
        <path d="M60 28c-6-16-24-14-20-4s16 8 20 4zM60 28c6-16 24-14 20-4s-16 8-20 4z" fill="none" stroke="#f2d58a" strokeWidth="3.5" />
        <path d="M14 16l3 7 7 3-7 3-3 7-3-7-7-3 7-3zM100 54l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#f2d58a" />
      </>)}
    </svg>
  );
}

/* ───────────── extra styling + background images (all generated here, nothing to download) ───────────── */
const svgUrl = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

const mandalaTile = (color, op) => svgUrl(
  `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke='${color}' stroke-width='1.2' opacity='${op}'><circle cx='60' cy='60' r='8'/><circle cx='60' cy='60' r='18'/><circle cx='60' cy='60' r='30'/><path d='M60 12c8 12 8 24 0 36-8-12-8-24 0-36zM60 108c8-12 8-24 0-36-8 12-8 24 0 36zM12 60c12-8 24-8 36 0-12 8-24 8-36 0zM108 60c-12-8-24-8-36 0 12 8 24 8 36 0z'/><path d='M26 26c10 4 16 10 20 20-10-4-16-10-20-20zM94 26c-4 10-10 16-20 20 4-10 10-16 20-20zM26 94c4-10 10-16 20-20-4 10-10 16-20 20zM94 94c-10-4-16-10-20-20 10 4 16 10 20 20z'/></g></svg>`,
);

const flower = (cx, cy) => [0, 60, 120, 180, 240, 300]
  .map((a) => `<circle cx='${(cx + 7 * Math.cos((a * Math.PI) / 180)).toFixed(1)}' cy='${(cy + 7 * Math.sin((a * Math.PI) / 180)).toFixed(1)}' r='5' fill='#f08a24'/>`)
  .join('') + `<circle cx='${cx}' cy='${cy}' r='4' fill='#c0392b'/><circle cx='${cx}' cy='${cy}' r='1.6' fill='#ffd36b'/>`;

const GARLAND = svgUrl(
  `<svg xmlns='http://www.w3.org/2000/svg' width='56' height='42' viewBox='0 0 56 42'><path d='M0 4Q28 26 56 4' fill='none' stroke='#b9852f' stroke-width='1.6'/><ellipse cx='7' cy='9' rx='5' ry='2.4' fill='#2e7d4f' transform='rotate(28 7 9)'/><ellipse cx='49' cy='9' rx='5' ry='2.4' fill='#2e7d4f' transform='rotate(-28 49 9)'/>${flower(28, 22)}</svg>`,
);

const EXTRA_CSS = `
body { background-color: var(--paper); background-image: ${mandalaTile('#d4a24c', '.16')}; background-size: 170px; }
.full.cream { background-color: var(--cream); background-image: ${mandalaTile('#d4a24c', '.38')}; background-size: 130px; }
.full.blush { background-color: var(--blush); background-image: ${mandalaTile('#8a1c33', '.14')}; background-size: 150px; }
.full.maroon { background: ${mandalaTile('#f2d58a', '.22')} 0 0 / 140px, radial-gradient(circle at 20% 0%, var(--maroon) 0%, var(--maroon-dark) 60%, var(--maroon-deep) 100%); }
.site-footer { background-image: ${mandalaTile('#f2d58a', '.1')}; background-size: 150px; }

/* garlands, lanterns, diyas */
.garland { height: 42px; width: 100%; background: ${GARLAND} repeat-x center / 56px 42px; pointer-events: none; }
.garland.top { position: absolute; left: 0; right: 0; top: var(--head-h); z-index: 3; }
.garland.sep { display: block; background-color: var(--paper); border-top: 1px solid var(--line); }
.lantern { position: absolute; top: calc(var(--head-h) + 30px); transform-origin: 50% 0; animation: tbswing 4.2s ease-in-out infinite; z-index: 2; pointer-events: none; filter: drop-shadow(0 8px 14px rgba(0,0,0,.35)); }
.lantern.l1 { left: 2%; width: 40px; }
.lantern.l2 { left: 47%; width: 38px; animation-delay: -1.4s; }
.lantern.l3 { right: 2%; width: 54px; animation-delay: -2.2s; }
.lantern.l4 { right: 11%; width: 38px; animation-delay: -.8s; }
@keyframes tbswing { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }
.flame { transform-box: fill-box; transform-origin: 50% 100%; animation: tbflame 1.4s ease-in-out infinite; }
@keyframes tbflame { 0%, 100% { transform: scale(1, 1); } 50% { transform: scale(.9, 1.12); } }
.diya { width: 90px; height: auto; filter: drop-shadow(0 0 16px rgba(255, 211, 107, .55)); }
.band .band-diya { position: absolute; bottom: 14px; width: 84px; z-index: 1; }
.band .band-diya.left { left: 26px; }
.band .band-diya.right { right: 26px; }
.hero-diya { position: absolute; left: clamp(20px, 6vw, 90px); bottom: 24px; z-index: 2; width: 96px; }
.hero-mandala { position: absolute; right: -10%; top: 50%; width: min(760px, 78vw); aspect-ratio: 1; transform: translateY(-50%); opacity: .2; z-index: 1; pointer-events: none; }
.hero-mandala svg { width: 100%; height: 100%; animation: tbspin 140s linear infinite; }
@keyframes tbspin { to { transform: rotate(360deg); } }

/* perks icons */
.ic svg { width: 30px; height: 30px; }

/* "what goes inside" items */
.items { display: grid; grid-template-columns: repeat(6, 1fr); gap: 22px; }
.item { text-align: center; }
.item .disc { width: 100%; aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle at 50% 38%, #fff, var(--cream)); border: 2px solid var(--gold); display: grid; place-items: center; box-shadow: 0 10px 22px rgba(74, 10, 24, .14); transition: transform .35s var(--ease), box-shadow .35s var(--ease); }
.item:hover .disc { transform: translateY(-6px) rotate(-3deg); box-shadow: 0 16px 30px rgba(74, 10, 24, .24); }
.item .disc svg { width: 72%; height: auto; }
.item h4 { margin: 14px 0 0; font-size: 1rem; }

/* story (about) */
.story { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: center; }
.story-art, .art-card { position: relative; border-radius: 24px; padding: 26px; background: radial-gradient(circle at 30% 20%, var(--wine), var(--maroon-deep)); border: 2px solid var(--gold); box-shadow: var(--shadow-lg); overflow: hidden; }
.story-art svg.hamper-svg, .art-card svg.hamper-svg { width: 100%; height: auto; display: block; position: relative; z-index: 1; }
.story-art::before, .art-card::before { content: ''; position: absolute; inset: 0; background: ${mandalaTile('#f2d58a', '.2')} 0 0 / 120px; }
.story-art .diya { position: absolute; right: 14px; bottom: 12px; width: 70px; z-index: 2; }
.story p { color: var(--muted); font-size: 1.05rem; }

/* empty state + misc */
.empty-art { max-width: 380px; margin: 0 auto; }
.empty-art svg { width: 100%; height: auto; border-radius: 16px; border: 2px solid var(--gold); box-shadow: var(--shadow); }
.empty-art p { margin-top: 18px; color: var(--muted); }
.insta { background-image: ${mandalaTile('#f2d58a', '.16')}, linear-gradient(135deg, var(--maroon-dark), var(--wine)); background-size: 120px, auto; }

@media (max-width: 991px) {
  .items { grid-template-columns: repeat(3, 1fr); }
  .story { grid-template-columns: 1fr; }
  .hero-mandala { right: -30%; }
}
@media (max-width: 640px) {
  .items { grid-template-columns: repeat(2, 1fr); }
  .lantern.l2, .lantern.l4 { display: none; }
  .lantern.l1 { width: 30px; }
  .lantern.l3 { width: 38px; }
  .band .band-diya { display: none; }
  .hero-diya { width: 70px; }
}
@media (prefers-reduced-motion: reduce) {
  .lantern, .flame, .hero-mandala svg { animation: none !important; }
}
`;

/* ───────────── layout ───────────── */
const NAV = [['/', 'Home'], ['/about', 'About'], ['/products', 'Products'], ['/reviews', 'Reviews'], ['/contact', 'Contact']];

function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const solid = scrolled || pathname === '/admin' || open;
  return (
    <header className={`site-header ${solid ? 'solid' : ''}`}>
      <Link to="/" className="brand" aria-label={SITE.name}>
        <img className="brand-logo" src={LOGO_URL} alt={SITE.name} />
      </Link>
      <button className="burger" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu"><span /><span /></button>
      <nav className={open ? 'open' : ''}>
        {NAV.filter(([to]) => to !== '/contact').map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}
        <NavLink to="/contact" className="nav-cta">Order / Contact</NavLink>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <>
      <div className="garland sep" aria-hidden="true" />
      <footer className="site-footer">
        <div className="foot-grid">
          <div>
            <strong className="foot-brand">TYOHAAR BOX</strong>
            <p>🎁 {SITE.tagline}<br />✨ Premium Hampers for Every Occasion<br />💝 Festive | Personal | Corporate Gifting<br />📦 Delivery Available</p>
          </div>
          <div>
            <h4>Explore</h4>
            {NAV.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}
          </div>
          <div>
            <h4>Legal</h4>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms &amp; Conditions</Link>
            <Link to="/cookies">Cookie Policy</Link>
          </div>
          <div>
            <h4>Order with us</h4>
            {SITE.phones.map((p) => <a key={p} href={tel(p)}>📞 {p}</a>)}
            <a href={waLink()} target="_blank" rel="noreferrer">💬 WhatsApp us</a>
            <a href={SITE.instagram} target="_blank" rel="noreferrer">📷 @tyohaarbox.in</a>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</span>
          {/* Visible on mobile only (CSS). Desktop uses Ctrl + Shift + A */}
          <Link to="/admin" className="admin-link">Admin</Link>
        </div>
      </footer>
    </>
  );
}

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Floaters() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 1000);
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <>
      <a className="fab-wa" href={waLink('Hi Tyohaar Box, I would like to know more about your hampers.')} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">💬 <span>WhatsApp</span></a>
      <button className={`back-top ${show ? 'show' : ''}`} aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑</button>
    </>
  );
}

function CookieBar() {
  const [seen, setSeen] = useState(() => {
    try { return localStorage.getItem('tb_cookie') === '1'; } catch (e) { return false; }
  });
  if (seen) return null;
  const ok = () => { try { localStorage.setItem('tb_cookie', '1'); } catch (e) { /* ignore */ } setSeen(true); };
  return (
    <div className="cookie" role="dialog" aria-label="Cookie notice">
      <p>We use only essential browser storage to make this site work. See our <Link to="/cookies">Cookie Policy</Link>.</p>
      <button className="btn gold small" onClick={ok}>Got it</button>
    </div>
  );
}

function HotKey() {
  const nav = useNavigate();
  useEffect(() => {
    const h = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') { e.preventDefault(); nav('/admin'); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [nav]);
  return null;
}

/* ───────────── reusable sections ───────────── */
function OccasionMarquee() {
  const row = [...OCCASIONS, ...OCCASIONS];
  return (
    <section className="marquee-wrap" aria-label="Occasions we gift for">
      <p className="marquee-title">GIFTS FOR EVERY OCCASION</p>
      <div className="marquee"><div className="marquee-track">{row.map((n, i) => <span key={i}>{n}</span>)}</div></div>
    </section>
  );
}

function Perks() {
  return (
    <Full tone="cream">
      <section className="section tight">
        <div className="perks">
          {PERKS.map((s, i) => (
            <Reveal key={s.t} delay={i * 80}><div className="perk"><span className="ic"><Icon k={s.k} /></span><strong>{s.t}</strong><small>{s.d}</small></div></Reveal>
          ))}
        </div>
      </section>
    </Full>
  );
}

function Collections() {
  return (
    <div className="grid4">
      {COLLECTIONS.map((c, i) => (
        <Reveal key={c.k} delay={i * 70}>
          <article className="card collection">
            <div className="art"><CollectionArt c={c} /></div>
            <h3>{c.t}</h3>
            <p>{c.d}</p>
            <Link to="/products" className="more">Browse hampers →</Link>
          </article>
        </Reveal>
      ))}
    </div>
  );
}

function Items() {
  return (
    <div className="items">
      {ITEMS.map((it, i) => (
        <Reveal key={it.k} delay={i * 60}>
          <div className="item"><div className="disc"><ItemArt k={it.k} /></div><h4>{it.t}</h4></div>
        </Reveal>
      ))}
    </div>
  );
}

function Steps() {
  return (
    <div className="grid3">
      {STEPS.map((s, i) => (
        <Reveal key={s.t} delay={i * 90}>
          <div className="step">
            <div className="step-art"><StepArt k={i} /></div>
            <span className="num">{i + 1}</span><h3>{s.t}</h3><p>{s.d}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

function Testimonials({ items }) {
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  const n = items.length;
  useEffect(() => {
    if (n < 2 || hold) return undefined;
    const t = setInterval(() => setI((x) => (x + 1) % n), 6000);
    return () => clearInterval(t);
  }, [n, hold]);
  if (!n) return null;
  const go = (d) => setI((x) => (x + d + n) % n);
  return (
    <div className="testi" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
      <div className="testi-view">
        <div className="testi-track" style={{ transform: `translateX(-${i * 100}%)` }}>
          {items.map((r) => (
            <div className="testi-slide" key={r.id}>
              <blockquote className="card review">
                <Stars value={Number(r.rating)} />
                <p>{r.message}</p>
                <footer><strong>{r.name}</strong>{r.role && <span> · {r.role}</span>}</footer>
              </blockquote>
            </div>
          ))}
        </div>
      </div>
      {n > 1 && (
        <div className="testi-nav">
          <button className="arrow" onClick={() => go(-1)} aria-label="Previous review">←</button>
          <div className="dots">{items.map((r, k) => <button key={r.id} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`Review ${k + 1}`} />)}</div>
          <button className="arrow" onClick={() => go(1)} aria-label="Next review">→</button>
        </div>
      )}
    </div>
  );
}

function Faq({ items = FAQS }) {
  return (
    <div className="faq">
      {items.map(([q, a]) => (
        <Reveal key={q}><details className="card"><summary>{q}</summary><p>{a}</p></details></Reveal>
      ))}
    </div>
  );
}

function InstaBlock() {
  return (
    <section className="section narrow">
      <Reveal>
        <div className="insta">
          <div>
            <h2>See our latest hampers</h2>
            <p>Follow @tyohaarbox.in on Instagram for new designs, festive offers and gifting ideas.</p>
          </div>
          <a className="btn gold" href={SITE.instagram} target="_blank" rel="noreferrer">Follow on Instagram</a>
        </div>
      </Reveal>
    </section>
  );
}

function Band({ title = 'Ready to make someone smile?', text = 'Message us on WhatsApp or call, and we will help you pick the perfect hamper.' }) {
  return (
    <section className="section">
      <Reveal>
        <div className="band">
          <Diya className="band-diya left" />
          <Diya className="band-diya right" />
          <h2>{title}</h2>
          <p>{text}</p>
          <div className="cta-row center-row">
            <a className="btn wa" href={waLink('Hi Tyohaar Box, I would like to order a hamper.')} target="_blank" rel="noreferrer">Order on WhatsApp</a>
            <Link className="btn ghost" to="/products">View hampers</Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ───────────── products ───────────── */
const GIFT_VARIANTS = [
  { a: '#8a1c33', b: '#f08a24', mark: '✦' },
  { a: '#b3315a', b: '#f2b6c6', mark: '♥' },
  { a: '#4a0a18', b: '#d4a24c', mark: '★' },
  { a: '#e4577a', b: '#ffd36b', mark: '☺' },
];
const giftFor = (p) => GIFT_VARIANTS[(String(p.name || '').length + String(p.category || '').length) % GIFT_VARIANTS.length];

function ProductCard({ p, onOpen }) {
  const order = waLink(`Hi Tyohaar Box, I would like to order: ${p.name}${hasPrice(p) ? ` (${inr(p.price)})` : ''}`);
  return (
    <Reveal>
      <article className="card product" onClick={() => onOpen && onOpen(p)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen && onOpen(p)}>
        <div className="thumb">
          {p.badge && <em className="badge">{p.badge}</em>}
          {p.category && <em className="cat-tag">{p.category}</em>}
          {p.image ? <img src={optimise(p.image, 700)} alt={p.name} loading="lazy" /> : <div className="art"><CollectionArt c={giftFor(p)} /></div>}
        </div>
        <div className="p-body">
          <h3>{p.name}</h3>
          <p className="clamp">{p.description}</p>
          <div className="p-foot">
            {hasPrice(p) ? <span className="price-tag">{inr(p.price)}</span> : <span className="price-tag ask">Ask for price</span>}
            <a className="btn wa small" href={order} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Order</a>
          </div>
        </div>
      </article>
    </Reveal>
  );
}

function Products() {
  const { loading, error, list } = useProducts();
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const cats = ['All', ...new Set(list.map((p) => p.category).filter(Boolean))];
  const shown = list
    .filter((p) => cat === 'All' || p.category === cat)
    .filter((p) => !q.trim() || `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(q.trim().toLowerCase()));

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && setOpen(null);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, []);

  return (
    <>
      <PageHead title="Our Hampers" sub="Premium festive, personal and corporate gifts, handpacked with love." bg={PHOTOS.festive} />
      <section className="section">
        <Status loading={loading} error={error} empty={!list.length && <EmptyArt text="Our hampers are being added. Message us on WhatsApp to see the latest collection." />}>
          <div className="toolbar">
            <div className="chips" style={{ margin: 0 }}>{cats.map((c) => <button key={c} className={c === cat ? 'on' : ''} onClick={() => setCat(c)}>{c}</button>)}</div>
            <input className="searchbox" type="search" placeholder="Search hampers…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search hampers" />
          </div>
          {shown.length ? (
            <div className="grid3">{shown.map((p) => <ProductCard key={p.id} p={p} onOpen={setOpen} />)}</div>
          ) : <div className="status">No hampers match your search.</div>}
        </Status>
        <p className="fine center-text" style={{ marginTop: 32 }}>Prices are per hamper. Customisation and delivery are confirmed with you on WhatsApp.</p>
      </section>
      <Band title="Want something custom?" text="Tell us the occasion and your budget, and we will design a hamper just for you." />
      {open && (
        <div className="modal" onClick={() => setOpen(null)} role="dialog" aria-modal="true">
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="x" onClick={() => setOpen(null)} aria-label="Close">×</button>
            <div className="modal-img">
              {open.image ? <img src={optimise(open.image, 1200)} alt={open.name} /> : <div className="art" style={{ width: '100%', maxWidth: 380 }}><CollectionArt c={giftFor(open)} /></div>}
            </div>
            <div className="modal-body">
              {open.category && <em className="tag">{open.category}</em>}
              <h2>{open.name}</h2>
              {hasPrice(open) && <span className="price-tag">{inr(open.price)}</span>}
              <p>{open.description}</p>
              <div className="cta-row" style={{ marginTop: 10 }}>
                <a className="btn wa" href={waLink(`Hi Tyohaar Box, I would like to order: ${open.name}${hasPrice(open) ? ` (${inr(open.price)})` : ''}`)} target="_blank" rel="noreferrer">Order on WhatsApp</a>
                <a className="btn ghost" href={tel(SITE.phones[0])}>Call {SITE.phones[0]}</a>
              </div>
              <small>Added {fmtDate(open.createdAt)}</small>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ───────────── home ───────────── */
function Home() {
  const products = useProducts();
  const reviews = useAsync(api.reviews);
  const featured = products.list.slice(0, 3);
  const topReviews = (reviews.data || []).filter((r) => Number(r.rating) >= 4).slice(0, 6);
  return (
    <>
      <section className="hero">
        <BgPhoto url={PHOTOS.hero} />
        <div className="bokeh" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
        <div className="hero-mandala" aria-hidden="true"><BigMandala /></div>
        <div className="garland top" aria-hidden="true" />
        <Lantern className="l1" color="#f08a24" />
        <Lantern className="l2" color="#c0392b" />
        <Lantern className="l3" color="#f08a24" />
        <Lantern className="l4" color="#8a1c33" />
        <Diya className="hero-diya" />
        <div className="hero-copy">
          <p className="hero-kicker">🎁 Tyohaar Box · {SITE.sub}</p>
          <h1>
            Curated gifts.
            <span>Timeless memories.</span>
          </h1>
          <div className="orn" aria-hidden="true"><span>✦</span></div>
          <p className="lead">Premium hampers for every occasion. Festive, personal and corporate gifting, handpacked with love and delivered to the ones you care about.</p>
          <div className="cta-row">
            <Link className="btn gold" to="/products">Shop hampers</Link>
            <a className="btn ghost" href={waLink('Hi Tyohaar Box, I would like to order a hamper.')} target="_blank" rel="noreferrer">Order on WhatsApp</a>
          </div>
        </div>
        <div className="hero-art">
          <span className="badge-float one">📦 Delivery available</span>
          <div className="hero-frame"><Hamper /></div>
          <span className="badge-float two">Handpacked with love ♥</span>
        </div>
      </section>

      <OccasionMarquee />
      <Perks />

      <section className="section">
        <SecIntro eyebrow="Our collections" title="A hamper for every occasion" sub="Festive, personal, corporate or just because. Pick a collection to begin." />
        <Collections />
      </section>

      <Full tone="cream">
        <section className="section">
          <SecIntro eyebrow="Shop by occasion" title="Find the right gift for the moment" sub="From festivals to milestones, pick the occasion and we will suggest the hamper." />
          <Occasions />
        </section>
      </Full>

      <Full tone="blush">
        <section className="section">
          <SecIntro eyebrow="Inside the box" title="Ideas for what goes inside" sub="Every hamper is different. Tell us what your loved ones enjoy and we will pack it that way." />
          <Items />
        </section>
      </Full>

      <section className="section">
        <Showcase
          photo={PHOTOS.packing}
          scene="packing"
          badge="Handpacked, one hamper at a time"
          eyebrow="Made with care"
          title="Every hamper is packed by hand"
          sub="Treats, extras and a personal touch are arranged beautifully, so the moment it is opened feels special."
          points={['Premium snacks, sweets and gourmet jars', 'Ribbons, wrapping and a message card', 'Customised to your budget and occasion']}
          cta={['Browse hampers', '/products']}
        />
      </section>

      <Full tone="cream">
        <section className="section">
          <Showcase
            photo={PHOTOS.corporate}
            scene="corporate"
            badge="Bulk and corporate orders welcome"
            eyebrow="Corporate gifting"
            title="Thoughtful gifts for clients and teams"
            sub="Festive and corporate hampers with tasteful packaging, made in the quantity you need."
            points={['Custom branding and message cards', 'Bulk quantities at a quoted price', 'Delivery arranged for you']}
            cta={['Get a quote', '/contact']}
            reverse
          />
        </section>
      </Full>

      {featured.length > 0 && (
        <section className="section">
          <SecIntro eyebrow="Fresh from the box" title="Our latest hampers" />
          <div className="grid3">{featured.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          <div className="center"><Link className="btn primary" to="/products">View all hampers</Link></div>
        </section>
      )}

      <Full tone="maroon">
        <section className="section">
          <SecIntro eyebrow="How it works" title="Gifting made simple" sub="Three easy steps from idea to doorstep." />
          <Steps />
        </section>
      </Full>

      {topReviews.length > 0 && (
        <Full tone="cream">
          <section className="section">
            <SecIntro eyebrow="Sweet words" title="What our customers say" />
            <Testimonials items={topReviews} />
            <div className="center"><Link className="btn ghost" to="/reviews">Read all reviews</Link></div>
          </section>
        </Full>
      )}

      <InstaBlock />

      <Full tone="cream">
        <section className="section narrow">
          <SecIntro eyebrow="FAQ" title="Good to know" />
          <Faq items={FAQS.slice(0, 4)} />
          <div className="center"><Link className="btn ghost" to="/contact">Ask us anything</Link></div>
        </section>
      </Full>

      <Band />
    </>
  );
}

/* ───────────── about ───────────── */
function About() {
  const values = [
    ['Thoughtful', 'Every hamper is chosen to feel personal, not generic.', 'heart'],
    ['Premium', 'Quality treats, tasteful packaging and a beautiful presentation.', 'star'],
    ['Handpacked', 'Arranged by hand with care, one hamper at a time.', 'gift'],
    ['Flexible', 'Festive, personal or corporate. We customise to your budget and occasion.', 'sparkle'],
    ['Reliable', 'Clear communication on WhatsApp from order to delivery.', 'chat'],
    ['Joyful', 'Our promise is simple: celebrate, gift and spread happiness.', 'heart'],
  ];
  return (
    <>
      <PageHead title="Celebrate. Gift. Spread Happiness." sub="Tyohaar Box curates premium hampers for the moments that matter." bg={PHOTOS.festive} />
      <section className="section">
        <div className="story">
          <Reveal>
            <div className="story-art"><div className="hamper-svg-wrap"><HamperFramed /></div><Diya /></div>
          </Reveal>
          <Reveal delay={100}>
            <div>
              <span className="eyebrow">Our story</span>
              <h2>Gifting that feels like a festival</h2>
              <p>Tyohaar means festival, and every festival is better when shared. Tyohaar Box brings together tasty treats, thoughtful extras and beautiful packaging into hampers that say what words sometimes cannot. From Diwali and Rakhi to birthdays, weddings and corporate thank-yous, we help you gift with warmth and style.</p>
              <p>Every box is handpacked, and many can be customised with your choice of items, a personal message and a theme to match the occasion. Delivery is available, and we stay in touch with you on WhatsApp from order to doorstep.</p>
              <div className="cta-row"><Link className="btn primary" to="/products">See our hampers</Link></div>
            </div>
          </Reveal>
        </div>
      </section>

      <Full tone="blush">
        <section className="section">
          <Showcase
            photo={PHOTOS.delivery}
            scene="delivery"
            badge="Delivery available"
            eyebrow="From our box to their door"
            title="We stay with you until it arrives"
            sub="Share the address and we confirm the delivery details on WhatsApp, so your gift reaches your loved ones on time."
            points={['Updates on WhatsApp from order to doorstep', 'Safe, careful packing for travel', 'Gifts sent to friends and family across cities']}
            cta={['Message us', '/contact']}
            reverse
          />
        </section>
      </Full>

      <Full tone="cream">
        <section className="section">
          <SecIntro eyebrow="What we offer" title="Gifting for every occasion" />
          <Collections />
        </section>
      </Full>

      <section className="section">
        <SecIntro eyebrow="Inside the box" title="Ideas for what goes inside" />
        <Items />
      </section>

      <Full tone="blush">
        <section className="section">
          <SecIntro eyebrow="Our values" title="What we stand for" />
          <div className="grid3">
            {values.map(([t, d, ic], i) => (
              <Reveal key={t} delay={(i % 3) * 90}><article className="card"><span className="ic" style={{ marginBottom: 14 }}><Icon k={ic} /></span><h3>{t}</h3><p>{d}</p></article></Reveal>
            ))}
          </div>
        </section>
      </Full>

      <Full tone="maroon">
        <section className="section">
          <SecIntro eyebrow="How it works" title="Gifting made simple" />
          <Steps />
        </section>
      </Full>

      <section className="section">
        <SecIntro eyebrow="Occasions" title="We gift for" />
        <div className="chips tags">{OCCASIONS.map((n) => <span key={n} className="tagchip">{n}</span>)}</div>
      </section>

      <Band title="Let’s plan your next gift" text="Share the occasion and your budget, and we will suggest the perfect hamper." />
    </>
  );
}

// The hamper drawing with the hamper-svg class (used inside framed cards)
function HamperFramed() {
  return <div className="hamper-svg" style={{ position: 'relative', zIndex: 1 }}><Hamper /></div>;
}

/* ───────────── reviews ───────────── */
function Reviews() {
  const { loading, error, data, reload } = useAsync(api.reviews);
  const blank = { name: '', role: '', rating: 5, message: '' };
  const [f, setF] = useState(blank);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const list = data || [];
  const avg = list.length ? (list.reduce((a, r) => a + Number(r.rating || 0), 0) / list.length).toFixed(1) : null;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setNote(null);
    try {
      await api.addReview(f);
      setF(blank);
      setShow(false);
      setNote({ ok: true, t: 'Thank you! Your review is now live.' });
      reload();
    } catch (err) { setNote({ ok: false, t: err.message }); }
    setBusy(false);
  };

  return (
    <>
      <PageHead title="Customer Reviews" sub={avg ? `${avg} out of 5 from ${list.length} review${list.length > 1 ? 's' : ''}` : 'Be the first to share your experience.'} bg={PHOTOS.gifting} />
      <section className="section narrow">
        <div className="toolbar">
          <h2>All reviews</h2>
          <button className="btn primary" onClick={() => { setShow(!show); setNote(null); }}>{show ? 'Close form' : '+ Add a review'}</button>
        </div>

        {show && (
          <form className="card form form-panel" onSubmit={submit}>
            <h3>Write a review</h3>
            <label>Your name<input required maxLength={80} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
            <label>Occasion or city (optional)<input maxLength={80} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} /></label>
            <label>Rating<Stars value={f.rating} onChange={(rating) => setF({ ...f, rating })} /></label>
            <label>Your review<textarea required rows={4} maxLength={800} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></label>
            <div className="cta-row" style={{ marginTop: 0 }}>
              <button className="btn primary" disabled={busy}>{busy ? 'Posting…' : 'Post review'}</button>
              <button type="button" className="btn ghost" onClick={() => setShow(false)}>Cancel</button>
            </div>
            {note && !note.ok && <p className="note bad">{note.t}</p>}
          </form>
        )}
        {note && note.ok && <p className="note ok" style={{ marginBottom: 24 }}>{note.t}</p>}

        <Status loading={loading} error={error} empty={!list.length && <EmptyArt text="No reviews yet. Be the first to share your experience." />}>
          <div className="reviews">
            {list.map((r) => (
              <Reveal key={r.id}>
                <blockquote className="card review">
                  <Stars value={Number(r.rating)} />
                  <p>{r.message}</p>
                  <footer><strong>{r.name}</strong>{r.role && <span> · {r.role}</span>}<small>{fmtDate(r.createdAt)}</small></footer>
                </blockquote>
              </Reveal>
            ))}
          </div>
        </Status>
      </section>
    </>
  );
}

/* ───────────── contact ───────────── */
function Contact() {
  const blank = { name: '', email: '', phone: '', message: '', website: '' };
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setNote(null);
    try {
      await api.sendMessage(f);
      setF(blank);
      setNote({ ok: true, t: 'Thank you! Your message is sent. We will contact you soon.' });
    } catch (err) { setNote({ ok: false, t: err.message }); }
    setBusy(false);
  };

  return (
    <>
      <PageHead title="Let’s plan your gift" sub="Tell us the occasion and your budget. We will take care of the rest." bg={PHOTOS.delivery} />
      <section className="section split">
        <div className="info">
          {SITE.phones.map((p) => (
            <a key={p} className="card info-card" href={tel(p)}><span>Call us</span><strong>{p}</strong></a>
          ))}
          <a className="btn wa block" href={waLink('Hi Tyohaar Box, I would like to order a hamper.')} target="_blank" rel="noreferrer">💬 Chat on WhatsApp</a>
          <a className="card info-card" href={SITE.instagram} target="_blank" rel="noreferrer"><span>Instagram</span><strong>@tyohaarbox.in</strong></a>
          <div className="card info-card"><span>Good to know</span>
            <ul className="ticks small-list" style={{ marginTop: 8 }}><li>Premium hampers for every occasion</li><li>Festive, personal and corporate gifting</li><li>Delivery available</li></ul>
          </div>
          <Photo src={PHOTOS.gifting} scene="gifting" alt="A Tyohaar Box gift hamper" badge="Handpacked with love" />
        </div>
        <form className="card form" onSubmit={submit}>
          <h3>Send us a message</h3>
          <label>Your name<input required maxLength={80} value={f.name} onChange={set('name')} /></label>
          <div className="two">
            <label>Phone / WhatsApp<input required type="tel" maxLength={30} value={f.phone} onChange={set('phone')} /></label>
            <label>Email (optional)<input type="email" maxLength={120} value={f.email} onChange={set('email')} /></label>
          </div>
          <label>What are you looking for?<textarea required rows={5} maxLength={1500} placeholder="Occasion, budget, delivery city, any special message…" value={f.message} onChange={set('message')} /></label>
          <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={f.website} onChange={set('website')} />
          <p className="fine">By sending this you agree to our <Link to="/privacy">Privacy Policy</Link>.</p>
          <button className="btn primary" disabled={busy}>{busy ? 'Sending…' : 'Send message'}</button>
          {note && <p className={`note ${note.ok ? 'ok' : 'bad'}`}>{note.t}</p>}
        </form>
      </section>
    </>
  );
}

/* ───────────── legal ───────────── */
const PRIVACY = [
  ['Who we are', `${SITE.name} (“we”, “us”) offers curated gift hampers for festive, personal and corporate gifting. This policy explains what personal information we collect through this website and how we handle it.`],
  ['Information we collect', 'Contact details you send us (name, phone, email, message); reviews you post (name, occasion or city, rating, text); and basic technical data such as browser type and pages visited. We do not collect payment card details on this site.'],
  ['How we use it', 'To reply to your enquiries and orders, display your review on our Reviews page, improve our website and products, keep the site secure and meet legal obligations. We do not sell your personal information.'],
  ['Where data is stored', 'Messages and reviews are stored in Google Sheets through Google Apps Script. Product images are hosted by Cloudinary. These providers process data on our behalf under their own security and privacy terms.'],
  ['WhatsApp and phone', 'If you contact us through WhatsApp or by phone, your number and messages are handled under the terms of those services and used only to serve your enquiry or order.'],
  ['Reviews are public', 'Anything you write in a review, including your name, is shown publicly. Do not include private information. You can ask us to remove your review at any time.'],
  ['How long we keep data', 'Enquiries are kept for as long as needed to respond and for up to 24 months afterwards. Reviews stay online until you ask us to delete them.'],
  ['Your rights', `You may request access, correction or deletion of your personal information by calling or messaging us on ${SITE.phones[0]}. We will respond within 30 days.`],
  ['Security', 'We use HTTPS, access-controlled admin tools and input validation. No online system is perfectly secure, so we cannot guarantee absolute security.'],
  ['Children', 'This website is not directed to children under 13, and we do not knowingly collect their data.'],
  ['Changes', 'We may update this policy and will change the date above when we do.'],
  ['Contact', `Questions about privacy? Call or WhatsApp ${SITE.phones.join(' or ')}.`],
];
const TERMS = [
  ['Acceptance', 'By using this website you agree to these Terms & Conditions. If you do not agree, please do not use the site.'],
  ['Products and prices', 'Hamper descriptions, images and prices on this site are for guidance. Contents may vary slightly depending on availability. The final hamper, price and delivery details are confirmed with you before your order is accepted.'],
  ['Orders and payment', 'Orders are confirmed through WhatsApp, phone or the contact form. Payment method, amount and timing are agreed with you at the time of order.'],
  ['Customisation', 'Customised hampers are made to your request and may need advance notice. We will tell you the timeline when we confirm your order.'],
  ['Delivery', 'Delivery is available. Charges, areas and timelines are confirmed with you before dispatch. Please share a correct address and phone number.'],
  ['Cancellations and changes', 'Please contact us as early as possible to change or cancel an order. Customised or already-packed hampers may not be cancellable. We will confirm what is possible when you reach out.'],
  ['Perishable items', 'Hampers may include food items. Please check contents for allergies and consume within the best-before date shown on the products.'],
  ['Using the website', 'You agree not to misuse the site: no attempts to gain unauthorized access, upload harmful code, scrape it at harmful volumes or send spam through the forms.'],
  ['Reviews and submissions', 'You confirm that reviews are honest, based on real experience and do not contain unlawful, defamatory or private content. You grant us a free licence to display your review on our website. We may remove any submission at our discretion.'],
  ['Intellectual property', 'Website content, branding, photographs and designs belong to Tyohaar Box and are protected by law. Please do not copy them without permission.'],
  ['No warranty and liability', 'The website is provided “as is”. To the extent permitted by law, we are not liable for indirect or consequential losses arising from use of this website.'],
  ['Governing law', 'These terms are governed by the laws of India.'],
  ['Changes', 'We may update these terms at any time. Continued use of the site means you accept the updated terms.'],
  ['Contact', `Questions about these terms? Call or WhatsApp ${SITE.phones.join(' or ')}.`],
];
const COOKIES = [
  ['What are cookies?', 'Cookies and similar technologies are small pieces of data stored in your browser. They help websites remember your choices and work properly.'],
  ['What we use', 'We use only essential browser storage. For example, we remember that you dismissed the cookie notice, and we keep an administrator signed in during a session in the admin area.'],
  ['What we do not use', 'We do not use advertising cookies or sell data collected through cookies. We do not run behavioural tracking on this website.'],
  ['Third-party content', 'Fonts are loaded from Google Fonts and images from Cloudinary. These services may receive technical information such as your IP address when your browser loads their files, under their own policies. Links to WhatsApp and Instagram open those services, which have their own cookie policies.'],
  ['Managing cookies', 'You can clear or block cookies and site storage in your browser settings. Essential features such as the admin sign-in may stop working if you do.'],
  ['Changes', 'We may update this policy and will change the date above when we do.'],
  ['Contact', `Questions about cookies? Call or WhatsApp ${SITE.phones.join(' or ')}.`],
];

function Legal({ title, items }) {
  return (
    <>
      <PageHead title={title} sub={`Last updated: ${SITE.updated}`} />
      <section className="section narrow legal">
        {items.map(([h, p], i) => (
          <article key={h}><h2>{i + 1}. {h}</h2><p>{p}</p></article>
        ))}
        <p className="fine">This document is a general template. Have a qualified lawyer review it before relying on it.</p>
      </section>
    </>
  );
}

/* ───────────── admin ───────────── */
const EMPTY_PRODUCT = { id: '', name: '', category: '', price: '', description: '', image: '', badge: '' };

function Admin() {
  const [key, setKey] = useState(() => sessionStorage.getItem('tb_key') || '');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('products');

  const login = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try { await api.login(pw); sessionStorage.setItem('tb_key', pw); setKey(pw); }
    catch (x) { setErr(x.message); }
    setBusy(false);
  };
  const logout = () => { sessionStorage.removeItem('tb_key'); setKey(''); setPw(''); };
  const rekey = (next) => { sessionStorage.setItem('tb_key', next); setKey(next); };

  if (!key) {
    return (
      <section className="section narrow pad-top">
        <form className="card form login" onSubmit={login}>
          <h1>Admin sign in</h1>
          <label>Password<input type="password" autoFocus required value={pw} onChange={(e) => setPw(e.target.value)} /></label>
          <button className="btn primary" disabled={busy}>{busy ? 'Checking…' : 'Sign in'}</button>
          {err && <p className="note bad">{err}</p>}
        </form>
      </section>
    );
  }

  return (
    <section className="section narrow admin">
      <div className="admin-bar">
        <h1>Admin</h1>
        <div className="chips">
          {[['products', 'Products'], ['reviews', 'Reviews'], ['messages', 'Messages'], ['settings', 'Settings']].map(([k, l]) => (
            <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
          ))}
          <button onClick={logout}>Sign out</button>
        </div>
      </div>
      {tab === 'products' && <AdminProducts k={key} onAuthFail={logout} />}
      {tab === 'reviews' && <AdminReviews k={key} onAuthFail={logout} />}
      {tab === 'messages' && <AdminMessages k={key} onAuthFail={logout} />}
      {tab === 'settings' && <AdminSettings k={key} onAuthFail={logout} onChanged={rekey} />}
    </section>
  );
}

function AdminProducts({ k, onAuthFail }) {
  const { loading, error, data, reload } = useAsync(api.products);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [show, setShow] = useState(false);
  const [up, setUp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const fail = (e) => { if (isAuthError(e)) onAuthFail(); setNote({ ok: false, t: e.message }); };
  const closeForm = () => { setShow(false); setForm(EMPTY_PRODUCT); };

  const pick = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUp(true); setNote(null);
    try { const image = await uploadImage(file); setForm((f) => ({ ...f, image })); }
    catch (x) { setNote({ ok: false, t: x.message }); }
    setUp(false);
    e.target.value = '';
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setNote(null);
    try {
      const editing = !!form.id;
      if (editing) await api.updateProduct(k, form); else await api.addProduct(k, form);
      setNote({ ok: true, t: editing ? 'Product updated.' : 'Product added.' });
      closeForm();
      reload();
    } catch (x) { fail(x); }
    setBusy(false);
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete “${p.name}”? This can’t be undone.`)) return;
    try { await api.deleteProduct(k, p.id); setNote({ ok: true, t: 'Product deleted.' }); reload(); } catch (x) { fail(x); }
  };

  const edit = (p) => {
    setForm({ id: p.id, name: p.name, category: p.category, price: p.price === 0 ? '' : String(p.price ?? ''), description: p.description, image: p.image, badge: p.badge });
    setShow(true); setNote(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <div className="toolbar">
        <h3>Posted products</h3>
        <button className="btn primary" onClick={() => { if (show) closeForm(); else { setForm(EMPTY_PRODUCT); setShow(true); } setNote(null); }}>{show ? 'Close form' : '+ Add product'}</button>
      </div>

      {show && (
        <form className="card form form-panel" onSubmit={save}>
          <h3>{form.id ? 'Edit product' : 'Add a product'}</h3>
          <label>Name<input required maxLength={120} placeholder="e.g. The Classic Hamper" value={form.name} onChange={set('name')} /></label>
          <div className="two">
            <label>Category<input maxLength={40} placeholder="e.g. Festive, Corporate, Kids" value={form.category} onChange={set('category')} /></label>
            <label>Price in ₹ (optional)<input type="number" min="0" step="1" placeholder="850" value={form.price} onChange={set('price')} /></label>
          </div>
          <label>Badge (optional)<input maxLength={30} placeholder="e.g. Bestseller, New, Surprise Inside" value={form.badge} onChange={set('badge')} /></label>
          <label>Description<textarea rows={4} maxLength={1200} placeholder="What is inside the hamper?" value={form.description} onChange={set('description')} /></label>
          <div className="upload">
            {form.image ? <img src={optimise(form.image, 400)} alt="Preview" /> : <span className="noimg">🎁</span>}
            <div>
              <label className="btn ghost small">{up ? 'Uploading…' : form.image ? 'Replace image' : 'Upload image'}<input type="file" accept="image/*" hidden onChange={pick} disabled={up} /></label>
              {form.image && <button type="button" className="link-btn" onClick={() => setForm({ ...form, image: '' })}>Remove</button>}
            </div>
          </div>
          <div className="cta-row" style={{ marginTop: 0 }}>
            <button className="btn primary" disabled={busy || up}>{busy ? 'Saving…' : form.id ? 'Save changes' : 'Add product'}</button>
            <button type="button" className="btn ghost" onClick={closeForm}>Cancel</button>
          </div>
        </form>
      )}
      {note && <p className={`note ${note.ok ? 'ok' : 'bad'}`} style={{ marginBottom: 20 }}>{note.t}</p>}

      <Status loading={loading} error={error} empty={!(data || []).length && 'No products yet. Click “+ Add product” to add your first hamper.'}>
        <ul className="rows">
          {(data || []).map((p) => (
            <li key={p.id} className="card row">
              {p.image ? <img src={optimise(p.image, 200)} alt="" /> : <span className="noimg sm">🎁</span>}
              <div><strong>{p.name}</strong><small>{p.category}{hasPrice(p) ? ` · ${inr(p.price)}` : ''} · {fmtDate(p.createdAt)}</small></div>
              <div className="row-actions">
                <button className="btn ghost small" onClick={() => edit(p)}>Edit</button>
                <button className="btn danger small" onClick={() => remove(p)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </Status>
    </div>
  );
}

function AdminReviews({ k, onAuthFail }) {
  const { loading, error, data, reload } = useAsync(api.reviews);
  const [note, setNote] = useState('');
  const remove = async (r) => {
    if (!window.confirm(`Delete the review by ${r.name}?`)) return;
    try { await api.deleteReview(k, r.id); reload(); }
    catch (e) { if (isAuthError(e)) onAuthFail(); setNote(e.message); }
  };
  return (
    <Status loading={loading} error={error} empty={!(data || []).length && 'No reviews posted yet.'}>
      {note && <p className="note bad">{note}</p>}
      <ul className="rows">
        {(data || []).map((r) => (
          <li key={r.id} className="card row review-row">
            <div>
              <Stars value={Number(r.rating)} />
              <p>{r.message}</p>
              <small>{r.name}{r.role && ` · ${r.role}`} · {fmtDate(r.createdAt)}</small>
            </div>
            <button className="btn danger small" onClick={() => remove(r)}>Delete</button>
          </li>
        ))}
      </ul>
    </Status>
  );
}

function AdminMessages({ k, onAuthFail }) {
  const { loading, error, data, reload } = useAsync(() => api.messages(k));
  const remove = async (m) => {
    if (!window.confirm(`Delete the message from ${m.name}?`)) return;
    try { await api.deleteMessage(k, m.id); reload(); } catch (e) { if (isAuthError(e)) onAuthFail(); }
  };
  return (
    <Status loading={loading} error={error} empty={!(data || []).length && 'No messages yet.'}>
      <ul className="rows">
        {(data || []).map((m) => (
          <li key={m.id} className="card row review-row">
            <div>
              <strong>{m.name}</strong>
              <small>
                <a href={`tel:${String(m.phone).replace(/\s/g, '')}`}>{m.phone}</a>
                {m.email && <> · <a href={`mailto:${m.email}`}>{m.email}</a></>} · {fmtDate(m.createdAt)}
              </small>
              <p>{m.message}</p>
              <a className="btn wa small" href={`https://wa.me/${String(m.phone).replace(/[^0-9]/g, '').replace(/^(\d{10})$/, '91$1')}`} target="_blank" rel="noreferrer">Reply on WhatsApp</a>
            </div>
            <button className="btn danger small" onClick={() => remove(m)}>Delete</button>
          </li>
        ))}
      </ul>
    </Status>
  );
}

function AdminSettings({ k, onAuthFail, onChanged }) {
  const blank = { current: '', next: '', again: '' };
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);
  const set = (n) => (e) => setF({ ...f, [n]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setNote(null);
    if (f.current !== k) { setNote({ ok: false, t: 'Current password is not correct.' }); return; }
    if (f.next.length < 6) { setNote({ ok: false, t: 'New password must be at least 6 characters.' }); return; }
    if (f.next !== f.again) { setNote({ ok: false, t: 'The two new passwords do not match.' }); return; }
    setBusy(true);
    try {
      await api.changePassword(k, f.next);
      onChanged(f.next);
      setF(blank);
      setNote({ ok: true, t: 'Password changed. Use the new password next time you sign in.' });
    } catch (x) {
      if (isAuthError(x)) onAuthFail();
      setNote({ ok: false, t: x.message });
    }
    setBusy(false);
  };

  return (
    <form className="card form form-panel" onSubmit={submit}>
      <h3>Change admin password</h3>
      <label>Current password<input type="password" required autoComplete="current-password" value={f.current} onChange={set('current')} /></label>
      <label>New password<input type="password" required minLength={6} maxLength={100} autoComplete="new-password" value={f.next} onChange={set('next')} /></label>
      <label>Repeat new password<input type="password" required minLength={6} maxLength={100} autoComplete="new-password" value={f.again} onChange={set('again')} /></label>
      <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button>
      {note && <p className={`note ${note.ok ? 'ok' : 'bad'}`}>{note.t}</p>}
    </form>
  );
}

/* ───────────── error boundary: shows errors on screen instead of a blank page ───────────── */
class Boundary extends React.Component {
  state = { err: null };
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (this.state.err) {
      return (
        <div className="status err" style={{ padding: '120px 20px' }}>
          <h2>Something went wrong</h2>
          <p>{String(this.state.err.message || this.state.err)}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ───────────── app ───────────── */
function NotFound() {
  return <><PageHead title="Page not found" sub="That page doesn’t exist." /><div className="center" style={{ padding: '40px 0 80px' }}><Link className="btn primary" to="/">Back to home</Link></div></>;
}

export default function App() {
  return (
    <Boundary>
    <HashRouter>
      <style>{EXTRA_CSS}</style>
      <Defs />
      <Loader />
      <ScrollTop />
      <HotKey />
      <Header />
      <main>
        <Boundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/products" element={<Products />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Legal title="Privacy Policy" items={PRIVACY} />} />
          <Route path="/terms" element={<Legal title="Terms & Conditions" items={TERMS} />} />
          <Route path="/cookies" element={<Legal title="Cookie Policy" items={COOKIES} />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Boundary>
      </main>
      <Footer />
      <Floaters />
      <CookieBar />
    </HashRouter>
    </Boundary>
  );
}