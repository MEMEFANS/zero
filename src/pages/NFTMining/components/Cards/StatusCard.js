import React from 'react';
import PropTypes from 'prop-types';

const StatusCard = ({ title, value, icon, className = '' }) => {
  return (
    <div className={`relative group ${className}`}>
      <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-green-300 rounded-lg opacity-20 group-hover:opacity-30 transition duration-500 blur"></div>
      <div className="relative bg-[#1A2438]/80 backdrop-blur-sm p-6 rounded-lg border border-green-500/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-400 font-medium">{title}</h3>
          <div className="text-green-400">{icon}</div>
        </div>
        <div className="text-2xl font-bold text-green-400">{value}</div>
      </div>
    </div>
  );
};

StatusCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.element,
  className: PropTypes.string
};

export default StatusCard;
