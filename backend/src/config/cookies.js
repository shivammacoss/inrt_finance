/**
 * @param {import('./env').Env} env
 * @param {number} maxAgeMs
 */
function accessCookieOptions(env, maxAgeMs) {
  const prod = env.nodeEnv === 'production';
  return {
    httpOnly: true,
    secure: prod,
    sameSite: prod ? 'strict' : 'lax',
    maxAge: maxAgeMs,
    path: '/',
  };
}

/**
 * Scoped to /auth so refresh token is not sent to every API route.
 */
function refreshCookieOptions(env, maxAgeMs) {
  const prod = env.nodeEnv === 'production';
  return {
    httpOnly: true,
    secure: prod,
    sameSite: prod ? 'strict' : 'lax',
    maxAge: maxAgeMs,
    path: '/auth',
  };
}

const ACCESS_NAME = 'inrt_access';
const REFRESH_NAME = 'inrt_refresh';

module.exports = {
  accessCookieOptions,
  refreshCookieOptions,
  ACCESS_NAME,
  REFRESH_NAME,
};
