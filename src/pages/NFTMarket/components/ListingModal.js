import React from 'react';
import { Modal, Input, Button, Form } from 'antd';
import { motion } from 'framer-motion';
import { TagOutlined } from '@ant-design/icons';

const ListingModal = ({ nft, visible, onClose, onConfirm }) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onConfirm(values.price);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-lg">
          <TagOutlined className="text-blue-500" />
          <span>上架 NFT #{nft?.id}</span>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={400}
      destroyOnClose
      className="nft-modal"
    >
      <div className="flex flex-col items-center">
        <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-blue-500/20 mb-6">
          <img
            src={nft?.imageURI || '/placeholder.png'}
            alt={`NFT #${nft?.id}`}
            className="w-full h-full object-contain bg-[#1A2333]"
          />
        </div>
        
        <Form form={form} layout="vertical" className="w-full">
          <Form.Item
            name="price"
            label={<span className="text-[#F3BA2F]">价格 (BNB)</span>}
            rules={[
              { required: true, message: '请输入价格' },
              { pattern: /^[0-9]*\.?[0-9]+$/, message: '请输入有效的数字' }
            ]}
          >
            <Input
              placeholder="请输入价格"
              prefix={
                <img
                  src="/images/partners/binance.png"
                  alt="BNB"
                  className="w-5 h-5"
                />
              }
              className="h-10 bg-[#1A2333] border-[#2D3748] hover:border-[#F3BA2F] focus:border-[#F3BA2F] text-[#F3BA2F]"
              style={{
                caretColor: '#F3BA2F',
                '::placeholder': {
                  color: '#4A5568'
                }
              }}
            />
          </Form.Item>
        </Form>

        <div className="flex gap-3 justify-end w-full mt-6">
          <Button 
            onClick={handleCancel}
            className="hover:bg-gray-700 hover:border-gray-600"
          >
            取消
          </Button>
          <Button
            type="primary"
            onClick={handleOk}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-none"
          >
            确认上架
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ListingModal;
