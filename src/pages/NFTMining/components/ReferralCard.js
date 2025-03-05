import React from 'react';
import { ethers } from 'ethers';
import { Link } from 'react-router-dom';

const ReferralCard = ({ status, stats }) => {
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatEther = (value) => {
    try {
      return parseFloat(ethers.utils.formatEther(value || '0')).toFixed(4);
    } catch (error) {
      return '0.0000';
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-6 bg-[#1A2333] rounded-lg border border-green-500/20">
        <h3 className="text-xl font-bold text-green-400 mb-4">推荐关系</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-green-400/80">推荐人</span>
            <div>
              {status?.hasReferrer ? (
                <span className="text-green-400 font-mono">
                  {formatAddress(status.referrer)}
                </span>
              ) : (
                <Link
                  to="/ido"
                  className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                >
                  前往 IDO 页面设置推荐人
                </Link>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-green-400/80">直推收益</span>
            <span className="text-green-400">{formatEther(stats?.directRewards)} ZONE</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-green-400/80">团队收益</span>
            <span className="text-green-400">{formatEther(stats?.teamRewards)} ZONE</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-green-400/80">已邀请</span>
            <span className="text-green-400">{stats?.referralCount || 0} 人</span>
          </div>
        </div>

        {status?.error && (
          <p className="mt-4 text-red-500 text-sm">{status.error}</p>
        )}
      </div>
    </div>
  );
};

export default ReferralCard;
