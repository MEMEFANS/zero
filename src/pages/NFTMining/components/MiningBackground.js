import React from 'react';

const MiningBackground = () => {
  return (
    <div className="absolute inset-0">
      {/* 电路背景 */}
      <div className="absolute inset-0">
        {/* 水平线 */}
        {[...Array(12)].map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute w-full h-[1px] bg-green-500/20"
            style={{ 
              top: `${i * 10}%`,
              transform: i % 2 === 0 ? 'translateX(-20%)' : 'translateX(20%)'
            }}
          >
            {/* 折线 */}
            <div 
              className="absolute right-[30%] w-[100px] h-[1px] bg-green-500/20"
              style={{
                transform: `rotate(${i % 2 === 0 ? 45 : -45}deg)`,
                transformOrigin: i % 2 === 0 ? 'right bottom' : 'right top'
              }}
            />
          </div>
        ))}
        
        {/* 垂直线 */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute h-full w-[1px] bg-green-500/20"
            style={{ 
              left: `${i * 15}%`,
              transform: i % 2 === 0 ? 'translateY(-10%)' : 'translateY(10%)'
            }}
          >
            {/* 交叉点 */}
            {[...Array(4)].map((_, j) => (
              <div
                key={`node-${i}-${j}`}
                className="absolute w-1.5 h-1.5 bg-green-400/30 rounded-full"
                style={{ 
                  top: `${j * 30}%`,
                  left: '-2px',
                  boxShadow: '0 0 4px #22c55e'
                }}
              />
            ))}
          </div>
        ))}

        {/* 流动的粒子 */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-1 h-1 rounded-full bg-green-400/60"
            style={{
              left: `${Math.random() * 100}%`,
              top: '0',
              animation: `flowParticle 4s infinite linear`,
              animationDelay: `${i * 0.6}s`
            }}
          />
        ))}

        {/* 光束效果 */}
        {[...Array(3)].map((_, i) => (
          <div
            key={`beam-${i}`}
            className="absolute h-full w-[2px]"
            style={{
              left: `${30 + i * 20}%`,
              background: 'linear-gradient(to bottom, transparent, #22c55e20, transparent)',
              animation: `lightBeam 3s infinite ease-in-out`,
              animationDelay: `${i * 1}s`
            }}
          />
        ))}
      </div>

      {/* 矿机运行动画 */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-16 bg-green-500/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `mine ${Math.random() * 2 + 1}s infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* 电路板背景 */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50h20l10-10 10 10h20m20 0h20' stroke='%2330FF94' stroke-width='1' fill='none'/%3E%3Cpath d='M50 0v20l10 10-10 10v20m0 20v20' stroke='%2330FF94' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px'
        }}
      />

      {/* 能量波动 */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-green-500/5 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-green-500/5 to-transparent"></div>
      </div>
    </div>
  );
};

export default MiningBackground;
