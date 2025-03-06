import React from 'react';

const StatCard = ({ title, value }) => (
  <div className="relative group">
    <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-green-300 rounded-lg opacity-20 group-hover:opacity-30 transition duration-500 blur"></div>
    <div className="relative bg-[#1A2438]/80 backdrop-blur-sm p-4 sm:p-6 rounded-lg border border-green-500/20">
      <div className="mb-4">
        <h3 className="text-gray-400 font-medium text-sm sm:text-base">{title}</h3>
      </div>
      <div className="text-xl sm:text-2xl font-bold text-green-400">{value}</div>
    </div>
  </div>
);

const MiningStats = ({ totalStaked, rewardPerDay, stakedAmount }) => {
  const powerRatio = totalStaked === '0' 
    ? '0.00'
    : ((Number(stakedAmount) / Number(totalStaked)) * 100).toFixed(2);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      <StatCard
        title="总质押ZONE-USDT LP"
        value={Number(totalStaked).toFixed(4)}
      />
      <StatCard
        title="每日产出"
        value={`${Number(rewardPerDay).toFixed(2)} ZONE`}
      />
      <StatCard
        title="我的算力占比"
        value={`${powerRatio}%`}
      />
    </div>
  );
};

export default MiningStats;
