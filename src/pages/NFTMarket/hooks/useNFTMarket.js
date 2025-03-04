import { useReducer, useCallback, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { useContracts } from './useContracts';
import { handleContractError } from '../utils/errorHandler';

// 初始状态
const initialState = {
  isLoading: false,
  selectedTab: 'market',
  filterType: '',
  searchTerm: '',
  marketItems: [],
  myNFTs: [],
  marketStats: {
    totalVolume: '0',
    floorPrice: '0',
    listedCount: 0,
    totalRewards: '0'
  },
  userHistory: [],
  modals: {
    detail: { isOpen: false, nft: null },
    listing: { isOpen: false, nft: null },
    stake: { isOpen: false, nft: null }
  },
  pagination: {
    currentPage: 1,
    pageSize: 20,  // 增加每页显示数量
    total: 0
  },
  balance: '0'
};

// Action Types
const SET_LOADING = 'SET_LOADING';
const SET_MARKET_ITEMS = 'SET_MARKET_ITEMS';
const SET_MY_NFTS = 'SET_MY_NFTS';
const SET_SELECTED_TAB = 'SET_SELECTED_TAB';
const SET_FILTER_TYPE = 'SET_FILTER_TYPE';
const SET_SEARCH_TERM = 'SET_SEARCH_TERM';
const SET_MODAL = 'SET_MODAL';
const UPDATE_MARKET_STATS = 'UPDATE_MARKET_STATS';
const SET_PAGINATION = 'SET_PAGINATION';
const SET_BALANCE = 'SET_BALANCE';

// Reducer
function reducer(state, action) {
  switch (action.type) {
    case SET_LOADING:
      return { ...state, isLoading: action.payload };
    case SET_MARKET_ITEMS:
      return { ...state, marketItems: action.payload };
    case SET_MY_NFTS:
      return { ...state, myNFTs: action.payload };
    case SET_SELECTED_TAB:
      return { ...state, selectedTab: action.payload };
    case SET_FILTER_TYPE:
      return { ...state, filterType: action.payload };
    case SET_SEARCH_TERM:
      return { ...state, searchTerm: action.payload };
    case SET_MODAL:
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload.modal]: {
            isOpen: action.payload.isOpen,
            nft: action.payload.nft
          }
        }
      };
    case UPDATE_MARKET_STATS:
      return { ...state, marketStats: action.payload };
    case SET_PAGINATION:
      return {
        ...state,
        pagination: {
          ...state.pagination,
          ...action.payload
        }
      };
    case SET_BALANCE:
      return { ...state, balance: action.payload };
    default:
      return state;
  }
}

export function useNFTMarket() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { account, library } = useWeb3React();
  const contracts = useContracts();

  useEffect(() => {
    if (account && contracts) {
      const loadNFTCount = async () => {
        try {
          const totalSupply = await contracts.nftContract.totalSupply();
          dispatch({ type: SET_BALANCE, payload: totalSupply.toString() });
        } catch (error) {
          console.error('Error loading NFT count:', error);
        }
      };
      loadNFTCount();
    }
  }, [account, contracts]);

  // 加载市场数据
  const loadMarketData = useCallback(async (page = 1) => {
    try {
      dispatch({ type: SET_LOADING, payload: true });

      // 先加载市场统计数据
      const stats = await contracts.loadMarketStats();
      console.log('Market stats loaded:', stats);
      if (stats) {
        dispatch({ type: UPDATE_MARKET_STATS, payload: stats });
      }

      // 加载市场列表
      const { items, total } = await contracts.loadMarketItems(page, state.pagination.pageSize);
      dispatch({ type: SET_MARKET_ITEMS, payload: items });
      dispatch({
        type: SET_PAGINATION,
        payload: { currentPage: page, total }
      });

      // 加载我的 NFT
      const { items: myItems } = await contracts.loadMyNFTs(page, state.pagination.pageSize);
      dispatch({ type: SET_MY_NFTS, payload: myItems });

    } catch (error) {
      console.error('Error in loadMarketData:', error);
      toast.error('加载市场数据失败');
    } finally {
      dispatch({ type: SET_LOADING, payload: false });
    }
  }, [contracts, state.pagination.pageSize]);

  // 处理页面变化
  const handlePageChange = useCallback((newPage) => {
    loadMarketData(newPage);
  }, [loadMarketData]);

  // 处理购买
  const handleBuy = useCallback(async (nft) => {
    try {
      dispatch({ type: SET_LOADING, payload: true });
      const success = await contracts.buyNFT(nft.tokenId);
      if (success) {
        await loadMarketData();
      }
    } catch (error) {
      handleContractError(error);
    } finally {
      dispatch({ type: SET_LOADING, payload: false });
    }
  }, [contracts, loadMarketData]);

  // 处理上架
  const handleList = useCallback(async (nft, price) => {
    try {
      dispatch({ type: SET_LOADING, payload: true });
      const success = await contracts.listNFT(nft.tokenId, price);
      if (success) {
        // 等待几秒钟让区块链确认交易
        await new Promise(resolve => setTimeout(resolve, 2000));
        // 重新加载所有数据
        await loadMarketData(1); // 强制加载第一页
        toast.success('NFT 上架成功');
      }
    } catch (error) {
      handleContractError(error);
    } finally {
      dispatch({ type: SET_LOADING, payload: false });
    }
  }, [contracts, loadMarketData]);

  // 处理下架
  const handleDelist = useCallback(async (nft) => {
    try {
      dispatch({ type: SET_LOADING, payload: true });
      const success = await contracts.delistNFT(nft.tokenId);
      if (success) {
        // 等待几秒钟让区块链确认交易
        await new Promise(resolve => setTimeout(resolve, 2000));
        // 重新加载所有数据
        await loadMarketData(1); // 强制加载第一页
        toast.success('NFT 下架成功');
      }
    } catch (error) {
      handleContractError(error);
    } finally {
      dispatch({ type: SET_LOADING, payload: false });
    }
  }, [contracts, loadMarketData]);

  // 处理质押
  const handleStake = useCallback(async (nft) => {
    try {
      dispatch({ type: SET_LOADING, payload: true });
      const success = await contracts.stakeNFT(nft.tokenId);
      if (success) {
        await loadMarketData();
      }
    } catch (error) {
      handleContractError(error);
    } finally {
      dispatch({ type: SET_LOADING, payload: false });
    }
  }, [contracts, loadMarketData]);

  // 设置选中的标签页
  const setSelectedTab = useCallback((tab) => {
    dispatch({ type: SET_SELECTED_TAB, payload: tab });
  }, []);

  // 设置过滤类型
  const setFilterType = useCallback((type) => {
    dispatch({ type: SET_FILTER_TYPE, payload: type });
  }, []);

  // 设置搜索关键词
  const setSearchTerm = useCallback((term) => {
    dispatch({ type: SET_SEARCH_TERM, payload: term });
  }, []);

  // 设置模态框状态
  const setModal = useCallback((modal, isOpen, nft = null) => {
    dispatch({
      type: SET_MODAL,
      payload: { modal, isOpen, nft }
    });
  }, []);

  return {
    marketState: state,
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
  };
}
