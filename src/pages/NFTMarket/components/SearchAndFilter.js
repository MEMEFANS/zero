import React from 'react';
import { NFT_RARITY_COLORS } from '../../../constants/contracts';

export const SearchAndFilter = ({
  searchTerm,
  filterType,
  onSearchChange,
  onFilterChange
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {/* 搜索框 */}
      <div className="flex-1">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="搜索 NFT ID..."
          className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 过滤按钮组 */}
      <div className="flex gap-2">
        {Object.entries(NFT_RARITY_COLORS).map(([rarity, color]) => (
          <button
            key={rarity}
            onClick={() => onFilterChange(filterType === rarity ? '' : rarity)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filterType === rarity
                ? color + ' text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {rarity}
          </button>
        ))}
      </div>
    </div>
  );
};

const FilterButton = ({ active, children, onClick }) => (
  <button
    className={`px-3 py-1 md:px-4 md:py-2 rounded-lg text-sm md:text-base ${
      active ? 'bg-green-600' : 'bg-gray-800'
    } text-white`}
    onClick={onClick}
  >
    {children}
  </button>
);
