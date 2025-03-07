import { useState, useEffect } from 'react';
import { NFT_LEVEL_IMAGES, NFT_RARITY_IMAGES, MOBILE_NFT_IMAGES } from '../constants/nftImages';

const MOBILE_THRESHOLD = 768; // 移动端阈值

export const useOptimizedImage = (nft, isMobile = window.innerWidth <= MOBILE_THRESHOLD) => {
  const [currentImage, setCurrentImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 获取本地占位图
    const getPlaceholderImage = () => {
      // 移动端优先使用压缩版图片
      if (isMobile && MOBILE_NFT_IMAGES[nft.rarity]) {
        return MOBILE_NFT_IMAGES[nft.rarity];
      }
      
      if (nft.level && NFT_LEVEL_IMAGES[nft.level]) {
        return NFT_LEVEL_IMAGES[nft.level];
      }
      
      if (nft.rarity && NFT_RARITY_IMAGES[nft.rarity]) {
        return NFT_RARITY_IMAGES[nft.rarity];
      }
      
      return '/images/nft-placeholder.png';
    };

    // 设置初始占位图
    const placeholderImage = getPlaceholderImage();
    setCurrentImage(placeholderImage);

    // 如果没有实际图片 URI，直接返回
    if (!nft.imageURI) {
      setIsLoading(false);
      return;
    }

    // 处理 IPFS 链接
    const processImageURI = (uri) => {
      if (uri.startsWith('ipfs://')) {
        return `https://ipfs.io/ipfs/${uri.replace('ipfs://', '')}`;
      }
      return uri;
    };

    // 移动端使用压缩版图片URL
    const getOptimizedImageURL = (url) => {
      if (isMobile) {
        // 如果是自己的 CDN，添加压缩参数
        if (url.includes('your-cdn.com')) {
          return `${url}?imageView2/2/w/400/q/75`;
        }
        // 如果是 IPFS，可以使用 IPFS 网关的压缩功能
        if (url.includes('ipfs.io')) {
          return `${url}?format=webp&width=400&quality=75`;
        }
      }
      return url;
    };

    // 使用 Intersection Observer 实现懒加载
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // 图片进入视口，开始加载
            const img = new Image();
            const optimizedURL = getOptimizedImageURL(processImageURI(nft.imageURI));
            img.src = optimizedURL;

            img.onload = () => {
              setCurrentImage(optimizedURL);
              setIsLoading(false);
              observer.disconnect();
            };

            img.onerror = () => {
              console.error('Failed to load NFT image:', optimizedURL);
              setIsLoading(false);
              observer.disconnect();
            };
          }
        });
      },
      {
        rootMargin: '50px', // 提前 50px 开始加载
        threshold: 0.1
      }
    );

    // 创建一个占位元素来观察
    const target = document.createElement('div');
    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [nft.imageURI, nft.level, nft.rarity, isMobile]);

  return {
    currentImage,
    isLoading
  };
};
