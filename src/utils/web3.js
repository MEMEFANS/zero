import { InjectedConnector } from '@web3-react/injected-connector';
import { ethers } from 'ethers';

// 支持的链 ID
const supportedChainIds = [1, 3, 4, 5, 42, 56, 97];

// 创建注入器
export const injected = new InjectedConnector({
  supportedChainIds
});

// 获取 provider
export const getProvider = () => {
  if (window.ethereum) {
    return new ethers.providers.Web3Provider(window.ethereum);
  }
  return null;
};

// 获取合约实例
export const getContract = (address, abi, provider) => {
  if (!provider) {
    provider = getProvider();
  }
  return new ethers.Contract(address, abi, provider);
};

// 获取签名者
export const getSigner = (provider) => {
  if (!provider) {
    provider = getProvider();
  }
  return provider.getSigner();
};
