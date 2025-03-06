import React, { useEffect, useState } from 'react';
import { notification, Button, Typography, Space } from 'antd';
import { CheckCircleOutlined, LoadingOutlined, LinkOutlined } from '@ant-design/icons';
import { useWeb3React } from '@web3-react/core';

const { Text, Link } = Typography;

const TransactionNotification = ({ hash, description, onComplete }) => {
  const { library } = useWeb3React();
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    if (!hash || !library) return;

    const checkTransaction = async () => {
      try {
        const receipt = await library.getTransactionReceipt(hash);
        if (receipt) {
          setStatus(receipt.status ? 'success' : 'failed');
          if (receipt.status && onComplete) {
            onComplete(receipt);
          }
        }
      } catch (error) {
        console.error('Transaction check failed:', error);
        setStatus('failed');
      }
    };

    const interval = setInterval(checkTransaction, 2000);
    return () => clearInterval(interval);
  }, [hash, library, onComplete]);

  useEffect(() => {
    if (!hash) return;

    const getExplorerLink = () => {
      const chainId = library?.network?.chainId;
      const baseUrl = chainId === 56 ? 'https://bscscan.com' : 'https://testnet.bscscan.com';
      return `${baseUrl}/tx/${hash}`;
    };

    notification.open({
      key: hash,
      message: '交易进行中',
      description: (
        <Space direction="vertical">
          <Text>{description}</Text>
          <Space>
            <Link href={getExplorerLink()} target="_blank">
              查看交易详情 <LinkOutlined />
            </Link>
            {status === 'pending' && (
              <Text type="secondary">
                <LoadingOutlined /> 等待确认
              </Text>
            )}
            {status === 'success' && (
              <Text type="success">
                <CheckCircleOutlined /> 交易成功
              </Text>
            )}
            {status === 'failed' && (
              <Text type="danger">
                交易失败
              </Text>
            )}
          </Space>
        </Space>
      ),
      duration: status === 'pending' ? 0 : 4.5,
      icon: status === 'pending' ? <LoadingOutlined /> : 
            status === 'success' ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> :
            null,
      btn: status === 'pending' && (
        <Button size="small" onClick={() => window.open(getExplorerLink(), '_blank')}>
          查看详情
        </Button>
      )
    });
  }, [hash, status, library, description]);

  return null;
};

export default TransactionNotification;
