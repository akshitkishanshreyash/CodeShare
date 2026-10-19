const COLORS = ['#2D54E8', '#E8590C', '#1F8A63', '#B02A8F', '#0B7285', '#C2255C', '#5F3DC4', '#9C6A00'];

// Guest identity survives refreshes within the same tab.
export function getGuestIdentity() {
  try {
    const saved = sessionStorage.getItem('cs.guest');
    if (saved) return JSON.parse(saved);
  } catch { /* storage unavailable */ }
  const guest = {
    name: `Guest ${Math.floor(1000 + Math.random() * 9000)}`,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  };
  try { sessionStorage.setItem('cs.guest', JSON.stringify(guest)); } catch { /* ignore */ }
  return guest;
}

export function colorFor(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
}
