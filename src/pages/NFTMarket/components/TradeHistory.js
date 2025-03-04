import React from 'react';
import { formatAddress, formatDate } from '../utils/formatters';

export const TradeHistory = ({ trades, tokenIds }) => {
  return (
    <div className="space-y-4">
      {trades.map((trade, index) => (
        <div key={index} className="bg-gray-800 p-4 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoItem label="Token ID" value={tokenIds[index]} />
            <InfoItem label="卖家" value={formatAddress(trade.seller)} />
            <InfoItem label="买家" value={formatAddress(trade.buyer)} />
            <InfoItem label="价格" value={`${trade.price} BNB`} />
            <InfoItem
              label="时间"
              value={formatDate(trade.time)}
              className="md:col-span-4"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const InfoItem = ({ label, value, className = '' }) => (
  <div className={className}>
    <div className="text-gray-400 text-sm">{label}</div>
    <div className="text-white font-medium">{value}</div>
  </div>
);
