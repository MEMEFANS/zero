import React from 'react';
import { useContext } from 'react';
import { LanguageContext } from '../../../App';

const StatCard = ({ title, value, suffix = '' }) => (
  <div className="bg-[#1A2333] p-6 rounded-lg border border-green-500/20">
    <h3 className="text-green-400/80 text-sm mb-2">{title}</h3>
    <div className="text-green-400 text-2xl font-bold">
      {value}
      {suffix && <span className="ml-2 text-green-400/80">{suffix}</span>}
    </div>
  </div>
);

const GlobalStats = ({ stats }) => {
  const { t } = useContext(LanguageContext);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <StatCard 
        title={t('minerCount')} 
        value={stats?.totalMiners || 0} 
      />
      <StatCard 
        title={t('todayOutput')} 
        value={stats?.todayOutput || '0'} 
        suffix="ZONE" 
      />
      <StatCard 
        title={t('totalOutput')} 
        value={stats?.totalOutput || '0'} 
        suffix="ZONE" 
      />
    </div>
  );
};

export default GlobalStats;
