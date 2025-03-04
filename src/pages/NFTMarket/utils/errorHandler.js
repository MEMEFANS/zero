import { toast } from 'react-toastify';

const ERROR_MESSAGES = {
  'user rejected': '您取消了操作',
  'Not token owner': '您不是该 NFT 的所有者',
  'NFT is staked': '该 NFT 已被质押',
  'Already listed': '该 NFT 已在市场上',
  'Price too low': '价格太低',
  'insufficient funds': '余额不足',
  'execution reverted': '交易执行失败',
  'paused': '市场合约已暂停',
};

export const handleContractError = (error) => {
  console.error('Contract Error:', error);

  // 用户取消交易
  if (error.code === 'ACTION_REJECTED') {
    toast.error('您取消了交易');
    return;
  }

  // Gas 费用不足
  if (error.code === -32603) {
    toast.error('交易执行失败，请检查 Gas 费用');
    return;
  }

  // 匹配预定义错误消息
  for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
    if (error.message?.toLowerCase().includes(key.toLowerCase())) {
      toast.error(message);
      return;
    }
  }

  // 默认错误消息
  toast.error(error.message || '操作失败，请重试');
};
