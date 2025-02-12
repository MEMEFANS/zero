import React, { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import {
  Layout,
  Menu,
  Button,
  Card,
  Statistic,
  Row,
  Col,
  Typography,
  message,
  Spin
} from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { useNavigate, Routes, Route } from 'react-router-dom';
import NFTManagement from './NFTManagement';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const ADMIN_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN_ROLE"));

const AdminDashboard = () => {
  const { account, library, deactivate } = useWeb3React();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalNFTs: 0,
    totalStaked: 0,
    totalRewards: 0
  });

  // 检查管理员权限
  const checkAdminRole = async () => {
    try {
      const contract = new ethers.Contract(
        process.env.REACT_APP_MYSTERY_BOX_ADDRESS,
        MYSTERY_BOX_ABI,
        library.getSigner()
      );

      const hasRole = await contract.hasRole(ADMIN_ROLE, account);
      setIsAdmin(hasRole);

      if (!hasRole) {
        message.error('您没有管理员权限');
        navigate('/');
      }
    } catch (error) {
      console.error('检查权限失败:', error);
      message.error('检查权限失败');
      navigate('/');
    }
  };

  // 加载统计数据
  const loadStats = async () => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(
        process.env.REACT_APP_MYSTERY_BOX_ADDRESS,
        MYSTERY_BOX_ABI,
        library.getSigner()
      );

      const [totalNFTs, totalStaked, totalRewards] = await Promise.all([
        contract._tokenIdCounter(),
        contract.getTotalStaked(),
        contract.getTotalRewards()
      ]);

      setStats({
        totalNFTs: totalNFTs.toString(),
        totalStaked: totalStaked.toString(),
        totalRewards: ethers.utils.formatEther(totalRewards)
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account && library) {
      checkAdminRole();
      loadStats();
    }
  }, [account, library]);

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘',
      onClick: () => navigate('/admin')
    },
    {
      key: 'nft',
      icon: <TeamOutlined />,
      label: 'NFT管理',
      onClick: () => navigate('/admin/nft')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      onClick: () => navigate('/admin/settings')
    }
  ];

  if (!isAdmin) {
    return <Spin spinning={loading} />;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)' }} />
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['dashboard']}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 16px', background: '#fff', display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            icon={<LogoutOutlined />}
            onClick={() => {
              deactivate();
              navigate('/');
            }}
          >
            退出
          </Button>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
          <Routes>
            <Route
              path="/"
              element={
                <div>
                  <Title level={2}>系统概览</Title>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Card>
                        <Statistic
                          title="总NFT数量"
                          value={stats.totalNFTs}
                          loading={loading}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card>
                        <Statistic
                          title="质押中NFT"
                          value={stats.totalStaked}
                          loading={loading}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card>
                        <Statistic
                          title="总收益发放"
                          value={stats.totalRewards}
                          loading={loading}
                          suffix="ZONE"
                        />
                      </Card>
                    </Col>
                  </Row>
                </div>
              }
            />
            <Route path="/nft" element={<NFTManagement />} />
            <Route path="/settings" element={<div>系统设置</div>} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminDashboard;
