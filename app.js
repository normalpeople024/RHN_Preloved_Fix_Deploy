// ═══════════════════════════════════════════════════════
// app.js — RHN Preloved  (ES Module, no Firebase Storage)
// ═══════════════════════════════════════════════════════

import {
  auth, db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile,
  collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, serverTimestamp
} from './firebase.js';

// ── HELPERS ───────────────────────────────────────────
export const formatRp = n =>
  new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);

export const waNumber = phone => {
  const c = (phone||'').replace(/\D/g,'');
  return c.startsWith('0') ? '62'+c.slice(1) : c;
};

// Compress image → base64 (max 800px, quality 0.65)
export function compressImage(file, maxPx = 800, quality = 0.65) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        if (width > height) { height = Math.round(height * maxPx / width); width = maxPx; }
        else { width = Math.round(width * maxPx / height); height = maxPx; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ── TOAST ─────────────────────────────────────────────
export function toast(msg, type = 'info') {
  let c = document.getElementById('toast-container');
  if (!c) { c = document.createElement('div'); c.id='toast-container'; document.body.appendChild(c); }
  const el = document.createElement('div');
  el.className = `toast ${type}`; el.textContent = msg;
  c.appendChild(el);
  setTimeout(()=>{ el.classList.add('out'); el.addEventListener('animationend',()=>el.remove()); }, 3500);
}

// ── AUTH GUARD ────────────────────────────────────────
export function requireAuth() {
  return new Promise(resolve => {
    const unsub = onAuthStateChanged(auth, user => {
      unsub();
      if (!user) { window.location.href = 'index.html'; return; }
      resolve(user);
    });
  });
}

// ── USER PROFILE — never returns null, never overwrites existing data ────
export async function getUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db,'users',uid));
    if (snap.exists()) {
      // If Firestore doc exists but phone is empty, check localStorage pending profile
      const data = { id: snap.id, ...snap.data() };
      if (!data.phone) {
        const pending = _getPendingProfile(uid);
        if (pending?.phone) {
          // Save the phone back to Firestore silently
          try {
            await setDoc(doc(db,'users',uid), { ...data, phone: pending.phone }, { merge: true });
            localStorage.removeItem(`rhn_pending_profile_${uid}`);
            data.phone = pending.phone;
          } catch {}
        }
      }
      return data;
    }
  } catch(e) {
    console.warn('getUserProfile error:', e.message);
  }

  // Doc doesn't exist yet — check localStorage pending profile first
  const pending = _getPendingProfile(uid);
  const au = auth.currentUser;
  const profile = {
    id:       uid,
    name:     pending?.name     || au?.displayName || au?.email?.split('@')[0] || 'Pengguna',
    username: pending?.username || (au?.email?.split('@')[0] || uid.slice(0,8)).replace(/[^a-z0-9_]/gi,''),
    email:    pending?.email    || au?.email || '',
    phone:    pending?.phone    || ''
  };

  // Try to save to Firestore (doc truly missing, not a timing issue)
  if (pending) {
    try {
      await setDoc(doc(db,'users',uid), { ...profile, createdAt: serverTimestamp() });
      localStorage.removeItem(`rhn_pending_profile_${uid}`);
    } catch {}
  }

  return profile;
}

function _getPendingProfile(uid) {
  try {
    const raw = localStorage.getItem(`rhn_pending_profile_${uid}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── LOCAL CART (per uid, per browser) ─────────────────
const cartKey   = () => `rhn_cart_${auth.currentUser?.uid||'guest'}`;
export const getLocalCart    = () => { try { return JSON.parse(localStorage.getItem(cartKey())||'[]'); } catch { return []; } };
export const setLocalCart    = c  => localStorage.setItem(cartKey(), JSON.stringify(c));
export const updateCartBadge = () => {
  const n = getLocalCart().length;
  document.querySelectorAll('#cart-count').forEach(el => el.textContent = n||'');
};

// ── NAV ───────────────────────────────────────────────
export function renderNav(profile) {
  const root = document.getElementById('nav-root');
  if (!root) return;
  const path = location.pathname.split('/').pop() || 'home.html';
  const n = getLocalCart().length;
  const name = profile?.name || 'Pengguna';

  root.innerHTML = `
    <div class="nav-wrap">
      <nav class="nav container">
        <a class="brand" href="home.html">
          <span>RHN</span><span class="brand-badge">Preloved</span>
        </a>
        <div class="nav-center">
          <a class="nav-link ${path==='home.html'?'active':''}" href="home.html">
            <i class="fa-solid fa-store"></i> Marketplace
          </a>
          <a class="nav-link ${path==='seller.html'?'active':''}" href="seller.html">
            <i class="fa-solid fa-tag"></i> Jual Barang
          </a>
          <a class="nav-link ${path==='profile.html'?'active':''}" href="profile.html">
            <i class="fa-solid fa-circle-user"></i> Akun Saya
          </a>
        </div>
        <div class="nav-right">
          <a class="cart-btn" href="cart.html">
            <i class="fa-solid fa-cart-shopping"></i>
            <span class="cart-badge" id="cart-count">${n||''}</span>
          </a>
          <a class="user-chip" href="profile.html">
            <span style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--pink));color:#fff;font-size:.72rem;font-weight:800;display:grid;place-items:center;flex-shrink:0">
              ${name.charAt(0).toUpperCase()}
            </span>
            ${name.split(' ')[0]}
          </a>
        </div>
        <button class="hamburger" aria-label="Menu"><span></span><span></span><span></span></button>
      </nav>
      <div class="mobile-menu">
        <a class="nav-link" href="home.html"><i class="fa-solid fa-store"></i> Marketplace</a>
        <a class="nav-link" href="seller.html"><i class="fa-solid fa-tag"></i> Jual Barang</a>
        <a class="nav-link" href="cart.html"><i class="fa-solid fa-cart-shopping"></i> Keranjang${n?` (${n})`:''}</a>
        <a class="nav-link" href="profile.html"><i class="fa-solid fa-circle-user"></i> Akun Saya</a>
      </div>
    </div>`;

  root.querySelector('.hamburger').addEventListener('click', () => {
    root.querySelector('.mobile-menu').classList.toggle('open');
  });

  const chip = document.getElementById('role-chip');
  if (chip && profile) {
    chip.innerHTML = `<span class="chip">👤 ${profile.name}</span><span class="chip">@${profile.username}</span>`;
  }
}

// Re-export everything pages need
export {
  auth, db, serverTimestamp,
  onAuthStateChanged, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile,
  collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, onSnapshot
};
