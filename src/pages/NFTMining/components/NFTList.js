import React, { useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';
import { LanguageContext } from '../../../App';
import { 
  ZONE_NFT_ADDRESS, 
  ZONE_NFT_ABI,
  NFT_MINING_ADDRESS, 
  NFT_MINING_ABI, 
  REFERRAL_REGISTRY_ADDRESS, 
  REFERRAL_REGISTRY_ABI 
} from '../../../constants/contracts';
import { useReferralSystem } from '../../../hooks/useReferralSystem';
import { toast } from 'react-toastify';

// 添加延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 添加重试函数
const retryOperation = async (operation, maxRetries = 3, initialDelay = 1000) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (error.message.includes('rate limit') || error.code === 429) {
        // 如果是速率限制错误，增加等待时间
        const waitTime = initialDelay * Math.pow(2, i);
        await delay(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

function NFTList({ onNFTsLoaded }) {
  const { account, library } = useWeb3React();
  const [isLoading, setIsLoading] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState({
    nftToMining: false
  });
  const [nfts, setNfts] = useState([]);

  // 加载 NFT 列表
  const loadNFTs = async () => {
    if (!account || !library) return;

    try {
      setIsLoading(true);
      const signer = library.getSigner();
      const nftContract = new ethers.Contract(ZONE_NFT_ADDRESS, ZONE_NFT_ABI, signer);
      
      // 使用重试机制获取余额
      const balance = await retryOperation(() => nftContract.balanceOf(account));
      
      // 分批获取 NFT 数据，避免一次性请求过多
      const batchSize = 5;
      const nftList = [];
      
      for (let i = 0; i < balance.toNumber(); i += batchSize) {
        const batch = [];
        for (let j = 0; j < batchSize && i + j < balance.toNumber(); j++) {
          try {
            batch.push(
              retryOperation(async () => {
                const tokenId = await nftContract.tokenOfOwnerByIndex(account, i + j);
                const attributes = await nftContract.getNFTAttributes(tokenId);
                return {
                  tokenId,
                  ...attributes
                };
              })
            );
          } catch (error) {
            console.error('获取 NFT 失败:', error);
          }
        }
        
        // 等待当前批次完成
        const batchResults = await Promise.all(batch);
        nftList.push(...batchResults);
        
        // 在批次之间添加延迟
        if (i + batchSize < balance.toNumber()) {
          await delay(1000);
        }
      }
      
      setNfts(nftList);
      if (onNFTsLoaded) {
        onNFTsLoaded(nftList);
      }
    } catch (error) {
      console.error('加载 NFT 列表失败:', error);
      toast.error('加载 NFT 列表失败: ' + (error.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  // 处理质押
  const handleStake = async (tokenId) => {
    if (!account || !library) {
      toast.error('请先连接钱包');
      return;
    }

    try {
      setIsLoading(true);

      // 检查推荐关系
      const referralContract = new ethers.Contract(
        REFERRAL_REGISTRY_ADDRESS,
        REFERRAL_REGISTRY_ABI,
        library.getSigner()
      );

      console.log('Checking referral for account:', account);
      console.log('Using contract address:', REFERRAL_REGISTRY_ADDRESS);

      // 先检查是否有推荐人
      const hasReferrer = await retryOperation(() => referralContract.hasReferrer(account));
      console.log('Has referrer:', hasReferrer);

      if (!hasReferrer) {
        // 检查推荐人地址
        const referrer = await retryOperation(() => referralContract.getUserReferrer(account));
        console.log('Referrer address:', referrer);
        
        if (referrer === ethers.constants.AddressZero) {
          toast.error('请先前往 Mint 页面设置推荐关系');
          setIsLoading(false);
          return;
        }
      }

      // 执行质押
      const miningContract = new ethers.Contract(
        NFT_MINING_ADDRESS,
        NFT_MINING_ABI,
        library.getSigner()
      );

      const nftContract = new ethers.Contract(
        ZONE_NFT_ADDRESS,
        ZONE_NFT_ABI,
        library.getSigner()
      );

      console.log('开始质押 NFT:', {
        tokenId: tokenId.toString(),
        account,
        NFT_MINING_ADDRESS
      });

      // 使用重试机制执行质押，并手动设置 gas limit
      await retryOperation(async () => {
        console.log('开始质押 NFT:', {
          tokenId,
          NFT_MINING_ADDRESS
        });

        // 检查 NFT 所有者
        const owner = await nftContract.ownerOf(tokenId);
        console.log('NFT 所有者:', owner);
        if (owner.toLowerCase() !== account.toLowerCase()) {
          throw new Error('不是 NFT 所有者');
        }

        // 检查 STAKING_ROLE 权限
        const STAKING_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("STAKING_ROLE"));
        console.log('检查 STAKING_ROLE 权限:', {
          role: STAKING_ROLE,
          miningContract: NFT_MINING_ADDRESS
        });
        const hasRole = await nftContract.hasRole(STAKING_ROLE, NFT_MINING_ADDRESS);
        console.log('是否有 STAKING_ROLE:', hasRole);
        if (!hasRole) {
          throw new Error('挖矿合约需要 STAKING_ROLE 权限');
        }

        // 检查授权状态
        const isApproved = await nftContract.isApprovedForAll(account, NFT_MINING_ADDRESS);
        console.log('是否已授权:', isApproved);
        if (!isApproved) {
          console.log('执行授权...');
          const approveTx = await nftContract.setApprovalForAll(NFT_MINING_ADDRESS, true);
          await approveTx.wait();
          console.log('授权成功');
        }

        // 执行质押交易
        console.log('执行质押交易...', {
          tokenId,
          miningContract: NFT_MINING_ADDRESS,
          account
        });
        
        try {
          const tx = await miningContract.stakeNFT(ethers.BigNumber.from(tokenId), {
            gasLimit: 500000
          });
          console.log('质押交易已发送，hash:', tx.hash);
          await tx.wait();
          console.log('质押交易已确认');
        } catch (error) {
          console.error('质押失败:', error);
          throw error;
        }
      });

      toast.success('质押成功！');
      // 刷新数据
      await loadNFTs();
    } catch (error) {
      console.error('质押失败:', error);
      const errorMessage = error.data?.message || error.message || '未知错误';
      toast.error('质押失败: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理授权
  const handleApprove = async () => {
    if (!account || !library) {
      toast.error('请先连接钱包');
      return;
    }

    try {
      setIsLoading(true);
      const signer = library.getSigner();
      const nftContract = new ethers.Contract(ZONE_NFT_ADDRESS, ZONE_NFT_ABI, signer);

      // 执行授权
      const tx = await nftContract.setApprovalForAll(NFT_MINING_ADDRESS, true);
      await tx.wait();

      // 更新授权状态
      setApprovalStatus(prev => ({
        ...prev,
        nftToMining: true
      }));

      toast.success('授权成功！');
    } catch (error) {
      console.error('授权失败:', error);
      toast.error('授权失败: ' + (error.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  // 检查授权状态
  useEffect(() => {
    if (!account || !library) {
      console.log('No account or library available');
      return;
    }

    const checkApprovals = async () => {
      try {
        const signer = library.getSigner();
        const nftContract = new ethers.Contract(ZONE_NFT_ADDRESS, ZONE_NFT_ABI, signer);
        
        // 检查 NFT 到挖矿合约的授权
        const isApprovedForMining = await retryOperation(() => 
          nftContract.isApprovedForAll(account, NFT_MINING_ADDRESS)
        );
        
        setApprovalStatus(prev => ({
          ...prev,
          nftToMining: isApprovedForMining
        }));
      } catch (error) {
        console.error('检查授权状态失败:', error);
      }
    };

    checkApprovals();
  }, [account, library]);

  // 初始化加载
  useEffect(() => {
    if (account && library) {
      loadNFTs();
    }
  }, [account, library]);

  // 渲染 NFT 列表
  return (
    <div className="space-y-6">
      {/* 授权按钮 */}
      {!approvalStatus.nftToMining && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-green-400">授权状态</span>
            <button
              onClick={handleApprove}
              disabled={isLoading}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? '处理中...' : '授权'}
            </button>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            首次质押 NFT 需要先授权合约操作您的 NFT
          </p>
        </div>
      )}

      {/* NFT 列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nfts.map((nft, index) => (
          <div key={index} className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-bold text-green-400 mb-2">NFT #{nft.tokenId.toString()}</h3>
            <button
              onClick={() => handleStake(nft.tokenId)}
              disabled={isLoading || !approvalStatus.nftToMining}
              className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? '处理中...' : '质押'}
            </button>
          </div>
        ))}
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div className="text-center text-green-400">
          加载中...
        </div>
      )}

      {/* 空状态 */}
      {!isLoading && nfts.length === 0 && (
        <div className="text-center text-green-400">
          暂无 NFT
        </div>
      )}
    </div>
  );
}

export default NFTList;
