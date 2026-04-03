const { ethers } = require('ethers');
const logger = require('../utils/logger');

const ERC20_ABI = [
  'function mint(address to, uint256 amount)',
  'function burn(uint256 amount)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

let provider;
let signer;
let contract;
let cacheKey = '';
/** Decimals resolved without signer (RPC read-only); keyed by rpc|contract */
let decimalsCacheKey = '';
let decimalsCacheValue = null;

function chainCacheKey(env) {
  return `${env.rpcUrl}|${env.privateKey}|${env.contractAddress}|${env.tokenDecimals ?? 'rpc'}`;
}

function resetChainClients() {
  provider = undefined;
  signer = undefined;
  contract = undefined;
  cacheKey = '';
  decimalsCacheKey = '';
  decimalsCacheValue = null;
}

function ensureChainEnv(env) {
  if (!env.rpcUrl || !String(env.rpcUrl).trim()) {
    const err = new Error('RPC_URL is not configured');
    err.status = 503;
    throw err;
  }
  if (!env.contractAddress || !String(env.contractAddress).trim()) {
    const err = new Error('CONTRACT_ADDRESS is not configured');
    err.status = 503;
    throw err;
  }
  if (!env.privateKey || !String(env.privateKey).trim()) {
    const err = new Error(
      'PRIVATE_KEY is missing or invalid in .env (must be 0x + 64 hex characters)'
    );
    err.status = 503;
    throw err;
  }
}

function getProvider(rpcUrl) {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(rpcUrl);
  }
  return provider;
}

function getSigner(rpcUrl, privateKey) {
  if (!signer) {
    const p = getProvider(rpcUrl);
    try {
      signer = new ethers.Wallet(privateKey, p);
    } catch (e) {
      logger.error('Wallet signer creation failed', { message: e.message });
      const err = new Error(
        'Could not create wallet from PRIVATE_KEY. Check for typos, whitespace, or wrong length (64 hex after 0x).'
      );
      err.status = 503;
      err.cause = e;
      throw err;
    }
  }
  return signer;
}

function getContract(rpcUrl, privateKey, contractAddress) {
  if (!contract) {
    const s = getSigner(rpcUrl, privateKey);
    if (!ethers.isAddress(contractAddress)) {
      const err = new Error('CONTRACT_ADDRESS is not a valid Ethereum address');
      err.status = 400;
      throw err;
    }
    contract = new ethers.Contract(contractAddress, ERC20_ABI, s);
  }
  return contract;
}

function bindEnv(env) {
  const k = chainCacheKey(env);
  if (k !== cacheKey) {
    resetChainClients();
    cacheKey = k;
  }
  ensureChainEnv(env);
}

/**
 * Token decimals for formatting — does NOT require PRIVATE_KEY (uses TOKEN_DECIMALS or RPC read).
 */
async function getDecimals(env) {
  if (typeof env.tokenDecimals === 'number' && Number.isFinite(env.tokenDecimals)) {
    return env.tokenDecimals;
  }
  const k = `${env.rpcUrl || ''}|${String(env.contractAddress || '').toLowerCase()}`;
  if (decimalsCacheKey === k && decimalsCacheValue !== null) {
    return decimalsCacheValue;
  }
  if (!env.rpcUrl?.trim() || !env.contractAddress?.trim()) {
    decimalsCacheKey = k;
    decimalsCacheValue = 18;
    return decimalsCacheValue;
  }
  if (!ethers.isAddress(env.contractAddress)) {
    decimalsCacheKey = k;
    decimalsCacheValue = 18;
    return decimalsCacheValue;
  }
  try {
    const p = new ethers.JsonRpcProvider(env.rpcUrl);
    const c = new ethers.Contract(
      env.contractAddress,
      ['function decimals() view returns (uint8)'],
      p
    );
    decimalsCacheValue = Number(await c.decimals());
    decimalsCacheKey = k;
    return decimalsCacheValue;
  } catch (e) {
    logger.warn('decimals() read-only failed, using 18', { message: e.message });
    decimalsCacheKey = k;
    decimalsCacheValue = 18;
    return decimalsCacheValue;
  }
}

function platformAddress(privateKey) {
  if (!privateKey || !String(privateKey).trim()) {
    throw new Error('PRIVATE_KEY required to derive platform address');
  }
  return new ethers.Wallet(privateKey).address;
}

function wrapChainError(op, e) {
  const msg =
    e?.shortMessage ||
    e?.reason ||
    e?.message ||
    'Blockchain request failed';
  logger.error(`${op} failed`, { message: msg, code: e?.code });
  const err = new Error(`${op}: ${msg}`);
  err.status = 502;
  err.cause = e;
  return err;
}

async function mintTokens(env, toAddress, amountHuman) {
  bindEnv(env);
  try {
    if (!ethers.isAddress(toAddress)) {
      const err = new Error('Invalid recipient address');
      err.status = 400;
      throw err;
    }
    const dec = await getDecimals(env);
    const c = getContract(env.rpcUrl, env.privateKey, env.contractAddress);
    const amount = ethers.parseUnits(String(amountHuman), dec);
    const tx = await c.mint(toAddress, amount);
    logger.info('Mint tx submitted', { hash: tx.hash, to: toAddress });
    const receipt = await tx.wait();
    const txHash = receipt.hash || tx.hash;
    return { txHash, blockNumber: receipt.blockNumber };
  } catch (e) {
    if (e.status) throw e;
    throw wrapChainError('Mint', e);
  }
}

