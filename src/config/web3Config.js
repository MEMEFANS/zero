import { ethers } from 'ethers';

// BSC RPC节点列表
const RPC_URLS = [
    // 主节点 - QuickNode
    "https://side-falling-ensemble.bsc.quiknode.pro/049fcfd0e81b7b299018b5774557ae1c0d4c9110",
    // 备用节点
    "https://bsc-dataseed1.binance.org",
    "https://bsc-dataseed2.binance.org",
    "https://bsc-dataseed3.binance.org",
    "https://bsc-dataseed4.binance.org"
];

let currentRpcIndex = 0;
let lastFailTime = 0;
const RETRY_INTERVAL = 5000; // 5秒后重试失败的节点

// 获取下一个可用的RPC节点
const getNextRpcUrl = () => {
    currentRpcIndex = (currentRpcIndex + 1) % RPC_URLS.length;
    return RPC_URLS[currentRpcIndex];
};

// 创建provider实例
const createProvider = (rpcUrl) => {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    provider.on("error", async (error) => {
        console.warn(`RPC节点连接错误: ${error.message}`);
        if (Date.now() - lastFailTime > RETRY_INTERVAL) {
            lastFailTime = Date.now();
            // 切换到下一个节点
            const nextRpcUrl = getNextRpcUrl();
            console.log(`切换到备用节点: ${nextRpcUrl}`);
            return createProvider(nextRpcUrl);
        }
    });
    return provider;
};

// 导出provider获取函数
export const getProvider = () => {
    return createProvider(RPC_URLS[currentRpcIndex]);
};
