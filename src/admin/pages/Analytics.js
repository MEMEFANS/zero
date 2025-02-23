import React, { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import {
  Card,
  Row,
  Col,
  Typography,
  DatePicker,
  Spin,
  Empty,
  Select,
  Space,
  message
} from 'antd';
import {
  Line,
  Bar,
  Pie
} from '@ant-design/charts';
import moment from 'moment';
import { MYSTERY_BOX_ABI } from '../../contracts/MysteryBoxABI';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const Analytics = () => {
  const { library } = useWeb3React();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([moment().subtract(30, 'days'), moment()]);
  const [chartType, setChartType] = useState('daily');
  const [data, setData] = useState({
    transactions: [],
    nftStats: [],
    userStats: [],
    rewardStats: []
  });

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(
        process.env.REACT_APP_MYSTERY_BOX_ADDRESS,
        MYSTERY_BOX_ABI,
        library.getSigner()
      );

      const [startDate, endDate] = dateRange;
      
      // 获取NFT统计数据
      const nftStats = await contract.getNFTStats();
      
      // 获取交易统计数据
      const tradeStats = await contract.getTradeStats(
        Math.floor(startDate.valueOf() / 1000),
        Math.floor(endDate.valueOf() / 1000)
      );

      // 处理NFT分布数据
      const nftDistribution = [
        { type: '流通中', value: nftStats.totalSupply.sub(nftStats.stakedCount).sub(nftStats.listedCount).sub(nftStats.burnedCount).toNumber() },
        { type: '已质押', value: nftStats.stakedCount.toNumber() },
        { type: '市场挂单', value: nftStats.listedCount.toNumber() },
        { type: '已销毁', value: nftStats.burnedCount.toNumber() }
      ];

      // 更新状态
      setData({
        nftStats: nftDistribution,
        tradeVolume: ethers.utils.formatEther(tradeStats.tradeVolume),
        tradeCount: tradeStats.tradeCount.toNumber(),
        uniqueTraders: tradeStats.traders.length
      });

    } catch (error) {
      console.error('加载数据失败:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (library) {
      loadData();
    }
  }, [library, dateRange, chartType]);

  // 交易量图表配置
  const transactionConfig = {
    data: data.transactions,
    xField: 'date',
    yField: 'transactions',
    seriesField: 'type',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000
      }
    }
  };

  // NFT分布饼图配置
  const nftDistributionConfig = {
    data: data.nftStats,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} {percentage}'
    },
    interactions: [
      {
        type: 'element-active'
      }
    ]
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space style={{ marginBottom: 24 }}>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
          />
          <Select
            value={chartType}
            onChange={setChartType}
            style={{ width: 120 }}
          >
            <Option value="daily">日</Option>
            <Option value="weekly">周</Option>
            <Option value="monthly">月</Option>
          </Select>
        </Space>

        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card title="交易量趋势">
              {loading ? (
                <Spin />
              ) : data.transactions.length > 0 ? (
                <Line {...transactionConfig} />
              ) : (
                <Empty />
              )}
            </Card>
          </Col>

          <Col span={12}>
            <Card title="NFT分布">
              {loading ? (
                <Spin />
              ) : data.nftStats.length > 0 ? (
                <Pie {...nftDistributionConfig} />
              ) : (
                <Empty />
              )}
            </Card>
          </Col>

          <Col span={12}>
            <Card title="用户活跃度">
              {loading ? (
                <Spin />
              ) : data.transactions.length > 0 ? (
                <Bar
                  data={data.transactions}
                  xField="date"
                  yField="uniqueUsers"
                  label={{
                    position: 'middle',
                    style: {
                      fill: '#FFFFFF',
                      opacity: 0.6
                    }
                  }}
                />
              ) : (
                <Empty />
              )}
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Analytics;
