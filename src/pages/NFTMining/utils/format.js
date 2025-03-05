import { ethers } from 'ethers';

export const formatNumber = (number, decimals = 2) => {
  if (!number) return '0';
  return Number(number).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatEther = (wei) => {
  if (!wei) return '0';
  return ethers.utils.formatEther(wei);
};

export const parseEther = (ether) => {
  if (!ether) return ethers.BigNumber.from(0);
  return ethers.utils.parseEther(ether.toString());
};
