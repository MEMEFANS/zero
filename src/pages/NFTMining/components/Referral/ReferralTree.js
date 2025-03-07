import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';
import { REFERRAL_REGISTRY_ADDRESS, REFERRAL_REGISTRY_ABI } from '../../../../constants/contracts';

// 确认对话框组件
const ConfirmDialog = ({ isOpen, onConfirm, onCancel, referrerAddress }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
      <div className="relative bg-[#1A2438] rounded-lg p-6 max-w-md w-full mx-4 border border-green-500/20">
        <h3 className="text-xl font-medium text-green-400 mb-4">绑定推荐人</h3>
        <div className="mb-6">
          <p className="text-gray-300 mb-2">检测到推荐人地址：</p>
          <div className="bg-[#111827] rounded p-3 text-sm text-gray-400 break-all font-mono">
            {referrerAddress}
          </div>
          <p className="text-gray-400 mt-4 text-sm">
            确认将其设置为您的推荐人吗？此操作不可撤销。
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-400 hover:text-gray-300 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
          >
            确认绑定
          </button>
        </div>
      </div>
    </div>
  );
};

const ReferralTree = ({ account, provider }) => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingReferrer, setPendingReferrer] = useState(null);

  const init = async () => {
    console.log('Initializing ReferralTree with account:', account);
    if (!account || !provider) {
      console.log('Missing account or provider');
      setLoading(false);
      return;
    }

    try {
      // 先检查合约地址是否存在
      const code = await provider.getCode(REFERRAL_REGISTRY_ADDRESS);
      console.log('Contract code length:', code.length);
      if (code === '0x' || code === '0x0') {
        throw new Error('Contract not deployed at address: ' + REFERRAL_REGISTRY_ADDRESS);
      }

      console.log('Creating contract instance...');
      const contract = new ethers.Contract(REFERRAL_REGISTRY_ADDRESS, REFERRAL_REGISTRY_ABI, provider);
      console.log('Contract instance created');
      
      try {
        // 1. 检查是否有推荐人
        console.log('Checking hasReferrer...');
        const hasReferrer = await contract.hasReferrer(account);
        console.log('Has referrer:', hasReferrer);
        
        // 2. 获取推荐人
        let referrer = null;
        if (hasReferrer) {
          console.log('Getting referrer...');
          referrer = await contract.getUserReferrer(account);
          console.log('Referrer:', referrer);
        }

        // 3. 获取推荐统计数据，如果失败则默认为0
        let referralCount = 0;
        let teamMembers = [];
        let directReferrals = [];
        let directRewards = ethers.BigNumber.from(0);
        let teamRewards = ethers.BigNumber.from(0);

        try {
          referralCount = await contract.getReferralCount(account);
        } catch (e) {
          console.log('No referrals yet');
        }

        try {
          teamMembers = await contract.getTeamMembers(account);
        } catch (e) {
          console.log('No team members yet');
        }

        try {
          if (referralCount > 0) {
            directReferrals = await contract.getDirectReferrals(account);
          }
        } catch (e) {
          console.log('Failed to get direct referrals');
        }

        try {
          directRewards = await contract.getDirectRewards(account);
        } catch (e) {
          console.log('No direct rewards yet');
        }

        try {
          teamRewards = await contract.getTeamRewards(account);
        } catch (e) {
          console.log('No team rewards yet');
        }

        setStats({
          directCount: Number(referralCount || 0),
          teamCount: teamMembers.length,
          hasReferrer,
          referrer: hasReferrer ? referrer : null,
          directReferrals,
          teamMembers,
          directRewards: directRewards || ethers.BigNumber.from(0),
          teamRewards: teamRewards || ethers.BigNumber.from(0)
        });

        setError(null);
      } catch (err) {
        console.error('Error initializing referral tree:', err);
        setError('加载推荐系统数据失败');
      }
    } catch (err) {
      console.error('Error initializing referral tree:', err);
      if (err.message.includes('Contract not deployed')) {
        setError('推荐系统合约未部署，请联系管理员');
      } else if (err.code === 'CALL_EXCEPTION') {
        setError('无法读取推荐关系数据，请确认合约地址是否正确');
      } else {
        setError(`加载推荐系统失败: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    init();
  }, [account, provider]);

  // 检查并自动绑定推荐人
  useEffect(() => {
    const checkAndBindReferrer = async () => {
      const urlReferrer = searchParams.get('referrer');
      console.log('检查推荐人状态:', {
        account,
        provider,
        urlReferrer,
        isConnected: !!account && !!provider
      });

      if (!account || !provider || !urlReferrer || isSubmitting) {
        console.log('条件不满足，退出检查');
        return;
      }

      try {
        const contract = new ethers.Contract(
          REFERRAL_REGISTRY_ADDRESS,
          REFERRAL_REGISTRY_ABI,
          provider
        );

        // 检查是否已经有推荐人
        const hasReferrer = await contract.hasReferrer(account);
        console.log('是否已有推荐人:', hasReferrer);
        
        if (!hasReferrer && 
            urlReferrer && 
            ethers.utils.isAddress(urlReferrer) &&
            urlReferrer.toLowerCase() !== account.toLowerCase()) {
          
          console.log('符合绑定条件，准备显示确认框');
          setPendingReferrer(urlReferrer);
          setShowConfirmDialog(true);
        } else {
          console.log('不符合绑定条件:', {
            hasReferrer,
            isValidAddress: ethers.utils.isAddress(urlReferrer),
            isSelfReferral: urlReferrer?.toLowerCase() === account?.toLowerCase()
          });
        }
      } catch (error) {
        console.error('检查推荐人失败:', error);
      }
    };

    if (account && provider) {
      checkAndBindReferrer();
    }
  }, [account, provider, searchParams]);

  const handleConfirmBind = async () => {
    if (!pendingReferrer) return;
    
    setShowConfirmDialog(false);
    setIsSubmitting(true);
    toast.loading('正在绑定推荐人...');
    
    try {
      console.log('开始绑定推荐人...');
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        REFERRAL_REGISTRY_ADDRESS,
        REFERRAL_REGISTRY_ABI,
        signer
      );
      const tx = await contract.bindReferrer(pendingReferrer, {
        gasLimit: 300000
      });
      console.log('交易已发送:', tx.hash);
      await tx.wait();
      console.log('交易已确认');
      toast.success('推荐人绑定成功！');
      // 重新加载数据
      init();
    } catch (error) {
      console.error('绑定推荐人失败:', error);
      toast.error('绑定推荐人失败: ' + (error.message || '未知错误'));
    } finally {
      setIsSubmitting(false);
      setPendingReferrer(null);
    }
  };

  const bindReferrer = async (referrerAddress) => {
    if (!account || !provider) return;
    try {
      setIsSubmitting(true);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(REFERRAL_REGISTRY_ADDRESS, REFERRAL_REGISTRY_ABI, signer);
      const tx = await contract.bindReferrer(referrerAddress, {
        gasLimit: 300000
      });
      await tx.wait();
      toast.success('推荐人绑定成功！');
      // 重新加载数据
      init();
    } catch (err) {
      console.error('Error binding referrer:', err);
      toast.error('绑定推荐人失败: ' + (err.message || '未知错误'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      // 尝试使用现代 Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        toast.success('链接已复制到剪贴板', {
          position: 'top-right',
          autoClose: 2000,
        });
        return;
      }

      // 后备方案：使用 document.execCommand
      const textArea = document.createElement('textarea');
      textArea.value = text;
      // 防止在iOS上出现缩放
      textArea.style.fontSize = '12pt';
      // 移出视口外
      textArea.style.position = 'fixed';
      textArea.style.top = '-9999px';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      
      // 在iOS上需要取消选择限制
      textArea.contentEditable = true;
      textArea.readOnly = false;
      
      // 选择文本
      textArea.select();
      textArea.setSelectionRange(0, 99999); // 适用于iOS
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        toast.success('链接已复制到剪贴板', {
          position: 'top-right',
          autoClose: 2000,
        });
      } else {
        throw new Error('复制失败');
      }
    } catch (err) {
      console.error('复制失败:', err);
      // 如果都失败了，提示用户手动复制
      toast.error('复制失败，请长按链接手动复制', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400">
        {error}
      </div>
    );
  }

  if (!account || !provider) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        请先连接钱包
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const referralLink = `${window.location.origin}${window.location.pathname}?referrer=${account}`;

  return (
    <div className="space-y-6">
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onConfirm={handleConfirmBind}
        onCancel={() => {
          setShowConfirmDialog(false);
          setPendingReferrer(null);
        }}
        referrerAddress={pendingReferrer}
      />
      
      {/* 推荐链接 */}
      <div className="bg-[#1A2438]/50 backdrop-blur-sm rounded-lg p-4 border border-green-500/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 w-full">
            <p className="text-gray-400 text-sm mb-2">您的推荐链接:</p>
            <div className="bg-[#1A2438] rounded px-3 py-2 text-xs sm:text-sm text-gray-300 break-all">
              {referralLink}
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(referralLink)}
            className="px-4 py-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors text-sm whitespace-nowrap"
          >
            复制链接
          </button>
        </div>
      </div>

      {/* 推荐人信息 */}
      <div className="bg-[#1A2438]/50 backdrop-blur-sm rounded-lg p-4 border border-green-500/10">
        <h3 className="text-green-400 font-medium mb-4">推荐人信息</h3>
        {stats.hasReferrer ? (
          <div className="text-gray-300">
            <p>推荐人地址: {stats.referrer}</p>
          </div>
        ) : (
          <p className="text-gray-400">暂无推荐人</p>
        )}
      </div>

      {/* 推荐统计 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#1A2438]/50 backdrop-blur-sm rounded-lg p-4 border border-green-500/10">
          <h3 className="text-green-400 font-medium mb-4">直推统计</h3>
          <div className="space-y-2 text-gray-300">
            <p>直推人数: {stats.directCount}</p>
            <p>直推奖励: {ethers.utils.formatEther(stats.directRewards)} ZONE</p>
          </div>
        </div>
        <div className="bg-[#1A2438]/50 backdrop-blur-sm rounded-lg p-4 border border-green-500/10">
          <h3 className="text-green-400 font-medium mb-4">团队统计</h3>
          <div className="space-y-2 text-gray-300">
            <p>团队人数: {stats.teamCount}</p>
            <p>团队奖励: {ethers.utils.formatEther(stats.teamRewards)} ZONE</p>
          </div>
        </div>
      </div>

      {/* 直推列表 */}
      {stats.directReferrals.length > 0 && (
        <div className="bg-[#1A2438]/50 backdrop-blur-sm rounded-lg p-4 border border-green-500/10">
          <h3 className="text-green-400 font-medium mb-4">直推列表</h3>
          <div className="space-y-2">
            {stats.directReferrals.map((address, index) => (
              <div key={index} className="text-gray-300 break-all">
                {address}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 团队列表 */}
      {stats.teamMembers.length > 0 && (
        <div className="bg-[#1A2438]/50 backdrop-blur-sm rounded-lg p-4 border border-green-500/10">
          <h3 className="text-green-400 font-medium mb-4">团队列表</h3>
          <div className="space-y-2">
            {stats.teamMembers.map((address, index) => (
              <div key={index} className="text-gray-300 break-all">
                {address}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

ReferralTree.propTypes = {
  account: PropTypes.string.isRequired,
  provider: PropTypes.object.isRequired
};

export default ReferralTree;
