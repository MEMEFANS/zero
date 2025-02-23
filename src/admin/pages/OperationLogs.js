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
  Select,
  Button,
  message
} from 'antd';
import moment from 'moment';
import { MYSTERY_BOX_ABI } from '../../contracts/MysteryBoxABI';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// 定义操作类型
const OPERATION_TYPES = {
  OPERATION: '操作日志',
  BATCH: '批量操作',
  NFT_UPDATE: '更新NFT',
  ROLE_UPDATE: '权限更新',
  SYSTEM_CONFIG: '系统配置',
  REWARD_UPDATE: '收益更新'
};

const OperationLogs = () => {
  const { library, account } = useWeb3React();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    dateRange: null,
    type: 'all',
    operator: 'all'
  });

  // 加载日志数据
  const loadLogs = async () => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(
        process.env.REACT_APP_MYSTERY_BOX_ADDRESS,
        MYSTERY_BOX_ABI,
        library.getSigner()
      );

      // 获取操作日志事件
      const [
        operationLogs,
        batchOperations,
        roleEvents,
        configEvents,
        nftUpdateEvents
      ] = await Promise.all([
        contract.queryFilter(contract.filters.OperationLog()),
        contract.queryFilter(contract.filters.BatchOperation()),
        contract.queryFilter(contract.filters.RoleGranted()),
        contract.queryFilter(contract.filters.ConfigUpdated()),
        contract.queryFilter(contract.filters.NFTUpdated())
      ]);

      // 处理事件数据
      const allLogs = [
        ...operationLogs.map(event => ({
          hash: event.transactionHash,
          operator: event.args.operator,
          action: event.args.action,
          details: event.args.details,
          timestamp: event.args.timestamp.toNumber(),
          type: 'OPERATION'
        })),
        ...batchOperations.map(event => ({
          hash: event.transactionHash,
          operator: event.args.operator,
          action: event.args.action,
          details: `批量操作 ${event.args.tokenIds.length} 个NFT: ${event.args.params}`,
          timestamp: event.args.timestamp.toNumber(),
          type: 'BATCH'
        })),
        ...roleEvents.map(event => ({
          hash: event.transactionHash,
          type: 'ROLE_UPDATE',
          operator: event.args.account,
          target: event.args.role,
          details: `授予角色: ${event.args.role}`,
          timestamp: null,
          blockNumber: event.blockNumber
        })),
        ...configEvents.map(event => ({
          hash: event.transactionHash,
          type: 'SYSTEM_CONFIG',
          operator: event.args.operator,
          target: 'System',
          details: `更新配置: ${event.args.key} = ${event.args.value}`,
          timestamp: null,
          blockNumber: event.blockNumber
        })),
        ...nftUpdateEvents.map(event => ({
          hash: event.transactionHash,
          type: 'NFT_UPDATE',
          operator: event.args.operator,
          target: `NFT #${event.args.tokenId}`,
          details: `更新NFT属性: ${event.args.attribute}`,
          timestamp: null,
          blockNumber: event.blockNumber
        }))
      ];

      // 获取区块时间戳
      const timestamps = await Promise.all(
        allLogs.filter(log => log.timestamp === null).map(log =>
          library.getBlock(log.blockNumber).then(block => block.timestamp)
        )
      );

      // 添加时间戳
      allLogs.forEach((log, index) => {
        if (log.timestamp === null) {
          log.timestamp = timestamps[index];
        }
      });

      // 按时间戳排序
      allLogs.sort((a, b) => b.timestamp - a.timestamp);

      // 应用过滤器
      let filteredLogs = allLogs;
      
      if (filters.dateRange) {
        const [startDate, endDate] = filters.dateRange;
        filteredLogs = filteredLogs.filter(log => {
          const logDate = moment.unix(log.timestamp);
          return logDate.isBetween(startDate, endDate, 'day', '[]');
        });
      }

      if (filters.type !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.type === filters.type);
      }

      if (filters.operator !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.operator === filters.operator);
      }

      setLogs(filteredLogs);
    } catch (error) {
      console.error('加载日志失败:', error);
      message.error('加载日志失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (library) {
      loadLogs();
    }
  }, [library, filters]);

  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => moment.unix(timestamp).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => a.timestamp - b.timestamp
    },
    {
      title: '操作类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={
          type === 'ROLE_UPDATE' ? 'red' :
          type === 'SYSTEM_CONFIG' ? 'blue' :
          type === 'NFT_UPDATE' ? 'green' :
          type === 'BATCH' ? 'orange' :
          type === 'OPERATION' ? 'purple' :
          'default'
        }>
          {OPERATION_TYPES[type] || type}
        </Tag>
      )
    },
    {
      title: '操作者',
      dataIndex: 'operator',
      key: 'operator',
      render: (address) => (
        <a href={`https://bscscan.com/address/${address}`} target="_blank" rel="noopener noreferrer">
          {address.slice(0, 6)}...{address.slice(-4)}
        </a>
      )
    },
    {
      title: '操作对象',
      dataIndex: 'target',
      key: 'target'
    },
    {
      title: '详细信息',
      dataIndex: 'details',
      key: 'details'
    },
    {
      title: '交易哈希',
      dataIndex: 'hash',
      key: 'hash',
      render: (hash) => (
        <a href={`https://bscscan.com/tx/${hash}`} target="_blank" rel="noopener noreferrer">
          {hash.slice(0, 6)}...{hash.slice(-4)}
        </a>
      )
    }
  ];

  return (
    <div>
      <Card>
        <Title level={2}>操作日志</Title>
        
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
            {Object.entries(OPERATION_TYPES).map(([key, label]) => (
              <Option key={key} value={key}>{label}</Option>
            ))}
          </Select>

          <Button type="primary" onClick={loadLogs}>
            刷新
          </Button>
        </Space>

        <Table
          loading={loading}
          dataSource={logs}
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

export default OperationLogs;
