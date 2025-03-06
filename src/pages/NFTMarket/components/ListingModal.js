import React, { useState } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { ethers } from 'ethers';

const ListingModal = ({ visible, nft, onClose, onConfirm }) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);
      await onConfirm(values.price);
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validatePrice = (_, value) => {
    if (!value) {
      return Promise.reject('请输入价格');
    }
    if (isNaN(value) || value <= 0) {
      return Promise.reject('请输入有效的价格');
    }
    return Promise.resolve();
  };

  return (
    <Modal
      title="上架NFT"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={isSubmitting} 
          onClick={handleSubmit}
        >
          确认上架
        </Button>
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="price"
          label="价格 (BNB)"
          rules={[
            { required: true, message: '请输入价格' },
            { validator: validatePrice }
          ]}
        >
          <Input placeholder="请输入价格" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ListingModal;
