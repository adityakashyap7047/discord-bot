const SCAM_PATTERNS = {
  cryptoScam: [
    /send\s+(\d+[\d,]*)\s*(usdt|btc|eth|trc20|erc20|crypto)/gi,
    /withdrawal\s+success(ful)?/gi,
    /your\s+withdrawal\s+of\s+[\d,]+\s*(usdt|btc|eth)/gi,
    /send\s+(to|to\s+this)\s+(wallet|address|account)/gi,
    /trc20\s+(address|wallet)/gi,
    /erc20\s+(address|wallet)/gi,
    /0x[a-fA-F0-9]{40}/g,
    /T[a-zA-Z0-9]{33}/g,
    /invest\s+\$?\d+.*get\s+\$?\d+/gi,
    /double\s+your\s+(crypto|money|btc|eth)/gi,
    /free\s+(crypto|btc|eth|usdt)/gi,
    /claim\s+your\s+(reward|prize|bonus)/gi,
    /limited\s+time\s+offer.*crypto/gi,
    /send.*receive.*double/gi,
  ],
  celebrityImpersonation: [
    /mr\s*beast/i,
    /elon\s*musk/i,
    /vitalik/i,
    /cz\s*(binance)?/i,
    /send.*to.*wallet.*receive.*back/gi,
    /first\s+\d+\d*\s+people/gi,
    /airdrop/gi,
  ],
  urgencyPatterns: [
    /act\s+now/gi,
    /limited\s+time/gi,
    /last\s+chance/gi,
    /hurry/gi,
    /don'?t\s+miss/gi,
    /only\s+\d+\s+(left|remaining|spots)/gi,
  ],
  suspiciousLinks: [
    /bit\.ly/gi,
    /tinyurl\.com/gi,
    /t\.me/gi,
    /discord\.gg\/[a-zA-Z0-9]+/gi,
    /\.(ru|cn|tk|ml|ga|cf)\//gi,
  ],
  imageIndicators: [
    /withdrawal\s+success/gi,
    /transaction\s+completed/gi,
    /payment\s+received/gi,
    /balance\s+updated/gi,
  ],
};

const SCAM_KEYWORDS = [
  'usdt', 'trc20', 'erc20', 'airdrop', 'crypto giveaway',
  'send to address', 'wallet address', 'withdrawal success',
  'double your', 'free crypto', 'claim reward', 'claim bonus',
  'invest now', 'limited offer', 'mr beast', 'elon musk',
  'act now', 'hurry', 'last chance', 'don\'t miss',
  'first 100', 'first 500', 'first 1000',
];

function detectScam(content) {
  const detections = [];
  const lowerContent = content.toLowerCase();

  for (const [category, patterns] of Object.entries(SCAM_PATTERNS)) {
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        detections.push({
          category,
          pattern: pattern.source,
          match: match[0],
        });
      }
    }
  }

  for (const keyword of SCAM_KEYWORDS) {
    if (lowerContent.includes(keyword.toLowerCase())) {
      const existing = detections.find(d => d.match.toLowerCase().includes(keyword.toLowerCase()));
      if (!existing) {
        detections.push({
          category: 'keyword',
          pattern: keyword,
          match: keyword,
        });
      }
    }
  }

  return {
    isScam: detections.length >= 2,
    confidence: Math.min(detections.length * 20, 100),
    detections,
    categories: [...new Set(detections.map(d => d.category))],
  };
}

function getScamDescription(categories) {
  const descriptions = {
    cryptoScam: 'Cryptocurrency scam pattern detected',
    celebrityImpersonation: 'Celebrity impersonation scam',
    urgencyPatterns: 'Urgency/pressure tactics detected',
    suspiciousLinks: 'Suspicious links detected',
    imageIndicators: 'Scam image content detected',
    keyword: 'Scam keyword detected',
  };
  return categories.map(c => descriptions[c] || c).join(', ');
}

module.exports = { detectScam, getScamDescription, SCAM_PATTERNS, SCAM_KEYWORDS };
