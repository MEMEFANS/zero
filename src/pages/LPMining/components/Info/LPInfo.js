import React from 'react';

const LPInfo = ({ lpBalance, zonePerLp, usdtPerLp }) => {
  const lpValue = Number(lpBalance * usdtPerLp || 0).toFixed(2);

  return (
    <div className="relative group mt-3 sm:mt-4">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-green-300 rounded-lg opacity-20 group-hover:opacity-30 transition duration-500 blur"></div>
      <div className="relative bg-[#1A2438]/80 backdrop-blur-sm p-4 sm:p-6 rounded-lg border border-green-500/20">
        <h3 className="text-green-400 font-medium text-sm sm:text-base mb-3 sm:mb-4">LP代币说明</h3>
        <div className="space-y-2 text-gray-400 text-xs sm:text-sm">
          <p>• 1个ZONE-USDT LP代币 = 1份流动性份额</p>
          <p>• 当前1个LP代币包含:</p>
          <div className="ml-4">
            <p>- {Number(zonePerLp || 0).toFixed(4)} ZONE</p>
            <p>- {Number(usdtPerLp || 0).toFixed(4)} USDT</p>
          </div>
          <p>• 您的LP余额价值: {lpValue} USDT</p>
          <p className="text-xs mt-3 text-gray-500">
            提示: 在DEX农场质押LP代币即可获得ZONE代币奖励，具体收益见上方统计
          </p>
        </div>
      </div>
    </div>
  );
};

export default LPInfo;
