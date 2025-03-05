import React from 'react';
import { useContext } from 'react';
import { LanguageContext } from '../../../App';
import { MINING_LEVELS } from '../constants/miningLevels';

const StatusCard = ({ title, children }) => {
  return (
    <div className="relative group h-[240px]">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-green-300 rounded-lg opacity-20 group-hover:opacity-30 transition duration-500 blur"></div>
      <div className="relative bg-[#1A2438]/80 backdrop-blur-xl p-6 rounded-lg border border-green-500/20 h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-green-400">{title}</h3>
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
        </div>
        {children}
      </div>
    </div>
  );
};

export const NFTStatusCard = ({ stats = {}, nfts = [] }) => {
  const { t } = useContext(LanguageContext);
  
  return (
    <StatusCard title={t('nftStatus')}>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-green-300/80">{t('holdingCount')}</span>
          <span className="text-green-400 font-bold">{nfts.length}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-green-300/80">{t('totalPower')}</span>
          <span className="text-green-400 font-bold">{stats.totalPower || '0'} H/s</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-green-300/80">{t('miningLevel')}</span>
          <span className="text-green-400 font-bold">{stats.miningLevel || '0'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-green-300/80">{t('directBonus')}</span>
          <span className="text-green-400 font-bold">+{((MINING_LEVELS.find(l => l.name === stats.miningLevel)?.directBonus || 0) * 100).toFixed(0)}%</span>
        </div>
      </div>
    </StatusCard>
  );
};

export const RevenueStatsCard = ({ stats }) => {
  const { t } = useContext(LanguageContext);
  
  return (
    <StatusCard title={t('revenueStats')}>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-green-300/80">{t('currentRevenue')}</span>
          <span className="text-green-400 font-bold">{stats.currentRewards} ZONE</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-green-300/80">{t('dailyRevenue')}</span>
          <span className="text-green-400 font-bold">{stats.dailyRewards} ZONE</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-green-300/80">{t('maxRevenue')}</span>
          <span className="text-green-400 font-bold">{stats.maxRewards} ZONE</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-green-300/80">{t('estimatedAnnual')}</span>
          <span className="text-green-400 font-bold">{stats.annualRoi}%</span>
        </div>
      </div>
    </StatusCard>
  );
};

export const DirectStatusCard = ({ stats }) => {
  const { t } = useContext(LanguageContext);
  
  return (
    <StatusCard title={t('directStatus')}>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-green-300/80">{t('directCount')}</span>
          <span className="text-green-400 font-bold">{stats.directCount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-green-300/80">{t('directIncome')}</span>
          <span className="text-green-400 font-bold">{stats.directBonus} ZONE</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-green-300/80">{t('currentLevel')}</span>
          <span className="text-green-400 font-bold">{stats.miningLevel}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-green-300/80">{t('directIncrease')}</span>
          <span className="text-green-400 font-bold">+{(MINING_LEVELS.find(l => l.name === stats.miningLevel)?.directBonus * 100).toFixed(0)}%</span>
        </div>
      </div>
    </StatusCard>
  );
};
