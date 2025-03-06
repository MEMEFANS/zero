import React from 'react';
import { CurrencyDollarIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const StatCard = ({ title, value, icon, subValue }) => (
  <div className="bg-[#1A2438]/80 backdrop-blur-sm p-6 rounded-lg border border-green-500/20">
    <div className="flex items-center justify-between mb-2">
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-2xl font-bold text-green-400 mt-1">{value} ZONE</p>
      </div>
      <div className="text-green-400">
        {icon}
      </div>
    </div>
    {subValue && (
      <div className="text-sm text-gray-400">
        {subValue}
      </div>
    )}
  </div>
);

const OutputStats = ({ todayOutput, totalOutput }) => {
  // 格式化数字，添加千位分隔符
  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(number);
  };

  return (
    <div className="bg-[#1A2438]/80 backdrop-blur-sm p-6 rounded-lg border border-green-500/20">
      <h2 className="text-2xl font-bold text-green-400 mb-6">产出统计</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="今日产出"
          value={formatNumber(todayOutput / 1e18)}
          icon={<CurrencyDollarIcon className="w-8 h-8" />}
        />
        <StatCard
          title="总产出"
          value={formatNumber(totalOutput / 1e18)}
          icon={<ChartBarIcon className="w-8 h-8" />}
        />
      </div>
    </div>
  );
};

export default OutputStats;
