/** Parse express-jwt style duration e.g. 15m, 7d → seconds */
function parseExpiresToSeconds(exp) {
  const m = String(exp || '7d').trim().match(/^(\d+)([smhd])$/i);
  if (!m) return 7 * 24 * 60 * 60;
  const n = parseInt(m[1], 10);
  const u = m[2].toLowerCase();
  const mult = { s: 1, m: 60, h: 3600, d: 86400 };
  return n * mult[u];
}

module.exports = { parseExpiresToSeconds };
