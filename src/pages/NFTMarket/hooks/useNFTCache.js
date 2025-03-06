import { useState, useCallback, useEffect } from 'react';

const CACHE_KEY = 'nft_market_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5分钟缓存

const useNFTCache = () => {
  const [cache, setCache] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return data;
        }
      }
      return {};
    } catch {
      return {};
    }
  });

  // 更新缓存
  const updateCache = useCallback((key, data) => {
    setCache(prev => {
      const newCache = { ...prev, [key]: data };
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: newCache,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error('Cache update failed:', error);
      }
      return newCache;
    });
  }, []);

  // 获取缓存
  const getCache = useCallback((key) => {
    return cache[key];
  }, [cache]);

  // 清除缓存
  const clearCache = useCallback(() => {
    setCache({});
    localStorage.removeItem(CACHE_KEY);
  }, []);

  // 定期清理过期缓存
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp >= CACHE_EXPIRY) {
            clearCache();
          }
        }
      } catch {
        clearCache();
      }
    }, CACHE_EXPIRY);

    return () => clearInterval(interval);
  }, [clearCache]);

  return {
    cache,
    updateCache,
    getCache,
    clearCache
  };
};

export default useNFTCache;
