import React, { useEffect, useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Navigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { Spin, message } from 'antd';

const ADMIN_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("ADMIN_ROLE"));

const AdminRoute = ({ children }) => {
  const { account, library } = useWeb3React();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!account || !library) {
        setLoading(false);
        return;
      }

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
        }
      } catch (error) {
        console.error('检查权限失败:', error);
        message.error('检查权限失败');
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [account, library]);

  if (loading) {
    return <Spin size="large" />;
  }

  if (!account) {
    return <Navigate to="/connect" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
