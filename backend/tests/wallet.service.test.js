const walletService = require('../src/services/wallet.service');

describe('wallet.service', () => {
  test('normalizeDecimal accepts valid positive decimals', () => {
    expect(walletService.normalizeDecimal('1')).toBe('1');
    expect(walletService.normalizeDecimal('10.5')).toBe('10.5');
  });

  test('normalizeDecimal rejects invalid', () => {
    expect(() => walletService.normalizeDecimal('-1')).toThrow();
    expect(() => walletService.normalizeDecimal('abc')).toThrow();
  });

  test('addDecimalStrings', () => {
    expect(walletService.addDecimalStrings('0', '1.5', 18)).toBe('1.5');
  });
});
