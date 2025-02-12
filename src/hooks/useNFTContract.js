import { useEffect, useState, useCallback } from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import { 
  MYSTERY_BOX_ADDRESS, 
  MYSTERY_BOX_ABI,
  ZONE_TOKEN_ADDRESS,
  ZONE_TOKEN_ABI,
  STAKING_ADDRESS,
  STAKING_ABI
} from '../constants/contracts';

export const useNFTContract = () => {
  const { active, library, account } = useWeb3React();
  const [contracts, setContracts] = useState({
    nft: null,
    token: null,
    staking: null
  });

  useEffect(() => {
    if (active && library) {
      const nftContract = new ethers.Contract(
        MYSTERY_BOX_ADDRESS,
        MYSTERY_BOX_ABI,
        library.getSigner()
      );

      const tokenContract = new ethers.Contract(
        ZONE_TOKEN_ADDRESS,
        ZONE_TOKEN_ABI,
        library.getSigner()
      );

      const stakingContract = new ethers.Contract(
        STAKING_ADDRESS,
        STAKING_ABI,
        library.getSigner()
      );

      setContracts({
        nft: nftContract,
        token: tokenContract,
        staking: stakingContract
      });
    }
  }, [active, library]);

  const getOwnedNFTs = useCallback(async () => {
    if (!contracts.nft || !account) return [];
    try {
      const tokenIds = await contracts.nft.getOwnedNFTs(account);
      const nfts = await Promise.all(
        tokenIds.map(async (id) => {
          const attributes = await contracts.nft.getNFTAttributes(id);
          return {
            tokenId: id.toNumber(),
            attributes: {
              rarity: attributes.rarity,
              power: attributes.power.toNumber(),
              dailyReward: attributes.dailyReward.toNumber(),
              maxReward: attributes.maxReward.toNumber(),
              minedAmount: attributes.minedAmount.toNumber(),
              isStaked: attributes.isStaked,
              stakeTime: attributes.stakeTime.toNumber()
            }
          };
        })
      );
      return nfts;
    } catch (error) {
      console.error('Failed to get owned NFTs:', error);
      return [];
    }
  }, [contracts.nft, account]);

  const listNFT = useCallback(async (tokenId, price) => {
    if (!contracts.nft) return;
    try {
      const tx = await contracts.nft.listNFT(tokenId, ethers.utils.parseEther(price.toString()));
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Failed to list NFT:', error);
      return false;
    }
  }, [contracts.nft]);

  const buyNFT = useCallback(async (tokenId, price) => {
    if (!contracts.nft) return;
    try {
      const tx = await contracts.nft.buyNFT(tokenId, {
        value: ethers.utils.parseEther(price.toString())
      });
      await tx.wait();
      return true;
    } catch (error) {
      console.error('Failed to buy NFT:', error);
      return false;
    }
  }, [contracts.nft]);

  return {
    contracts,
    getOwnedNFTs,
    listNFT,
    buyNFT
  };
};

export default useNFTContract;
