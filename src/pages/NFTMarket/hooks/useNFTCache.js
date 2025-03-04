// NFT 数据缓存系统
const CACHE_KEY = 'nft_market_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分钟过期

export const useNFTCache = () => {
  // 从缓存中获取数据
  const getCachedData = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();

      // 检查是否过期
      if (now - timestamp > CACHE_EXPIRY) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  };

  // 将数据存入缓存
  const setCachedData = (data) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  };

  // 清除缓存
  const clearCache = () => {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  return {
    getCachedData,
    setCachedData,
    clearCache
  };
};
