import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  ZONE_NFT_ADDRESS, 
  ZONE_NFT_ABI,
  NFT_MINING_ADDRESS,
  NFT_MINING_ABI,
  NFT_RARITY,
  REFERRAL_REGISTRY_ADDRESS,
  REFERRAL_REGISTRY_ABI
} from '../../../constants/contracts';

export const useNFTData = (account, library) => {
  const [nfts, setNfts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNFTs = async () => {
    if (!account || !library) return;

    try {
      setIsLoading(true);
      setError(null);

      const signer = library.getSigner();
      const nftContract = new ethers.Contract(ZONE_NFT_ADDRESS, ZONE_NFT_ABI, signer);
      const miningContract = new ethers.Contract(NFT_MINING_ADDRESS, NFT_MINING_ABI, signer);
      
      const balance = await nftContract.balanceOf(account);
      const nftList = [];

      for (let i = 0; i < balance; i++) {
        const tokenId = await nftContract.tokenOfOwnerByIndex(account, i);
        const type = await nftContract.getNFTType(tokenId);
        const power = await nftContract.getNFTPower(tokenId);
        const isStaked = await miningContract.isStaked(tokenId);
        
        let dailyReward = '0';
        let minedAmount = '0';
        let currentReward = '0';
        
        if (isStaked) {
          dailyReward = ethers.utils.formatEther(await miningContract.getDailyReward(tokenId));
          minedAmount = ethers.utils.formatEther(await miningContract.getMinedAmount(tokenId));
          currentReward = ethers.utils.formatEther(await miningContract.getCurrentReward(tokenId));
        }

        nftList.push({
          id: tokenId.toString(),
          type: type.toString(),
          power: power.toString(),
          isStaked,
          dailyReward,
          minedAmount,
          currentReward
        });
      }

      setNfts(nftList);
    } catch (error) {
      console.error('获取 NFT 列表失败:', error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 质押 NFT
  const stakeNFT = async (tokenId, referrerAddress = '') => {
    if (!account || !library) return false;

    try {
      const signer = library.getSigner();
      const nftContract = new ethers.Contract(ZONE_NFT_ADDRESS, ZONE_NFT_ABI, signer);
      const miningContract = new ethers.Contract(NFT_MINING_ADDRESS, NFT_MINING_ABI, signer);
      const referralContract = new ethers.Contract(REFERRAL_REGISTRY_ADDRESS, REFERRAL_REGISTRY_ABI, signer);
      
      // 检查是否已经授权
      const isApproved = await nftContract.isApprovedForAll(account, NFT_MINING_ADDRESS);
      if (!isApproved) {
        const approveTx = await nftContract.setApprovalForAll(NFT_MINING_ADDRESS, true);
        await approveTx.wait();
      }

      // 检查是否已经有推荐人
      const currentReferrer = await referralContract.getUserReferrer(account);
      
      // 如果提供了推荐人地址且还没有推荐人，则先绑定推荐人
      if (currentReferrer === ethers.constants.AddressZero && referrerAddress) {
        if (!ethers.utils.isAddress(referrerAddress)) {
          throw new Error('无效的推荐人地址');
        }

        if (referrerAddress.toLowerCase() === account.toLowerCase()) {
          throw new Error('不能将自己设为推荐人');
        }

        // 绑定推荐人
        const bindTx = await referralContract.bindReferrer(account, referrerAddress, {
          gasLimit: 300000
        });
        await bindTx.wait();
      }

      // 质押 NFT
      const stakeTx = await miningContract.stake(tokenId, {
        gasLimit: 500000
      });
      await stakeTx.wait();

      // 刷新数据
      await fetchNFTs();
      return true;
    } catch (error) {
      console.error('质押 NFT 失败:', error);
      throw error;
    }
  };

  const unstakeNFT = async (tokenId) => {
    if (!account || !library) return false;

    try {
      const signer = library.getSigner();
      const miningContract = new ethers.Contract(NFT_MINING_ADDRESS, NFT_MINING_ABI, signer);
      
      const tx = await miningContract.unstake(tokenId, {
        gasLimit: 300000
      });
      await tx.wait();

      await fetchNFTs();
      return true;
    } catch (error) {
      console.error('解除质押失败:', error);
      throw error;
    }
  };

  const claimReward = async (tokenId) => {
    if (!account || !library) return false;

    try {
      const signer = library.getSigner();
      const miningContract = new ethers.Contract(NFT_MINING_ADDRESS, NFT_MINING_ABI, signer);
      
      const tx = await miningContract.claimReward(tokenId, {
        gasLimit: 300000
      });
      await tx.wait();

      await fetchNFTs();
      return true;
    } catch (error) {
      console.error('领取奖励失败:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (account && library) {
      fetchNFTs();
    }
  }, [account, library]);

  return {
    nfts,
    isLoading,
    error,
    stakeNFT,
    unstakeNFT,
    claimReward,
    fetchNFTs
  };
};

export default useNFTData;
