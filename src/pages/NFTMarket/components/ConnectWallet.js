import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { injected } from '../../../utils/connectors';
import { toast } from 'react-toastify';

export const ConnectWallet = () => {
  const { activate } = useWeb3React();

  const handleConnect = async () => {
    try {
      await activate(injected);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('连接钱包失败，请重试');
    }
  };

  return (
    <div className="text-center">
      <button
        onClick={handleConnect}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        连接钱包
      </button>
    </div>
  );
};
