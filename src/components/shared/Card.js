import React from 'react';
import PropTypes from 'prop-types';

const Card = ({ 
  children, 
  className = '',
  onClick,
  hover = true
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-[#1e2839] 
        rounded-xl 
        border border-gray-700
        ${hover ? 'hover:border-blue-500/40 transition-colors duration-200' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func,
  hover: PropTypes.bool
};

export default React.memo(Card);
