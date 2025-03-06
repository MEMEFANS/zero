import { useState, useCallback } from 'react';
import { message } from 'antd';

const useLoadingError = (initialState = {}) => {
  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    error: null,
    ...initialState
  });

  const startLoading = useCallback((key = 'default') => {
    setLoadingState(prev => ({
      ...prev,
      [key]: {
        isLoading: true,
        error: null
      }
    }));
  }, []);

  const stopLoading = useCallback((key = 'default') => {
    setLoadingState(prev => ({
      ...prev,
      [key]: {
        isLoading: false,
        error: null
      }
    }));
  }, []);

  const setError = useCallback((error, key = 'default') => {
    setLoadingState(prev => ({
      ...prev,
      [key]: {
        isLoading: false,
        error
      }
    }));

    // 处理常见错误
    if (error.code === 4001) {
      message.info('用户取消了操作');
    } else if (error.code === -32603) {
      message.error('交易执行失败，请检查余额或授权状态');
    } else if (error.message?.includes('insufficient funds')) {
      message.error('余额不足');
    } else if (error.message?.includes('nonce')) {
      message.error('交易 nonce 错误，请刷新页面重试');
    } else {
      message.error(error.message || '操作失败');
    }
  }, []);

  const withLoading = useCallback((fn, key = 'default') => {
    return async (...args) => {
      try {
        startLoading(key);
        const result = await fn(...args);
        stopLoading(key);
        return result;
      } catch (error) {
        setError(error, key);
        throw error;
      }
    };
  }, [startLoading, stopLoading, setError]);

  return {
    loadingState,
    startLoading,
    stopLoading,
    setError,
    withLoading
  };
};

export default useLoadingError;
