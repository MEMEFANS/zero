import React, { useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { toast } from 'react-toastify';
import { useNFTMarket } from './hooks/useNFTMarket';
import { MarketStats } from './components/MarketStats';
import { NFTList } from './components/NFTList';
import { NFTDetailModal } from './components/NFTDetailModal';
import { ListingModal } from './components/ListingModal';
import { StakeModal } from './components/StakeModal';
import { ConnectWallet } from './components/ConnectWallet';
import { MarketTabs } from './components/MarketTabs';
import { SearchAndFilter } from './components/SearchAndFilter';

const NFTMarket = () => {
  const { active } = useWeb3React();
  const {
    marketState,
    loadMarketData,
    handlePageChange,
    handleBuy,
    handleList,
    handleDelist,
    handleStake,
    setSelectedTab,
    setFilterType,
    setSearchTerm,
    setModal
  } = useNFTMarket();

  const {
    isLoading,
    selectedTab,
    filterType,
    searchTerm,
    marketItems,
    myNFTs,
    marketStats,
    userHistory,
    modals,
    pagination,
    balance
  } = marketState;

  useEffect(() => {
    if (active) {
      console.log('Wallet connected, loading market data...');
      loadMarketData(1);
    } else {
      console.log('Wallet not connected');
    }
  }, [active, loadMarketData]);

  if (!active) {
    return <ConnectWallet />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <MarketStats stats={marketStats} />
      
      <SearchAndFilter
        searchTerm={searchTerm}
        filterType={filterType}
        onSearchChange={setSearchTerm}
        onFilterChange={setFilterType}
      />
      
      <MarketTabs
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
      />

      {isLoading ? (
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          <div className="mt-4">加载中...</div>
        </div>
      ) : (
        <>
          <NFTList
            items={selectedTab === 'market' ? marketItems : myNFTs}
            userHistory={userHistory}
            selectedTab={selectedTab}
            onBuy={handleBuy}
            onList={(nft) => setModal('listing', true, nft)}
            onDelist={handleDelist}
            onStake={handleStake}
          />
          
          {/* 分页控件 */}
          <div className="flex justify-center mt-8">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className={`px-4 py-2 rounded ${
                  pagination.currentPage === 1
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                上一页
              </button>
              <span className="text-white">
                第 {pagination.currentPage} 页 / 共 {Math.ceil(pagination.total / pagination.pageSize)} 页
              </span>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= Math.ceil(pagination.total / pagination.pageSize)}
                className={`px-4 py-2 rounded ${
                  pagination.currentPage >= Math.ceil(pagination.total / pagination.pageSize)
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                下一页
              </button>
            </nav>
          </div>
        </>
      )}

      {modals.detail.isOpen && (
        <NFTDetailModal
          nft={modals.detail.nft}
          onClose={() => setModal('detail', false)}
          onBuy={handleBuy}
          onList={handleList}
          onDelist={handleDelist}
          onStake={handleStake}
          selectedTab={selectedTab}
        />
      )}

      <ListingModal
        nft={modals.listing.nft}
        isOpen={modals.listing.isOpen}
        onClose={() => setModal('listing', false)}
        onConfirm={handleList}
      />

      {modals.stake.isOpen && (
        <StakeModal
          nft={modals.stake.nft}
          onClose={() => setModal('stake', false)}
          onStake={handleStake}
        />
      )}
    </div>
  );
};

export default NFTMarket;
