import React, { useState, useEffect } from 'react';
import { ChartBarIcon, UsersIcon, ArrowUpIcon } from '@heroicons/react/24/outline';

const LevelCard = ({ level, minPower, maxPower, bonusRate, teamRequired, teamBonusRate, isCurrentLevel }) => (
  <div className={`bg-[#1A2438]/80 backdrop-blur-sm p-6 rounded-lg border ${isCurrentLevel ? 'border-green-500' : 'border-green-500/20'}`}>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-xl font-bold text-green-400">等级 {level}</h3>
      {isCurrentLevel && (
        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
          当前等级
        </span>
      )}
    </div>
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-gray-400">算力要求</span>
        <span className="text-white">{minPower} - {maxPower} H/s</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-400">基础奖励</span>
        <span className="text-white">+{bonusRate}%</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-400">团队要求</span>
        <span className="text-white">{teamRequired} 人</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-400">团队加成</span>
        <span className="text-white">+{teamBonusRate}%</span>
      </div>
    </div>
  </div>
);

const ProgressBar = ({ current, target }) => {
  const progress = Math.min((current / target) * 100, 100);
  return (
    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
      <div 
        className="h-full bg-green-500 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

const LevelSystem = ({ currentLevel, currentPower, levelConfigs = [] }) => {
  const [nextLevel, setNextLevel] = useState(null);

  useEffect(() => {
    // 找到下一个等级的配置
    const next = levelConfigs.find(config => config.level > currentLevel);
    setNextLevel(next);
  }, [currentLevel, levelConfigs]);

  return (
    <div className="bg-[#1A2438]/80 backdrop-blur-sm p-6 rounded-lg border border-green-500/20">
      <h2 className="text-2xl font-bold text-green-400 mb-6">等级系统</h2>
      
      {/* 当前等级和进度 */}
      {nextLevel && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">当前等级进度</span>
            <span className="text-white">{currentPower} / {nextLevel.minPower} H/s</span>
          </div>
          <ProgressBar current={currentPower} target={nextLevel.minPower} />
          <div className="mt-2 text-sm text-gray-400">
            距离 等级{nextLevel.level} 还需要 {Math.max(nextLevel.minPower - currentPower, 0)} H/s
          </div>
        </div>
      )}

      {/* 等级列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {levelConfigs.map((config) => (
          <LevelCard
            key={config.level}
            level={config.level}
            minPower={config.minPower}
            maxPower={config.maxPower}
            bonusRate={config.bonusRate}
            teamRequired={config.teamRequired}
            teamBonusRate={config.teamBonusRate}
            isCurrentLevel={config.level === currentLevel}
          />
        ))}
      </div>
    </div>
  );
};

export default LevelSystem;
