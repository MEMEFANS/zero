import React, { useState, useMemo, useEffect } from 'react';
import { Row, Col, Empty, Spin, Select, Input, Space, Button, Pagination, Modal, message } from 'antd';
import { SearchOutlined, AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import NFTCard from './NFTCard';
import BatchActionModal from './BatchActionModal';
import NFTDetailModal from './NFTDetailModal';
import ListingModal from './ListingModal';
import { useNFTMarket } from '../hooks/useNFTMarket';
import { motion } from 'framer-motion';
import '../styles/search.css';

const { Option } = Select;

const NFTList = ({ type = 'market', onPageChange }) => {
  const { 
    marketState, 
    fetchMarketItems, 
    loadMyNFTs, 
    handleBuy, 
    handleList, 
    handleUnlistNFT,
    loadingState 
  } = useNFTMarket();
  
  const { marketItems, myNFTs, pagination } = marketState;
  const { isLoading } = loadingState.market;
  
  const [sortBy, setSortBy] = useState('price_asc');
  const [filterRarity, setFilterRarity] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [batchAction, setBatchAction] = useState(null);
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [listingModalOpen, setListingModalOpen] = useState(false);

  // 初始加载
  useEffect(() => {
    if (type === 'market') {
      fetchMarketItems(1);
    } else if (type === 'myNFTs') {
      loadMyNFTs();
    }
  }, [type, fetchMarketItems, loadMyNFTs]);

  // 获取要显示的NFT列表
  const nftList = useMemo(() => {
    return type === 'market' ? marketItems : myNFTs;
  }, [type, marketItems, myNFTs]);

  // 过滤和排序NFT
  const filteredAndSortedNFTs = useMemo(() => {
    let result = [...(nftList || [])];

    // 应用稀有度过滤
    if (filterRarity !== 'all') {
      result = result.filter(nft => nft.rarity === parseInt(filterRarity));
    }

    // 应用搜索过滤
    if (searchTerm) {
      result = result.filter(nft => 
        nft.id.toString().includes(searchTerm) || 
        nft.power?.toString().includes(searchTerm)
      );
    }

    // 应用排序
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return parseFloat(a.price || 0) - parseFloat(b.price || 0);
        case 'price_desc':
          return parseFloat(b.price || 0) - parseFloat(a.price || 0);
        case 'power_asc':
          return parseInt(a.power || 0) - parseInt(b.power || 0);
        case 'power_desc':
          return parseInt(b.power || 0) - parseInt(a.power || 0);
        case 'reward_asc':
          return parseFloat(a.dailyReward || 0) - parseFloat(b.dailyReward || 0);
        case 'reward_desc':
          return parseFloat(b.dailyReward || 0) - parseFloat(a.dailyReward || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [nftList, filterRarity, searchTerm, sortBy]);

  // 处理分页变化
  const handlePageChange = (page) => {
    if (type === 'market') {
      fetchMarketItems(page);
    }
    onPageChange?.(page);
  };
  const handleNFTAction = (action, nft) => {
    switch (action) {
      case 'buy':
        if (nft && nft.id && nft.price) {
          handleBuy(nft.id, nft.price);
        } else {
          message.error('NFT数据无效');
        }
        break;
      case 'list':
        setSelectedNFT(null); // 确保不会显示详情模态框
        setListingModalOpen(true);
        setSelectedNFT(nft);
        break;
      case 'unlist':
        if (nft && nft.id) {
          handleUnlistNFT(nft);
        } else {
          message.error('NFT数据无效');
        }
        break;
      case 'view':
        setListingModalOpen(false); // 确保上架模态框是关闭的
        setSelectedNFT(nft);
        break;
      default:
        break;
    }
  };
  // 处理NFT选择
  const handleNFTSelect = (tokenId) => {
    setSelectedNFTs(prev => {
      if (prev.includes(tokenId)) {
        return prev.filter(id => id !== tokenId);
      } else {
        return [...prev, tokenId];
      }
    });
  };

  // 处理批量操作
  const handleBatchAction = (action) => {
    setBatchAction(action);
  };

  // 清除选择
  const clearSelection = () => {
    setSelectedNFTs([]);
  };

  const renderNFTList = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      );
    }

    if (!filteredAndSortedNFTs?.length) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span className="text-gray-400">
              {type === 'market' ? '暂无在售NFT' : '暂无NFT'}
            </span>
          }
        />
      );
    }

    return (
      <Row gutter={[16, 24]}>
        {filteredAndSortedNFTs.map(nft => (
          <Col key={nft.id} xs={24} sm={12} md={8} lg={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <NFTCard
                nft={nft}
                type={type === 'market' ? 'market' : 'myNFT'}
                onAction={handleNFTAction}
                onSelect={handleNFTSelect}
                isSelected={selectedNFTs.includes(nft.id)}
              />
            </motion.div>
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-4"
    >
      {/* 工具栏 */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex flex-wrap gap-2 items-center">
          <Select
            value={sortBy}
            onChange={setSortBy}
            className="nft-filter-select w-[120px]"
            placeholder="排序方式"
          >
            <Option value="price_asc">价格从低到高</Option>
            <Option value="price_desc">价格从高到低</Option>
            <Option value="power_asc">算力从低到高</Option>
            <Option value="power_desc">算力从高到低</Option>
            <Option value="reward_asc">收益从低到高</Option>
            <Option value="reward_desc">收益从高到低</Option>
          </Select>

          <Select
            value={filterRarity}
            onChange={setFilterRarity}
            className="nft-filter-select w-[100px]"
            placeholder="稀有度"
          >
            <Option value="all">全部</Option>
            <Option value="0">N</Option>
            <Option value="1">R</Option>
            <Option value="2">SR</Option>
            <Option value="3">SSR</Option>
          </Select>

          <Input
            placeholder="搜索 NFT ID 或算力"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            prefix={<SearchOutlined />}
            className="nft-search-input w-full sm:w-[200px]"
          />
        </div>

        <div className="flex gap-2 items-center">
          <Button
            icon={<AppstoreOutlined />}
            type={viewMode === 'grid' ? 'primary' : 'default'}
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'nft-view-button-active' : 'nft-view-button'}
          />
          <Button
            icon={<UnorderedListOutlined />}
            type={viewMode === 'list' ? 'primary' : 'default'}
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'nft-view-button-active' : 'nft-view-button'}
          />
        </div>
      </div>

      {/* NFT列表 */}
      {renderNFTList()}

      {/* 分页 */}
      {type === 'market' && pagination && (
        <div className="mt-6 flex justify-center">
          <Pagination
            current={pagination.current}
            total={pagination.total}
            pageSize={pagination.pageSize}
            onChange={handlePageChange}
          />
        </div>
      )}

      {/* NFT详情模态框 */}
      <NFTDetailModal
        isOpen={!!selectedNFT}
        nft={selectedNFT}
        onClose={() => setSelectedNFT(null)}
        onAction={handleNFTAction}
      />

      {/* 上架模态框 */}
      <ListingModal
        nft={selectedNFT}
        visible={listingModalOpen}
        onClose={() => {
          setListingModalOpen(false);
          setSelectedNFT(null);
        }}
        onConfirm={(price) => {
          if (selectedNFT) {
            handleList(selectedNFT, price);
            setListingModalOpen(false);
            setSelectedNFT(null);
          }
        }}
      />

      {/* 批量操作弹窗 */}
      <BatchActionModal
        visible={!!batchAction}
        action={batchAction}
        selectedNFTs={selectedNFTs}
        onClose={() => setBatchAction(null)}
        onConfirm={() => {
          setBatchAction(null);
          clearSelection();
        }}
      />
    </motion.div>
  );
};

export default NFTList;
