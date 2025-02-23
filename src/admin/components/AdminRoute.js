import React from 'react';
import { Navigate } from 'react-router-dom';

// AdminRoute component - 保护需要管理员权限的路由
const AdminRoute = ({ children }) => {
  // 检查用户是否已登录并且是管理员
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  // 如果未登录或不是管理员，重定向到登录页面
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  // 如果是管理员且已登录，渲染子组件
  return children;
};

export default AdminRoute;
