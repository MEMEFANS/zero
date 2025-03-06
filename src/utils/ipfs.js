// IPFS 网关列表
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/'
];

// 将 IPFS URI 转换为 HTTP URL
export const ipfsToHttp = (uri) => {
  if (!uri) return '';
  
  // 如果已经是 HTTP URL，直接返回
  if (uri.startsWith('http')) {
    return uri;
  }

  // 处理 ipfs:// 协议
  if (uri.startsWith('ipfs://')) {
    const hash = uri.replace('ipfs://', '');
    return `${IPFS_GATEWAYS[0]}${hash}`;
  }

  // 处理 ipfs/hash 格式
  if (uri.startsWith('ipfs/')) {
    const hash = uri.replace('ipfs/', '');
    return `${IPFS_GATEWAYS[0]}${hash}`;
  }

  // 如果是纯 CID
  if (uri.match(/^[a-zA-Z0-9]{46,59}$/)) {
    return `${IPFS_GATEWAYS[0]}${uri}`;
  }

  return uri;
};

// 获取 NFT 元数据
export const getNFTMetadata = async (uri) => {
  try {
    const url = ipfsToHttp(uri);
    const response = await fetch(url);
    const metadata = await response.json();
    
    // 如果图片 URL 也是 IPFS 格式，转换它
    if (metadata.image) {
      metadata.image = ipfsToHttp(metadata.image);
    }
    
    return metadata;
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    return null;
  }
};
