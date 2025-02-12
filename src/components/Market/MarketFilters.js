import React from 'react';
import PropTypes from 'prop-types';

const MarketFilters = ({
  sortBy,
  filterType,
  searchTerm,
  onSortChange,
  onFilterChange,
  onSearchChange
}) => {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="flex-1 min-w-[200px]">
        <input
          type="text"
          placeholder="搜索 NFT ID..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-2 bg-[#1e2839] border border-gray-700 rounded-lg focus:border-blue-500 outline-none"
        />
      </div>
      
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        className="px-4 py-2 bg-[#1e2839] border border-gray-700 rounded-lg focus:border-blue-500 outline-none"
      >
        <option value="default">默认排序</option>
        <option value="price-asc">价格从低到高</option>
        <option value="price-desc">价格从高到低</option>
        <option value="power-desc">算力从高到低</option>
      </select>

      <select
        value={filterType}
        onChange={(e) => onFilterChange(e.target.value)}
        className="px-4 py-2 bg-[#1e2839] border border-gray-700 rounded-lg focus:border-blue-500 outline-none"
      >
        <option value="all">全部</option>
        <option value="N">N级别</option>
        <option value="R">R级别</option>
        <option value="SR">SR级别</option>
        <option value="SSR">SSR级别</option>
      </select>
    </div>
  );
};

MarketFilters.propTypes = {
  sortBy: PropTypes.string.isRequired,
  filterType: PropTypes.string.isRequired,
  searchTerm: PropTypes.string.isRequired,
  onSortChange: PropTypes.func.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onSearchChange: PropTypes.func.isRequired
};

export default React.memo(MarketFilters);
