import React from 'react';
import { CpuChipIcon, UsersIcon } from '@heroicons/react/24/outline';

const StatCard = ({ title, value, icon }) => (
  <div className="bg-[#1A2438]/80 backdrop-blur-sm p-6 rounded-lg border border-green-500/20">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-2xl font-bold text-green-400 mt-1">{value}</p>
      </div>
      <div className="text-green-400">
        {icon}
      </div>
    </div>
  </div>
);

const GlobalStats = ({ totalStakedPower, totalMiners }) => {
  return (
    <div className="bg-[#1A2438]/80 backdrop-blur-sm p-6 rounded-lg border border-green-500/20">
      <h2 className="text-2xl font-bold text-green-400 mb-6">全局统计</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="总质押算力"
          value={`${totalStakedPower} H/s`}
          icon={<CpuChipIcon className="w-8 h-8" />}
        />
        <StatCard
          title="总矿工数量"
          value={totalMiners}
          icon={<UsersIcon className="w-8 h-8" />}
        />
      </div>
    </div>
  );
};

export default GlobalStats;
