const { EmbedBuilder } = require('discord.js');

const KNOWN_SCAM_DOMAINS = [
  'bit.ly', 'tinyurl.com', 't.me', 'discord.gift',
  'free-nitro.com', 'discord-airdrop.com', 'steam-wallet.com',
  'crypto-airdrop.com', 'elon-giveaway.com', 'mrbeast-giveaway.com',
  'claim-reward.com', 'verify-account.com', 'secure-login.xyz',
  'wallet-update.com', 'metamask-update.com', 'phantom-wallet.xyz',
];

const SUSPICIOUS_TLDS = ['.ru', '.cn', '.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.club', '.online', '.site', '.icu', '.buzz'];

const SHORTENER_DOMAINS = [
  'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 'is.gd',
  'buff.ly', 'adf.ly', 'bl.ink', 'lnkd.in', 'shorte.st',
];

const CRYPTO_KEYWORDS = [
  'wallet', 'metamask', 'phantom', 'trust wallet', 'coinbase',
  'binance', 'exchange', 'trade', 'deposit', 'withdraw',
  'seed phrase', 'private key', 'recovery phrase',
];

function extractUrls(content) {
  const urlRegex = /https?:\/\/[^\s]+/gi;
  return content.match(urlRegex) || [];
}

function getDomainFromUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isKnownScamDomain(url) {
  const domain = getDomainFromUrl(url);
  if (!domain) return false;
  return KNOWN_SCAM_DOMAINS.some(scam => domain.includes(scam));
}

function isShortenedUrl(url) {
  const domain = getDomainFromUrl(url);
  if (!domain) return false;
  return SHORTENER_DOMAINS.some(short => domain.includes(short));
}

function hasSuspiciousTld(url) {
  const domain = getDomainFromUrl(url);
  if (!domain) return false;
  return SUSPICIOUS_TLDS.some(tld => domain.endsWith(tld));
}

function containsCryptoKeywords(content) {
  const lower = content.toLowerCase();
  return CRYPTO_KEYWORDS.filter(kw => lower.includes(kw));
}

function analyzeUrl(url, content) {
  const issues = [];
  let riskScore = 0;

  if (isKnownScamDomain(url)) {
    issues.push('Known scam domain');
    riskScore += 50;
  }

  if (isShortenedUrl(url)) {
    issues.push('Shortened URL detected');
    riskScore += 20;
  }

  if (hasSuspiciousTld(url)) {
    issues.push('Suspicious TLD');
    riskScore += 30;
  }

  const cryptoKws = containsCryptoKeywords(content);
  if (cryptoKws.length > 0) {
    issues.push(`Crypto keywords: ${cryptoKws.join(', ')}`);
    riskScore += cryptoKws.length * 10;
  }

  const domain = getDomainFromUrl(url);
  if (domain && /\d{5,}/.test(domain)) {
    issues.push('Domain contains many numbers');
    riskScore += 15;
  }

  if (domain && domain.split('-').length > 3) {
    issues.push('Too many hyphens in domain');
    riskScore += 15;
  }

  return {
    url,
    domain,
    issues,
    riskScore,
    isSuspicious: riskScore >= 30,
    isHighRisk: riskScore >= 60,
  };
}

function checkMessage(content) {
  const urls = extractUrls(content);
  if (urls.length === 0) return { hasUrls: false, isSuspicious: false, results: [] };

  const results = urls.map(url => analyzeUrl(url, content));
  const suspiciousCount = results.filter(r => r.isSuspicious).length;
  const highRiskCount = results.filter(r => r.isHighRisk).length;

  return {
    hasUrls: true,
    urlCount: urls.length,
    isSuspicious: suspiciousCount > 0,
    isHighRisk: highRiskCount > 0,
    results,
    totalRiskScore: results.reduce((sum, r) => sum + r.riskScore, 0),
  };
}

function getScamDomainDescription() {
  return 'Known scam domains: ' + KNOWN_SCAM_DOMAINS.slice(0, 5).join(', ') + '...';
}

module.exports = {
  extractUrls,
  getDomainFromUrl,
  isKnownScamDomain,
  isShortenedUrl,
  hasSuspiciousTld,
  containsCryptoKeywords,
  analyzeUrl,
  checkMessage,
  getScamDomainDescription,
  KNOWN_SCAM_DOMAINS,
  SUSPICIOUS_TLDS,
  SHORTENER_DOMAINS,
};
