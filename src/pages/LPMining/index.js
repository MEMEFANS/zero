import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { injected } from '../../utils/connectors';
import Background from '../../components/Layout/Background';
import MiningStats from './components/Stats/MiningStats';
import LPInfo from './components/Info/LPInfo';
import StakeActions from './components/Actions/StakeActions';
import useLPMining from './hooks/useLPMining';

const LPMining = () => {
  const { active, activate } = useWeb3React();
  const { miningInfo, isSubmitting, handleStake, handleUnstake, handleClaim } = useLPMining();

  // 连接钱包
  const connectWallet = async () => {
    try {
      await activate(injected);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  return (
    <Background>
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {!active ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <h1 className="text-2xl sm:text-3xl font-bold text-green-400 mb-6 sm:mb-8">ZONE-USDT LP挖矿</h1>
            <div className="max-w-2xl text-center mb-8">
              <p className="text-gray-400 text-sm sm:text-base mb-2">
                质押您的ZONE-USDT LP代币参与挖矿，赚取ZONE代币奖励
              </p>
              <p className="text-gray-500 text-xs sm:text-sm">
                LP代币是在DEX上提供ZONE-USDT交易对流动性时获得的凭证，质押LP代币即可获得挖矿收益
              </p>
            </div>
            <button
              onClick={connectWallet}
              className="px-6 py-3 bg-green-500/20 text-green-400 rounded-lg font-medium hover:bg-green-500/30 transition-colors"
            >
              连接钱包
            </button>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-green-400 mb-4 sm:mb-6">ZONE-USDT LP挖矿</h1>
            <div className="max-w-2xl mb-6">
              <p className="text-gray-400 text-sm sm:text-base mb-2">
                质押您的ZONE-USDT LP代币参与挖矿，赚取ZONE代币奖励
              </p>
              <p className="text-gray-500 text-xs sm:text-sm">
                LP代币是在DEX上提供ZONE-USDT交易对流动性时获得的凭证，质押LP代币即可获得挖矿收益
              </p>
            </div>
            
            {/* 挖矿统计 */}
            <MiningStats
              totalStaked={miningInfo.totalStaked}
              rewardPerDay={miningInfo.rewardPerDay}
              stakedAmount={miningInfo.stakedAmount}
            />

            {/* LP信息说明 */}
            <LPInfo
              lpBalance={miningInfo.lpBalance}
              zonePerLp={miningInfo.zonePerLp}
              usdtPerLp={miningInfo.usdtPerLp}
            />

            {/* 质押操作 */}
            <StakeActions
              miningInfo={miningInfo}
              onStake={handleStake}
              onUnstake={handleUnstake}
              onClaim={handleClaim}
              isSubmitting={isSubmitting}
            />
          </div>
        )}
      </div>
    </Background>
  );
};

export default LPMining;
