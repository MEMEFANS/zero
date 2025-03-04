import { ethers } from 'ethers';

export const formatBNB = (value) => {
  if (typeof value === 'object' && value._isBigNumber) {
    return ethers.utils.formatEther(value);
  }
  return value;
};

export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatDate = (date) => {
  if (!date) return '';
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleString();
};

export const formatPower = (power) => {
  if (!power) return '0';
  return parseFloat(power).toFixed(2);
};

export const formatZONE = (amount) => {
  if (!amount) return '0';
  return parseFloat(amount).toFixed(4);
};