async function burnTokens(env, amountHuman) {
  bindEnv(env);
  try {
    const dec = await getDecimals(env);
    const c = getContract(env.rpcUrl, env.privateKey, env.contractAddress);
    const amount = ethers.parseUnits(String(amountHuman), dec);
    const tx = await c.burn(amount);
    logger.info('Burn tx submitted', { hash: tx.hash });
    const receipt = await tx.wait();
    const txHash = receipt.hash || tx.hash;
    return { txHash, blockNumber: receipt.blockNumber };
  } catch (e) {
    if (e.status) throw e;
    throw wrapChainError('Burn', e);
  }
}

async function transferTokens(env, toAddress, amountHuman) {
  bindEnv(env);
  try {
    if (!ethers.isAddress(toAddress)) {
      const err = new Error('Invalid recipient address');
      err.status = 400;
      throw err;
    }
    const dec = await getDecimals(env);
    const c = getContract(env.rpcUrl, env.privateKey, env.contractAddress);
    const amount = ethers.parseUnits(String(amountHuman), dec);
    const tx = await c.transfer(toAddress, amount);
    logger.info('Transfer tx submitted', { hash: tx.hash, to: toAddress });
    const receipt = await tx.wait();
    const txHash = receipt.hash || tx.hash;
    return { txHash, blockNumber: receipt.blockNumber };
  } catch (e) {
    if (e.status) throw e;
    throw wrapChainError('Transfer', e);
  }
}

async function getOnChainBalance(env, address) {
  if (!ethers.isAddress(address)) {
    const err = new Error('Invalid address');
    err.status = 400;
    throw err;
  }
  if (!env.rpcUrl?.trim() || !ethers.isAddress(env.contractAddress)) {
    const err = new Error('RPC_URL or CONTRACT_ADDRESS is not configured');
    err.status = 503;
    throw err;
  }
  const dec = await getDecimals(env);
  try {
    const p = new ethers.JsonRpcProvider(env.rpcUrl);
    const c = new ethers.Contract(
      env.contractAddress,
      ['function balanceOf(address account) view returns (uint256)'],
      p
    );
    const raw = await c.balanceOf(address);
    return ethers.formatUnits(raw, dec);
  } catch (e) {
    throw wrapChainError('balanceOf', e);
  }
}

/** Human-readable total supply (uses cached decimals when possible). */
async function getTotalSupplyHuman(env) {
  if (!env.rpcUrl?.trim() || !ethers.isAddress(env.contractAddress)) {
    const err = new Error('RPC_URL or CONTRACT_ADDRESS is not configured');
    err.status = 503;
    throw err;
  }
  const dec = await getDecimals(env);
  try {
    const p = new ethers.JsonRpcProvider(env.rpcUrl);
    const c = new ethers.Contract(
      env.contractAddress,
      ['function totalSupply() view returns (uint256)'],
      p
    );
    const raw = await c.totalSupply();
    return ethers.formatUnits(raw, dec);
  } catch (e) {
    throw wrapChainError('totalSupply', e);
  }
}

async function verifyDepositTx(env, txHash, expectedToAddress) {
  if (!env.rpcUrl?.trim()) {
    const err = new Error('RPC_URL is not configured');
    err.status = 503;
    throw err;
  }
  const p = new ethers.JsonRpcProvider(env.rpcUrl);
  let receipt;
  try {
    receipt = await p.getTransactionReceipt(txHash);
  } catch (e) {
    throw wrapChainError('getTransactionReceipt', e);
  }
  if (!receipt || receipt.status !== 1) {
    throw Object.assign(new Error('Invalid or failed transaction'), { status: 400 });
  }

  const iface = new ethers.Interface(ERC20_ABI);
  const contractAddr = env.contractAddress.toLowerCase();
  const toLower = expectedToAddress.toLowerCase();

  let found = null;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== contractAddr) continue;
    let parsed;
    try {
      parsed = iface.parseLog({ topics: log.topics, data: log.data });
    } catch {
      continue;
    }
    if (parsed?.name !== 'Transfer') continue;
    const to = String(parsed.args.to).toLowerCase();
    if (to !== toLower) continue;
    found = {
      from: String(parsed.args.from),
      to: String(parsed.args.to),
      value: parsed.args.value,
    };
    break;
  }

  if (!found) {
    throw Object.assign(new Error('No INRT transfer to deposit address in this tx'), { status: 400 });
  }

  const dec = await getDecimals(env);
  const amountHuman = ethers.formatUnits(found.value, dec);
  return { from: found.from, to: found.to, amountHuman, blockNumber: receipt.blockNumber };
}

module.exports = {
  getProvider,
  platformAddress,
  mintTokens,
  burnTokens,
  transferTokens,
  getOnChainBalance,
  getTotalSupplyHuman,
  verifyDepositTx,
  getDecimals,
  resetChainClients,
};
