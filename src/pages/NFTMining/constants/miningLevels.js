export const NFT_LEVELS = {
  N: { power: 100, daily: 2.8, maxReward: 252, roi: 35.7, annual: 152, rate: 55, price: 100 },
  R: { power: 400, daily: 10, maxReward: 900, roi: 11.1, annual: 800, rate: 15, price: 100 },
  SR: { power: 1600, daily: 40, maxReward: 3600, roi: 2.8, annual: 3500, rate: 5, price: 100 },
  SSR: { power: 6400, daily: 160, maxReward: 14400, roi: 0.7, annual: 14300, rate: 1, price: 100 }
};

export const MINING_LEVELS = [
  { name: 'LV1', min: 0, max: 10000, directBonus: 0.05 },
  { name: 'LV2', min: 10001, max: 30000, directBonus: 0.08 },
  { name: 'LV3', min: 30001, max: 100000, directBonus: 0.12 },
  { name: 'LV4', min: 100001, max: 500000, directBonus: 0.18 },
  { name: 'LV5', min: 500001, max: Infinity, directBonus: 0.25 }
];
