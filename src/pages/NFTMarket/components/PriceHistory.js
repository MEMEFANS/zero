import React, { useMemo } from 'react';
import { Line } from '@ant-design/plots';
import { Card, Typography, Empty } from 'antd';
import { formatEther } from 'ethers/lib/utils';

const { Text } = Typography;

const PriceHistory = ({ data }) => {
  const chartData = useMemo(() => {
    if (!data?.length) return [];

    return data.map(item => ({
      timestamp: new Date(item.timestamp * 1000),
      price: parseFloat(formatEther(item.price))
    }));
  }, [data]);

  const config = {
    data: chartData,
    padding: 'auto',
    xField: 'timestamp',
    yField: 'price',
    xAxis: {
      type: 'time',
      tickCount: 5,
      label: {
        formatter: (v) => {
          const date = new Date(v);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }
      }
    },
    yAxis: {
      label: {
        formatter: (v) => `${v} BNB`
      }
    },
    tooltip: {
      formatter: (datum) => {
        return {
          name: '价格',
          value: `${datum.price.toFixed(4)} BNB`
        };
      }
    },
    point: {
      size: 3,
      shape: 'circle',
      style: {
        fill: '#5B8FF9',
        stroke: '#fff',
        lineWidth: 2,
      },
    },
    meta: {
      price: {
        alias: '价格 (BNB)',
      },
      timestamp: {
        alias: '时间',
      },
    },
  };

  if (!data?.length) {
    return (
      <Card title="价格历史" className="mt-4">
        <Empty description="暂无价格历史数据" />
      </Card>
    );
  }

  const latestPrice = chartData[chartData.length - 1]?.price;
  const firstPrice = chartData[0]?.price;
  const priceChange = latestPrice && firstPrice
    ? ((latestPrice - firstPrice) / firstPrice * 100).toFixed(2)
    : 0;

  return (
    <Card 
      title="价格历史" 
      className="mt-4"
      extra={
        <Text type={priceChange > 0 ? 'success' : priceChange < 0 ? 'danger' : 'secondary'}>
          {priceChange > 0 ? '+' : ''}{priceChange}%
        </Text>
      }
    >
      <Line {...config} />
    </Card>
  );
};

export default PriceHistory;
