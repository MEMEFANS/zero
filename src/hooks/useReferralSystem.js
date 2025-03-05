import { useCallback } from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import { REFERRAL_REGISTRY_ADDRESS } from '../constants/contracts';

const REFERRAL_REGISTRY_ABI = [
  "function getUserReferrer(address user) external view returns (address)",
  "function hasReferrer(address user) external view returns (bool)",
  "function getReferralCount(address user) view returns (uint256)",
  "function getDirectRewards(address user) view returns (uint256)",
  "function getTeamRewards(address user) view returns (uint256)",
  "function getInviteCode(address user) view returns (string)",
  "function hasInviteCode(address user) view returns (bool)",
  "function generateInviteCode() external returns (string)",
  "function registerInviteCode(string memory code) external"
];

export function useReferralSystem() {
  const { account, library } = useWeb3React();
  
  // 创建合约实例
  const getReferralContract = useCallback(() => {
    if (!library) return null;
    return new ethers.Contract(
      REFERRAL_REGISTRY_ADDRESS,
      REFERRAL_REGISTRY_ABI,
      library.getSigner()
    );
  }, [library]);

  // 获取推荐状态
  const getReferralStatus = useCallback(async () => {
    try {
      const contract = getReferralContract();
      if (!contract || !account) return null;

      const [hasReferrer, referrer] = await Promise.all([
        contract.hasReferrer(account),
        contract.getUserReferrer(account)
      ]);

      return { hasReferrer, referrer, error: null };
    } catch (error) {
      console.error('获取推荐状态失败:', error);
      return { hasReferrer: false, referrer: null, error: error.message };
    }
  }, [account, getReferralContract]);

  // 获取推荐统计
  const getReferralStats = useCallback(async () => {
    try {
      const contract = getReferralContract();
      if (!contract || !account) return null;

      const [referralCount, directRewards, teamRewards] = await Promise.all([
        contract.getReferralCount(account),
        contract.getDirectRewards(account),
        contract.getTeamRewards(account)
      ]);

      return {
        referralCount: referralCount.toNumber(),
        directRewards,
        teamRewards
      };
    } catch (error) {
      console.error('获取推荐统计失败:', error);
      return null;
    }
  }, [account, getReferralContract]);

  // 获取/生成邀请码
  const getInviteCode = useCallback(async () => {
    try {
      const contract = getReferralContract();
      if (!contract || !account) return null;

      // 检查是否已有邀请码
      const hasCode = await contract.hasInviteCode(account);
      
      let code;
      if (hasCode) {
        code = await contract.getInviteCode(account);
      } else {
        const tx = await contract.generateInviteCode();
        await tx.wait();
        code = await contract.getInviteCode(account);
      }

      return { code, error: null };
    } catch (error) {
      console.error('获取邀请码失败:', error);
      return { code: null, error: error.message };
    }
  }, [account, getReferralContract]);

  // 注册邀请码
  const registerInviteCode = useCallback(async (code) => {
    try {
      const contract = getReferralContract();
      if (!contract || !account) return { success: false, error: '未连接钱包' };

      const tx = await contract.registerInviteCode(code);
      await tx.wait();

      return { success: true, error: null };
    } catch (error) {
      console.error('注册邀请码失败:', error);
      return { success: false, error: error.message };
    }
  }, [account, getReferralContract]);

  return {
    getReferralStatus,
    getReferralStats,
    getInviteCode,
    registerInviteCode
  };
}
