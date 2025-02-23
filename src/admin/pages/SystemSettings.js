import React, { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Typography,
  Space,
  InputNumber,
  Divider,
  Switch,
  Tabs
} from 'antd';
import { MYSTERY_BOX_ABI } from '../../contracts/MysteryBoxABI';

const { Title } = Typography;
const { TabPane } = Tabs;

const SystemSettings = () => {
  const { library } = useWeb3React();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [rewardsForm] = Form.useForm();

  // 加载系统配置
  const loadSettings = async () => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(
        process.env.REACT_APP_MYSTERY_BOX_ADDRESS,
        MYSTERY_BOX_ABI,
        library.getSigner()
      );

      // 获取当前配置
      const [
        mintPrice,
        maxSupply,
        baseReward,
        stakingEnabled
      ] = await Promise.all([
        contract.mintPrice(),
        contract.maxSupply(),
        contract.baseReward(),
        contract.stakingEnabled()
      ]);

      form.setFieldsValue({
        mintPrice: ethers.utils.formatEther(mintPrice),
        maxSupply: maxSupply.toString(),
        baseReward: ethers.utils.formatEther(baseReward),
        stakingEnabled
      });

    } catch (error) {
      console.error('加载系统配置失败:', error);
      message.error('加载系统配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 更新系统配置
  const updateSettings = async (values) => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(
        process.env.REACT_APP_MYSTERY_BOX_ADDRESS,
        MYSTERY_BOX_ABI,
        library.getSigner()
      );

      // 更新铸造价格
      if (values.mintPrice) {
        const tx = await contract.setMintPrice(
          ethers.utils.parseEther(values.mintPrice.toString())
        );
        await tx.wait();
      }

      // 更新最大供应量
      if (values.maxSupply) {
        const tx = await contract.setMaxSupply(values.maxSupply);
        await tx.wait();
      }

      // 更新基础收益
      if (values.baseReward) {
        const tx = await contract.setBaseReward(
          ethers.utils.parseEther(values.baseReward.toString())
        );
        await tx.wait();
      }

      // 更新质押开关
      const tx = await contract.setStakingEnabled(values.stakingEnabled);
      await tx.wait();

      message.success('更新系统配置成功');
      loadSettings();
    } catch (error) {
      console.error('更新系统配置失败:', error);
      message.error('更新系统配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 更新收益配置
  const updateRewardsSettings = async (values) => {
    try {
      setLoading(true);
      const contract = new ethers.Contract(
        process.env.REACT_APP_MYSTERY_BOX_ADDRESS,
        MYSTERY_BOX_ABI,
        library.getSigner()
      );

      const tx = await contract.updateRewardsConfig(
        ethers.utils.parseEther(values.minReward.toString()),
        ethers.utils.parseEther(values.maxReward.toString()),
        values.rewardInterval
      );
      await tx.wait();

      message.success('更新收益配置成功');
    } catch (error) {
      console.error('更新收益配置失败:', error);
      message.error('更新收益配置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (library) {
      loadSettings();
    }
  }, [library]);

  return (
    <div>
      <Title level={2}>系统设置</Title>
      
      <Tabs defaultActiveKey="1">
        <TabPane tab="基础设置" key="1">
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={updateSettings}
            >
              <Form.Item
                label="铸造价格 (BNB)"
                name="mintPrice"
                rules={[{ required: true, message: '请输入铸造价格' }]}
              >
                <InputNumber
                  style={{ width: '200px' }}
                  min={0}
                  step={0.1}
                  precision={2}
                />
              </Form.Item>

              <Form.Item
                label="最大供应量"
                name="maxSupply"
                rules={[{ required: true, message: '请输入最大供应量' }]}
              >
                <InputNumber
                  style={{ width: '200px' }}
                  min={1}
                  precision={0}
                />
              </Form.Item>

              <Form.Item
                label="基础收益 (ZONE/天)"
                name="baseReward"
                rules={[{ required: true, message: '请输入基础收益' }]}
              >
                <InputNumber
                  style={{ width: '200px' }}
                  min={0}
                  step={0.1}
                  precision={2}
                />
              </Form.Item>

              <Form.Item
                label="启用质押"
                name="stakingEnabled"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  保存设置
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>

        <TabPane tab="收益配置" key="2">
          <Card>
            <Form
              form={rewardsForm}
              layout="vertical"
              onFinish={updateRewardsSettings}
            >
              <Form.Item
                label="最小收益 (ZONE/天)"
                name="minReward"
                rules={[{ required: true, message: '请输入最小收益' }]}
              >
                <InputNumber
                  style={{ width: '200px' }}
                  min={0}
                  step={0.1}
                  precision={2}
                />
              </Form.Item>

              <Form.Item
                label="最大收益 (ZONE/天)"
                name="maxReward"
                rules={[{ required: true, message: '请输入最大收益' }]}
              >
                <InputNumber
                  style={{ width: '200px' }}
                  min={0}
                  step={0.1}
                  precision={2}
                />
              </Form.Item>

              <Form.Item
                label="收益计算间隔 (秒)"
                name="rewardInterval"
                rules={[{ required: true, message: '请输入收益计算间隔' }]}
              >
                <InputNumber
                  style={{ width: '200px' }}
                  min={1}
                  precision={0}
                />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  保存收益配置
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default SystemSettings;
