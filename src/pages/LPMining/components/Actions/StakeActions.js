import React, { useState } from 'react';

const ActionCard = ({ title, balance, amount, setAmount, onSubmit, submitText, isSubmitting }) => (
  <div className="relative group">
    <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-green-300 rounded-lg opacity-20 group-hover:opacity-30 transition duration-500 blur"></div>
    <div className="relative bg-[#1A2438]/80 backdrop-blur-sm p-4 sm:p-6 rounded-lg border border-green-500/20">
      <div className="mb-4">
        <h3 className="text-gray-400 font-medium text-sm sm:text-base">{title}</h3>
        <p className="text-xl sm:text-2xl font-bold text-green-400 mt-2">{Number(balance).toFixed(4)}</p>
      </div>
      
      <div className="flex space-x-2 mb-4">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="输入数量"
          className="flex-1 bg-[#111827] text-white px-3 sm:px-4 py-2 rounded text-sm border border-green-500/20 focus:border-green-500/50 focus:outline-none"
        />
        <button
          onClick={() => setAmount(balance)}
          className="px-3 sm:px-4 py-2 bg-[#111827] text-green-400 rounded text-sm border border-green-500/20 hover:bg-green-500/20 transition-colors"
        >
          最大
        </button>
      </div>

      <button
        onClick={onSubmit}
        disabled={isSubmitting || !amount || Number(amount) <= 0 || Number(amount) > Number(balance)}
        className={`w-full py-2 rounded text-sm font-medium ${
          isSubmitting || !amount || Number(amount) <= 0 || Number(amount) > Number(balance)
            ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors'
        }`}
      >
        {isSubmitting ? '处理中...' : submitText}
      </button>
    </div>
  </div>
);

const StakeActions = ({ miningInfo, onStake, onUnstake, onClaim, isSubmitting }) => {
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');

  const handleStake = async () => {
    if (await onStake(stakeAmount)) {
      setStakeAmount('');
    }
  };

  const handleUnstake = async () => {
    if (await onUnstake(unstakeAmount)) {
      setUnstakeAmount('');
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
      <div>
        <ActionCard
          title="可质押LP余额"
          balance={miningInfo.lpBalance}
          amount={stakeAmount}
          setAmount={setStakeAmount}
          onSubmit={handleStake}
          submitText="质押"
          isSubmitting={isSubmitting}
        />
      </div>

      <div className="space-y-3 sm:space-y-4">
        <ActionCard
          title="已质押LP余额"
          balance={miningInfo.stakedAmount}
          amount={unstakeAmount}
          setAmount={setUnstakeAmount}
          onSubmit={handleUnstake}
          submitText="解除质押"
          isSubmitting={isSubmitting}
        />

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-green-300 rounded-lg opacity-20 group-hover:opacity-30 transition duration-500 blur"></div>
          <div className="relative bg-[#1A2438]/80 backdrop-blur-sm p-4 sm:p-6 rounded-lg border border-green-500/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <h3 className="text-gray-400 font-medium text-sm sm:text-base">可领取收益</h3>
                <p className="text-xl sm:text-2xl font-bold text-green-400 mt-2">
                  {Number(miningInfo.pendingRewards).toFixed(4)} ZONE
                </p>
              </div>
              <button
                onClick={onClaim}
                disabled={isSubmitting || Number(miningInfo.pendingRewards) <= 0}
                className={`w-full sm:w-auto px-6 sm:px-8 py-2 rounded text-sm font-medium ${
                  isSubmitting || Number(miningInfo.pendingRewards) <= 0
                    ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors'
                }`}
              >
                {isSubmitting ? '处理中...' : '领取'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StakeActions;
