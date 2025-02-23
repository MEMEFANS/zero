import React, { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import {
  Table,
  Card,
  Typography,
  Tag,
  Space,
  DatePicker,
  Button,
  Select,
  message
} from 'antd';
import moment from 'moment';
import { MYSTERY_BOX_ABI } from '../../contracts/MysteryBoxABI';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const TransactionManagement = () => {
  const { library } = useWeb3React();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState({
    dateRange: null,
    type: 'all',
    status: 'all'
  });

  // 加载交易记录
  const loadTransactions = async () => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(
        process.env.REACT_APP_MYSTERY_BOX_ADDRESS,
        MYSTERY_BOX_ABI,
        library.getSigner()
      );

      // 获取各种事件
      const [
        mintEvents,
        stakeEvents,
        unstakeEvents,
        rewardEvents
      ] = await Promise.all([
        contract.queryFilter(contract.filters.Transfer(ethers.constants.AddressZero)),
        contract.queryFilter(contract.filters.Staked()),
        contract.queryFilter(contract.filters.Unstaked()),
        contract.queryFilter(contract.filters.RewardPaid())
      ]);

      // 处理所有事件
      const allTransactions = [
        ...mintEvents.map(event => ({
          hash: event.transactionHash,
          type: 'mint',
          from: event.args.from,
          to: event.args.to,
          tokenId: event.args.tokenId.toString(),
          timestamp: null,
          status: 'success'
        })),
        ...stakeEvents.map(event => ({
          hash: event.transactionHash,
          type: 'stake',
          from: event.args.user,
          tokenId: event.args.tokenId.toString(),
          timestamp: null,
          status: 'success'
        })),
        ...unstakeEvents.map(event => ({
          hash: event.transactionHash,
          type: 'unstake',
          from: event.args.user,
          tokenId: event.args.tokenId.toString(),
          timestamp: null,
          status: 'success'
        })),
        ...rewardEvents.map(event => ({
          hash: event.transactionHash,
          type: 'reward',
          to: event.args.user,
          amount: ethers.utils.formatEther(event.args.reward),
          timestamp: null,
          status: 'success'
        }))
      ];

      // 获取区块时间戳
      const timestamps = await Promise.all(
        allTransactions.map(tx =>
          library.getBlock(tx.blockNumber).then(block => block.timestamp)
        )
      );

      // 添加时间戳
      allTransactions.forEach((tx, index) => {
        tx.timestamp = timestamps[index];
      });

      // 按时间戳排序
      allTransactions.sort((a, b) => b.timestamp - a.timestamp);

      // 应用过滤器
      let filteredTransactions = allTransactions;
      
      if (filters.dateRange) {
        const [startDate, endDate] = filters.dateRange;
        filteredTransactions = filteredTransactions.filter(tx => {
          const txDate = moment.unix(tx.timestamp);
          return txDate.isBetween(startDate, endDate, 'day', '[]');
        });
      }

      if (filters.type !== 'all') {
        filteredTransactions = filteredTransactions.filter(tx => tx.type === filters.type);
      }

      if (filters.status !== 'all') {
        filteredTransactions = filteredTransactions.filter(tx => tx.status === filters.status);
      }

      setTransactions(filteredTransactions);
    } catch (error) {
      console.error('加载交易记录失败:', error);
      message.error('加载交易记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (library) {
      loadTransactions();
    }
  }, [library, filters]);

  const columns = [
    {
      title: '交易哈希',
      dataIndex: 'hash',
      key: 'hash',
      render: (hash) => (
        <a href={`https://bscscan.com/tx/${hash}`} target="_blank" rel="noopener noreferrer">
          {hash.slice(0, 8)}...{hash.slice(-6)}
        </a>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const typeColors = {
          mint: 'green',
          stake: 'blue',
          unstake: 'orange',
          reward: 'gold'
        };
        const typeLabels = {
          mint: '铸造',
          stake: '质押',
          unstake: '解押',
          reward: '收益'
        };
        return <Tag color={typeColors[type]}>{typeLabels[type]}</Tag>;
      }
    },
    {
      title: '发送方',
      dataIndex: 'from',
      key: 'from',
      render: (address) => address && (
        <a href={`https://bscscan.com/address/${address}`} target="_blank" rel="noopener noreferrer">
          {address.slice(0, 6)}...{address.slice(-4)}
        </a>
      )
    },
    {
      title: '接收方',
      dataIndex: 'to',
      key: 'to',
      render: (address) => address && (
        <a href={`https://bscscan.com/address/${address}`} target="_blank" rel="noopener noreferrer">
          {address.slice(0, 6)}...{address.slice(-4)}
        </a>
      )
    },
    {
      title: 'Token ID',
      dataIndex: 'tokenId',
      key: 'tokenId'
    },
    {
      title: '数量',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => amount && `${amount} ZONE`
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => moment.unix(timestamp).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'success' ? 'green' : 'red'}>
          {status === 'success' ? '成功' : '失败'}
        </Tag>
      )
    }
  ];

  return (
    <div>
      <Card>
        <Title level={2}>交易记录</Title>
        
        <Space style={{ marginBottom: 16 }}>
          <RangePicker
            onChange={(dates) => {
              setFilters(prev => ({ ...prev, dateRange: dates }));
            }}
          />
          
          <Select
            defaultValue="all"
            style={{ width: 120 }}
            onChange={(value) => {
              setFilters(prev => ({ ...prev, type: value }));
            }}
          >
            <Option value="all">全部类型</Option>
            <Option value="mint">铸造</Option>
            <Option value="stake">质押</Option>
            <Option value="unstake">解押</Option>
            <Option value="reward">收益</Option>
          </Select>

          <Select
            defaultValue="all"
            style={{ width: 120 }}
            onChange={(value) => {
              setFilters(prev => ({ ...prev, status: value }));
            }}
          >
            <Option value="all">全部状态</Option>
            <Option value="success">成功</Option>
            <Option value="failed">失败</Option>
          </Select>

          <Button type="primary" onClick={loadTransactions}>
            刷新
          </Button>
        </Space>

        <Table
          loading={loading}
          dataSource={transactions}
          columns={columns}
          rowKey="hash"
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>
    </div>
  );
};

export default TransactionManagement;
