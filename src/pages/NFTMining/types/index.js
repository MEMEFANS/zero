/**
 * @typedef {Object} NFT
 * @property {string} id - NFT ID
 * @property {string} type - NFT type (N, R, SR, SSR)
 * @property {string} power - Mining power
 * @property {string} dailyReward - Daily reward amount
 * @property {string} maxReward - Maximum reward amount
 * @property {string} minedAmount - Total mined amount
 * @property {string} currentReward - Current pending reward
 * @property {boolean} isStaked - Whether the NFT is staked
 */

/**
 * @typedef {Object} MiningStats
 * @property {string} totalPower - Total mining power
 * @property {string} personalPower - Personal mining power
 * @property {string} currentRewards - Current pending rewards
 * @property {string} dailyRewards - Daily rewards
 * @property {string} miningLevel - Mining level
 * @property {number} directCount - Direct referral count
 * @property {string} directBonus - Direct referral bonus
 * @property {string} maxRewards - Maximum rewards
 * @property {string} annualRoi - Annual ROI
 * @property {string} inviteCode - Invite code
 * @property {number} totalMiners - Total miners count
 * @property {string} todayOutput - Today's total output
 * @property {string} totalOutput - All-time total output
 */

export const NFT_TYPES = {
  N: 'N',
  R: 'R',
  SR: 'SR',
  SSR: 'SSR'
};

export const MINING_LEVEL_TYPES = {
  LV1: 'LV1',
  LV2: 'LV2',
  LV3: 'LV3',
  LV4: 'LV4',
  LV5: 'LV5'
};
