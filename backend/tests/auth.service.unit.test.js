const { parseExpiresToSeconds } = require('../src/utils/duration');

describe('duration', () => {
  test('parseExpiresToSeconds', () => {
    expect(parseExpiresToSeconds('15m')).toBe(15 * 60);
    expect(parseExpiresToSeconds('7d')).toBe(7 * 86400);
  });
});
