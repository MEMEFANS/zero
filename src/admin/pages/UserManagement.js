import React, { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import {
  Table,
  Button,
  Card,
  message,
  Modal,
  Form,
  Input,
  Switch,
  Space,
  Typography,
  Tag
} from 'antd';
import { MYSTERY_BOX_ABI } from '../../contracts/MysteryBoxABI';

const { Title } = Typography;

const UserManagement = () => {
  const { library } = useWeb3React();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 加载用户数据
  const loadUsers = async () => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(
        process.env.REACT_APP_MYSTERY_BOX_ADDRESS,
        MYSTERY_BOX_ABI,
        library.getSigner()
      );

      // 获取用户统计数据
      const stats = await contract.getUserStats();
      const users = [];
      
      for (let i = 0; i < stats.userAddresses.length; i++) {
        const address = stats.userAddresses[i];
        users.push({
          address,
          nftCount: stats.nftCounts[i].toString(),
          totalMinted: stats.totalMinted[i].toString(),
          totalTraded: stats.totalTraded[i].toString(),
          isActive: stats.isActive[i]
        });
      }

      setUsers(users);
    } catch (error) {
      console.error('加载用户数据失败:', error);
      message.error('加载用户数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 更新用户状态
  const updateUserStatus = async (address, isActive) => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(
        process.env.REACT_APP_MYSTERY_BOX_ADDRESS,
        MYSTERY_BOX_ABI,
        library.getSigner()
      );

      const tx = await contract.updateUserStatus(address, isActive);
      await tx.wait();
      
      message.success('更新用户状态成功');
      loadUsers();
    } catch (error) {
      console.error('更新用户状态失败:', error);
      message.error('更新用户状态失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (library) {
      loadUsers();
    }
  }, [library]);

  const columns = [
    {
      title: '用户地址',
      dataIndex: 'address',
      key: 'address',
      render: (text) => <a href={`https://bscscan.com/address/${text}`} target="_blank" rel="noopener noreferrer">{text}</a>
    },
    {
      title: 'NFT数量',
      dataIndex: 'nftCount',
      key: 'nftCount',
    },
    {
      title: '已铸造数量',
      dataIndex: 'totalMinted',
      key: 'totalMinted',
    },
    {
      title: '交易数量',
      dataIndex: 'totalTraded',
      key: 'totalTraded',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '活跃' : '禁用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            type={record.isActive ? 'danger' : 'primary'}
            onClick={() => updateUserStatus(record.address, !record.isActive)}
          >
            {record.isActive ? '禁用' : '启用'}
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card>
        <Title level={2}>用户管理</Title>
        <Table
          loading={loading}
          dataSource={users}
          columns={columns}
          rowKey="address"
        />
      </Card>
    </div>
  );
};

export default UserManagement;
