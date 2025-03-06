import React, { useState } from 'react';
import { Modal, Form, Input, Table, Button, Typography, InputNumber } from 'antd';
import { formatEther, parseEther } from 'ethers/lib/utils';
import { useNFTMarket } from '../hooks/useNFTMarket';

const { Text } = Typography;

const BatchActionModal = ({ isOpen, type, nfts, onClose }) => {
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [form] = Form.useForm();
  const { handleBatchList, handleBatchBuy } = useNFTMarket();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const columns = [
    {
      title: 'NFT ID',
      dataIndex: 'id',
      key: 'id',
      render: id => `#${id}`,
    },
    {
      title: '稀有度',
      dataIndex: 'rarity',
      key: 'rarity',
      render: rarity => ['N', 'R', 'SR', 'SSR'][rarity],
    },
    {
      title: '算力',
      dataIndex: 'power',
      key: 'power',
    },
    {
      title: '每日收益',
      dataIndex: 'dailyReward',
      key: 'dailyReward',
      render: reward => `${formatEther(reward)} ZONE`,
    },
    type === 'buy' && {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: price => `${formatEther(price)} BNB`,
    },
  ].filter(Boolean);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);

      if (type === 'list') {
        const prices = selectedNFTs.map(() => parseEther(values.price.toString()));
        await handleBatchList(selectedNFTs.map(nft => nft.id), prices);
      } else {
        await handleBatchBuy(selectedNFTs.map(nft => nft.id));
      }

      form.resetFields();
      setSelectedNFTs([]);
      onClose();
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const rowSelection = {
    selectedRowKeys: selectedNFTs.map(nft => nft.id),
    onChange: (_, selectedRows) => {
      setSelectedNFTs(selectedRows);
    },
    getCheckboxProps: (record) => ({
      disabled: type === 'buy' && record.seller === window.ethereum?.selectedAddress,
    }),
  };

  const totalPrice = type === 'buy' 
    ? selectedNFTs.reduce((sum, nft) => sum + parseFloat(formatEther(nft.price)), 0)
    : 0;

  return (
    <Modal
      title={type === 'list' ? '批量上架NFT' : '批量购买NFT'}
      open={isOpen}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={isSubmitting}
          onClick={handleSubmit}
          disabled={selectedNFTs.length === 0}
        >
          {type === 'list' ? '确认上架' : '确认购买'}
        </Button>
      ]}
    >
      <div className="mb-6">
        {type === 'list' && (
          <Form form={form} layout="vertical">
            <Form.Item
              name="price"
              label="统一价格 (BNB)"
              rules={[
                { required: true, message: '请输入价格' },
                { type: 'number', min: 0.01, message: '价格必须大于0.01' }
              ]}
            >
              <InputNumber
                placeholder="请输入价格"
                step={0.01}
                precision={3}
                style={{ width: '200px' }}
              />
            </Form.Item>
          </Form>
        )}

        {type === 'buy' && selectedNFTs.length > 0 && (
          <div className="mb-4">
            <Text strong>总价: {totalPrice.toFixed(4)} BNB</Text>
          </div>
        )}

        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={nfts}
          rowKey="id"
          pagination={false}
          scroll={{ y: 400 }}
          size="small"
        />

        <div className="mt-4">
          <Text type="secondary">
            已选择 {selectedNFTs.length} 个NFT
            {type === 'list' && '，最多可同时上架20个'}
            {type === 'buy' && '，最多可同时购买20个'}
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default BatchActionModal;
