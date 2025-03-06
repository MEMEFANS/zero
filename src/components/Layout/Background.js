import React from 'react';
import PropTypes from 'prop-types';

const Background = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1E293B]">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      <div className="relative">{children}</div>
    </div>
  );
};

Background.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Background;
