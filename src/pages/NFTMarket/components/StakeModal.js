import React from 'react';
import { formatPower, formatZONE } from '../utils/formatters';

export const StakeModal = ({ nft, onClose, onConfirm }) => {
  if (!nft) return null;

  const handleStake = () => {
    onConfirm(nft);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#1A2438] rounded-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-white">质押 NFT</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-black/20 p-4 rounded-lg">
              <div className="text-gray-400 mb-1">算力</div>
              <div className="text-xl font-bold text-white">
                {formatPower(nft.power)} H/s
              </div>
            </div>
            <div className="bg-black/20 p-4 rounded-lg">
              <div className="text-gray-400 mb-1">每日收益</div>
              <div className="text-xl font-bold text-white">
                {formatZONE(nft.dailyReward)} ZONE
              </div>
            </div>
            <div className="bg-black/20 p-4 rounded-lg">
              <div className="text-gray-400 mb-1">最大收益</div>
              <div className="text-xl font-bold text-white">
                {formatZONE(nft.maxReward)} ZONE
              </div>
            </div>

            <button
              onClick={handleStake}
              className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              确认质押
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
