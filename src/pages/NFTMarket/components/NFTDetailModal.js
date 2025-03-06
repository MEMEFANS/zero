import React from 'react';
import { Modal, Descriptions, Button, Typography, Tooltip, Divider } from 'antd';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const { Text, Link } = Typography;

const NFTDetailModal = ({ isOpen, nft, onClose, onAction }) => {
  if (!nft) return null;

  const rarityNames = ['N', 'R', 'SR', 'SSR'];
  const rarityColors = ['default', 'blue', 'purple', 'gold'];

  const renderActionButton = () => {
    if (!nft.isActive && nft.owner === window.ethereum?.selectedAddress) {
      return (
        <Button 
          type="primary" 
          onClick={() => onAction('list', nft)}
        >
          上架
        </Button>
      );
    }

    if (nft.isActive && nft.seller === window.ethereum?.selectedAddress) {
      return (
        <Button 
          danger 
          onClick={() => onAction('delist', nft)}
        >
          下架
        </Button>
      );
    }

    if (nft.isActive && nft.seller !== window.ethereum?.selectedAddress) {
      return (
        <Button 
          type="primary" 
          onClick={() => onAction('buy', nft)}
        >
          购买 ({nft.price ? (Number(nft.price) / 1e18).toFixed(2) : '0'} BNB)
        </Button>
      );
    }

    return null;
  };

  return (
    <Modal
      title="NFT详情"
      open={isOpen}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
        renderActionButton()
      ].filter(Boolean)}
    >
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2">
          <div className="relative pt-[100%]">
            <img
              src={nft.image}
              alt={`NFT #${nft.id}`}
              className="absolute top-0 left-0 w-full h-full object-cover rounded-lg"
            />
          </div>
        </div>

        <div className="w-full md:w-1/2">
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="NFT ID">#{nft.id}</Descriptions.Item>
            <Descriptions.Item label="稀有度">
              <Text type={rarityColors[nft.rarity]}>
                {rarityNames[nft.rarity]}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="算力">{nft.power}</Descriptions.Item>
            <Descriptions.Item label="每日收益">
              {nft.dailyReward ? (Number(nft.dailyReward) / 1e18).toFixed(2) : '0'} ZONE
            </Descriptions.Item>
            <Descriptions.Item label="最大收益">
              {nft.maxReward ? (Number(nft.maxReward) / 1e18).toFixed(2) : '0'} ZONE
            </Descriptions.Item>
            {nft.isStaked && (
              <Descriptions.Item label="质押时间">
                <Tooltip title={new Date(nft.stakeTime * 1000).toLocaleString()}>
                  {formatDistanceToNow(new Date(nft.stakeTime * 1000), {
                    addSuffix: true,
                    locale: zhCN
                  })}
                </Tooltip>
              </Descriptions.Item>
            )}
          </Descriptions>

          {nft.isActive && (
            <>
              <Divider />
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="价格">
                  <Text strong>{nft.price ? (Number(nft.price) / 1e18).toFixed(2) : '0'} BNB</Text>
                </Descriptions.Item>
                <Descriptions.Item label="卖家">
                  <Tooltip title={nft.seller}>
                    <Link copyable>
                      {`${nft.seller.slice(0, 6)}...${nft.seller.slice(-4)}`}
                    </Link>
                  </Tooltip>
                </Descriptions.Item>
              </Descriptions>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default NFTDetailModal;
