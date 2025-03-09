import React from 'react';
import { Table, Empty } from 'antd';
import { motion } from 'framer-motion';
import { formatEther } from '@ethersproject/units';
import dayjs from 'dayjs';

const TradeHistory = ({ history = [] }) => {
  console.log('Rendering trade history:', history);

  const columns = [
    {
      title: 'NFT ID',
      dataIndex: 'tokenId',
      key: 'tokenId',
      render: (id) => (
        <span className="text-[#E2E8F0] font-medium">#{id}</span>
      ),
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      render: (price) => (
        <div className="flex items-center gap-1">
          <span className="text-[#E2E8F0]">{formatEther(price)}</span>
          <span className="text-[#94A3B8]">BNB</span>
        </div>
      ),
    },
    {
      title: '卖家',
      dataIndex: 'seller',
      key: 'seller',
      render: (address) => (
        <span className="text-[#94A3B8] font-mono">
          {`${address.slice(0, 6)}...${address.slice(-4)}`}
        </span>
      ),
    },
    {
      title: '买家',
      dataIndex: 'buyer',
      key: 'buyer',
      render: (address) => (
        <span className="text-[#94A3B8] font-mono">
          {`${address.slice(0, 6)}...${address.slice(-4)}`}
        </span>
      ),
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (time) => (
        <span className="text-[#94A3B8]">
          {dayjs(time * 1000).format('YYYY-MM-DD HH:mm')}
        </span>
      ),
      sorter: (a, b) => b.timestamp - a.timestamp,
      defaultSortOrder: 'descend'
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="rounded-xl overflow-hidden border border-[#2D3748] bg-[#1A2333]/80 backdrop-blur-lg"
    >
      <div className="bg-[#1A2333]/80">
        <Table
          dataSource={history}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 10,
            className: 'custom-pagination',
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span className="text-[#94A3B8] opacity-70">暂无交易记录</span>
                }
              />
            ),
          }}
          className="custom-table"
        />
      </div>
    </motion.div>
  );
};

export default TradeHistory;
