import React, { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import {
  Table,
  Button,
  Input,
  Select,
  Modal,
  message,
  Card,
  Tabs,
  Form,
  InputNumber,
  Switch,
  Spin,
  Typography,
  Space,
  Popconfirm
} from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { MYSTERY_BOX_ABI } from '../../contracts/MysteryBoxABI';

const { Title } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const NFT_RARITY = ['N', 'R', 'SR', 'SSR'];

const NFTManagement = () => {
  const { account, library } = useWeb3React();
  const [loading, setLoading] = useState(false);
  const [nftData, setNftData] = useState([]);
  const [rarityStats, setRarityStats] = useState({});
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showRarityModal, setShowRarityModal] = useState(false);
  const [batchActionVisible, setBatchActionVisible] = useState(false);
  
  // 表单数据
  const [form] = Form.useForm();
  const [rarityForm] = Form.useForm();
  const [batchActionForm] = Form.useForm();

  // 加载NFT数据
  const loadNFTData = async () => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(
        process.env.REACT_APP_MYSTERY_BOX_ADDRESS,
        MYSTERY_BOX_ABI,
        library.getSigner()
      );

      // 获取所有NFT
      const totalSupply = await contract._tokenIdCounter();
      const nfts = [];
      const stats = { N: 0, R: 0, SR: 0, SSR: 0 };

      for (let i = 0; i < totalSupply; i++) {
        if (await contract._exists(i)) {
          const nft = await contract.getNFTAttributes(i);
          nfts.push({
            id: i,
            rarity: NFT_RARITY[nft.rarity],
            power: nft.power.toString(),
            dailyReward: ethers.utils.formatEther(nft.dailyReward),
            maxReward: ethers.utils.formatEther(nft.maxReward),
            minedAmount: ethers.utils.formatEther(nft.minedAmount),
            isStaked: nft.isStaked
          });
          stats[NFT_RARITY[nft.rarity]]++;
        }
      }

      setNftData(nfts);
      setRarityStats(stats);
    } catch (error) {
      message.error('加载NFT数据失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 批量操作模态框
  const BatchActionModal = () => {
    const handleBatchAction = async (values) => {
      try {
        setLoading(true);
        const contract = new ethers.Contract(
          process.env.REACT_APP_MYSTERY_BOX_ADDRESS,
          MYSTERY_BOX_ABI,
          library.getSigner()
        );

        const action = values.action;
        const params = values.params || {};

        // 批量执行操作
        const tx = await contract.batchUpdateNFTs(
          selectedNFTs,
          action,
          JSON.stringify(params)
        );

        await tx.wait();
        message.success('批量操作成功');
        loadNFTData();
        setBatchActionVisible(false);
      } catch (error) {
        console.error('批量操作失败:', error);
        message.error('批量操作失败');
      } finally {
        setLoading(false);
      }
    };

    return (
      <Modal
        title="批量操作"
        visible={batchActionVisible}
        onCancel={() => setBatchActionVisible(false)}
        footer={null}
      >
        <Form
          form={batchActionForm}
          onFinish={handleBatchAction}
          layout="vertical"
        >
          <Form.Item
            name="action"
            label="操作类型"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="updatePrice">更新价格</Option>
              <Option value="updateRarity">更新稀有度</Option>
              <Option value="updateStakingRewards">更新质押收益</Option>
              <Option value="lock">锁定</Option>
              <Option value="unlock">解锁</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.action !== currentValues.action}
          >
            {({ getFieldValue }) => {
              const action = getFieldValue('action');
              if (action === 'updatePrice' || action === 'updateStakingRewards') {
                return (
                  <Form.Item
                    name={['params', 'value']}
                    label="数值"
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={0} step={0.1} />
                  </Form.Item>
                );
              }
              if (action === 'updateRarity') {
                return (
                  <Form.Item
                    name={['params', 'rarity']}
                    label="稀有度"
                    rules={[{ required: true }]}
                  >
                    <Select>
                      <Option value="common">普通</Option>
                      <Option value="rare">稀有</Option>
                      <Option value="epic">史诗</Option>
                      <Option value="legendary">传说</Option>
                    </Select>
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                确认
              </Button>
              <Button onClick={() => setBatchActionVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    );
  };

  // 批量更新NFT
  const batchUpdateNFTs = async (values) => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(
        process.env.REACT_APP_MYSTERY_BOX_ADDRESS,
        MYSTERY_BOX_ABI,
        library.getSigner()
      );

      const dailyRewards = selectedNFTs.map(() => 
        ethers.utils.parseEther(values.dailyReward.toString())
      );

      const tx = await contract.batchUpdateNFTDailyReward(
        selectedNFTs,
        dailyRewards
      );
      await tx.wait();

      message.success('批量更新成功');
      setShowBatchModal(false);
      loadNFTData();
    } catch (error) {
      message.error('批量更新失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 更新稀有度配置
  const updateRarityConfig = async (values) => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(
        process.env.REACT_APP_MYSTERY_BOX_ADDRESS,
        MYSTERY_BOX_ABI,
        library.getSigner()
      );

      const tx = await contract.updateRarityDailyReward(
        NFT_RARITY.indexOf(values.rarity),
        ethers.utils.parseEther(values.dailyReward.toString()),
        values.applyToExisting
      );
      await tx.wait();

      if (values.maxReward) {
        const tx2 = await contract.updateRarityMaxReward(
          NFT_RARITY.indexOf(values.rarity),
          ethers.utils.parseEther(values.maxReward.toString()),
          values.applyToExisting
        );
        await tx2.wait();
      }

      message.success('更新稀有度配置成功');
      setShowRarityModal(false);
      loadNFTData();
    } catch (error) {
      message.error('更新稀有度配置失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 表格列配置
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '稀有度', dataIndex: 'rarity', key: 'rarity' },
    { title: '算力', dataIndex: 'power', key: 'power' },
    { title: '日收益', dataIndex: 'dailyReward', key: 'dailyReward' },
    { title: '最大收益', dataIndex: 'maxReward', key: 'maxReward' },
    { title: '已挖矿量', dataIndex: 'minedAmount', key: 'minedAmount' },
    { title: '质押状态', dataIndex: 'isStaked', key: 'isStaked', 
      render: (isStaked) => isStaked ? '已质押' : '未质押' 
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button onClick={() => {
            form.setFieldsValue({
              dailyReward: record.dailyReward,
              maxReward: record.maxReward
            });
            setSelectedNFTs([record.id]);
            setShowBatchModal(true);
          }}>
            编辑
          </Button>
        </Space>
      )
    }
  ];

  useEffect(() => {
    if (account && library) {
      loadNFTData();
    }
  }, [account, library]);

  return (
    <Spin spinning={loading}>
      <div style={{ padding: 24 }}>
        <Title level={2}>NFT管理</Title>

        <div style={{ marginBottom: 24 }}>
          <Card title="数据概览">
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              {NFT_RARITY.map(rarity => (
                <div key={rarity}>
                  <Title level={4}>{rarity}级</Title>
                  <div>数量：{rarityStats[rarity] || 0}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button
              type="primary"
              onClick={() => setShowRarityModal(true)}
            >
              更新稀有度配置
            </Button>
            <Button
              type="primary"
              disabled={selectedNFTs.length === 0}
              onClick={() => setBatchActionVisible(true)}
            >
              批量操作 ({selectedNFTs.length})
            </Button>
            <Button
              disabled={selectedNFTs.length === 0}
              onClick={() => setShowBatchModal(true)}
            >
              批量更新 ({selectedNFTs.length})
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={nftData}
          rowKey="id"
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedNFTs,
            onChange: setSelectedNFTs,
          }}
        />

        {/* 批量更新弹窗 */}
        <Modal
          title="批量更新NFT"
          open={showBatchModal}
          onOk={() => form.submit()}
          onCancel={() => setShowBatchModal(false)}
        >
          <Form
            form={form}
            onFinish={batchUpdateNFTs}
            layout="vertical"
          >
            <Form.Item
              name="dailyReward"
              label="每日收益"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} step={0.1} />
            </Form.Item>
            <Form.Item
              name="maxReward"
              label="最大收益"
            >
              <InputNumber min={0} step={1} />
            </Form.Item>
          </Form>
        </Modal>

        {/* 稀有度配置弹窗 */}
        <Modal
          title="更新稀有度配置"
          open={showRarityModal}
          onOk={() => rarityForm.submit()}
          onCancel={() => setShowRarityModal(false)}
        >
          <Form
            form={rarityForm}
            onFinish={updateRarityConfig}
            layout="vertical"
          >
            <Form.Item
              name="rarity"
              label="稀有度"
              rules={[{ required: true }]}
            >
              <Select>
                {NFT_RARITY.map(r => (
                  <Option key={r} value={r}>{r}级</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="dailyReward"
              label="每日收益"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} step={0.1} />
            </Form.Item>
            <Form.Item
              name="maxReward"
              label="最大收益"
            >
              <InputNumber min={0} step={1} />
            </Form.Item>
            <Form.Item
              name="applyToExisting"
              label="应用到现有NFT"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Form>
        </Modal>

        <BatchActionModal />
      </div>
    </Spin>
  );
};

export default NFTManagement;
