import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { getContract } from '../../../../utils/web3';
import { NFT_MINING_ADDRESS, NFT_MINING_ABI_V2 } from '../../../../constants/contracts';

// 注册 ChartJS 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// 添加延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 添加重试函数
const retryOperation = async (operation, maxRetries = 3, initialDelay = 1000) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (error.message.includes('rate limit') || error.code === 429) {
        // 如果是速率限制错误，增加等待时间
        const waitTime = initialDelay * Math.pow(2, i);
        await delay(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

const RewardsChart = ({ account, provider }) => {
  const [data, setData] = useState({
    labels: [],
    datasets: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadRewardsHistory = async () => {
      if (!account || !provider) return;

      try {
        const contract = getContract(NFT_MINING_ADDRESS, NFT_MINING_ABI_V2, provider);
        
        // 获取最近7天的数据
        const now = Math.floor(Date.now() / 1000);
        const sevenDaysAgo = now - 7 * 24 * 60 * 60;
        const interval = 24 * 60 * 60; // 24小时

        // 使用重试机制获取奖励历史
        const [timestamps, directRewards, teamRewards] = await retryOperation(() => 
          contract.getRewardsHistory(
            account,
            sevenDaysAgo,
            interval
          )
        );

        // 格式化数据
        const labels = timestamps.map(ts => {
          const date = new Date(Number(ts) * 1000);
          return date.toLocaleDateString();
        });

        const formattedData = {
          labels,
          datasets: [
            {
              label: '直推收益',
              data: directRewards.map(r => Number(r) / 1e18),
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: '团队收益',
              data: teamRewards.map(r => Number(r) / 1e18),
              borderColor: 'rgb(255, 159, 64)',
              backgroundColor: 'rgba(255, 159, 64, 0.1)',
              tension: 0.4,
              fill: true
            }
          ]
        };

        setData(formattedData);
        setError(null);
      } catch (err) {
        console.error('Error loading rewards history:', err);
        setError('加载收益历史失败');
      } finally {
        setLoading(false);
      }
    };

    loadRewardsHistory();
  }, [account, provider]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgb(209, 213, 219)'
        }
      },
      title: {
        display: true,
        text: '收益历史',
        color: 'rgb(209, 213, 219)'
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(209, 213, 219, 0.1)'
        },
        ticks: {
          color: 'rgb(209, 213, 219)'
        }
      },
      y: {
        grid: {
          color: 'rgba(209, 213, 219, 0.1)'
        },
        ticks: {
          color: 'rgb(209, 213, 219)'
        }
      }
    }
  };

  if (loading) {
    return <div className="text-gray-400">加载中...</div>;
  }

  if (error) {
    return <div className="text-red-400">{error}</div>;
  }

  return (
    <div className="h-[300px]">
      <Line data={data} options={options} />
    </div>
  );
};

RewardsChart.propTypes = {
  account: PropTypes.string.isRequired,
  provider: PropTypes.object.isRequired
};

export default RewardsChart;
