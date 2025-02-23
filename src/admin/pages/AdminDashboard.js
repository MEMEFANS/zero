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
  LogoutOutlined,
  UserOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import NFTManagement from './NFTManagement';
import UserManagement from './UserManagement';
import SystemSettings from './SystemSettings';
import TransactionManagement from './TransactionManagement';
import OperationLogs from './OperationLogs';
import Analytics from './Analytics';
import { MYSTERY_BOX_ABI } from '../../contracts/MysteryBoxABI';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const ADMIN_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN_ROLE"));

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { account, library, deactivate } = useWeb3React();
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalNFTs: 0,
    totalTransactions: 0
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

  const menuItems = [
    {
      key: '',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: 'nft',
      icon: <ShoppingOutlined />,
      label: 'NFT管理',
    },
    {
      key: 'users',
      icon: <TeamOutlined />,
      label: '用户管理',
    },
    {
      key: 'transactions',
      icon: <FileTextOutlined />,
      label: '交易管理',
    },
    {
      key: 'logs',
      icon: <FileTextOutlined />,
      label: '操作日志',
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: '数据分析',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  useEffect(() => {
    if (!account) {
      message.error('请先连接钱包');
      return;
    }
    checkAdminRole();
    loadDashboardData();
  }, [account]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(
        process.env.REACT_APP_MYSTERY_BOX_ADDRESS,
        MYSTERY_BOX_ABI,
        library.getSigner()
      );

      const [nftStats, tradeStats] = await Promise.all([
        contract.getNFTStats(),
        contract.getTradeStats(),
      ]);

      setStats({
        totalNFTs: nftStats.totalSupply.toString(),
        totalTransactions: tradeStats.totalTrades.toString(),
      });
    } catch (error) {
      console.error('加载数据失败:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (key) => {
    navigate(key);
  };

  if (!isAdmin) {
    return <Spin spinning={loading} />;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)' }} />
        <Menu
          theme="dark"
          selectedKeys={[location.pathname.split('/')[2] || '']}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: '#fff' }}>
          <Row justify="end" align="middle" style={{ height: '100%', paddingRight: 24 }}>
            <Col>
              <Button icon={<LogoutOutlined />} onClick={() => {
                deactivate();
                navigate('/');
              }}>
                退出
              </Button>
            </Col>
          </Row>
        </Header>
        <Content style={{ margin: '16px' }}>
          <div style={{ padding: 24, background: '#fff', minHeight: 360 }}>
            <Spin spinning={loading}>
              <Routes>
                <Route path="" element={
                  <div>
                    <Title level={2}>仪表盘</Title>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Card>
                          <Statistic title="总NFT数量" value={stats.totalNFTs} />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card>
                          <Statistic title="总交易数" value={stats.totalTransactions} />
                        </Card>
                      </Col>
                    </Row>
                  </div>
                } />
                <Route path="nft/*" element={<NFTManagement />} />
                <Route path="users/*" element={<UserManagement />} />
                <Route path="transactions/*" element={<TransactionManagement />} />
                <Route path="logs/*" element={<OperationLogs />} />
                <Route path="analytics/*" element={<Analytics />} />
                <Route path="settings/*" element={<SystemSettings />} />
              </Routes>
            </Spin>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminDashboard;
