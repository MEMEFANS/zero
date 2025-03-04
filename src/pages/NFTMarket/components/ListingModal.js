import React, { useState } from 'react';

export const ListingModal = ({ nft, onClose, onConfirm }) => {
  const [listingPrice, setListingPrice] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (listingPrice && parseFloat(listingPrice) > 0) {
      onConfirm(nft, listingPrice);
      onClose();
    }
  };

  if (!nft) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#1E2328] w-[280px] rounded-xl">
        <div className="flex justify-between items-center h-12 px-4">
          <div className="text-sm font-medium text-gray-200">
            上架 NFT #{nft.tokenId}
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-lg"
          >
            ×
          </button>
        </div>
        <div className="px-4 pb-4">
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <input
                type="number"
                value={listingPrice}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || parseFloat(value) >= 0) {
                    setListingPrice(value);
                  }
                }}
                placeholder="0.0"
                step="0.000000000000000001"
                min="0"
                className="w-full h-10 bg-[#282C34] text-sm text-gray-200 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#F3BA2F] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <div className="absolute right-0 top-0 bottom-0 flex items-center pr-3 text-[#F3BA2F] text-xs font-medium">
                BNB
              </div>
            </div>
            <button
              type="submit"
              disabled={!listingPrice || parseFloat(listingPrice) <= 0}
              className={`w-full h-10 mt-3 rounded-lg text-sm font-medium transition-colors ${
                listingPrice && parseFloat(listingPrice) > 0
                  ? 'bg-gradient-to-r from-[#F3BA2F] to-[#F0B90B] hover:from-[#F5C332] hover:to-[#F2BC0E] text-black'
                  : 'bg-[#282C34] text-gray-500 cursor-not-allowed'
              }`}
            >
              确认上架
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
