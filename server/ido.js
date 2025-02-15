const express = require('express');
const Web3 = require('web3');
const router = express.Router();

// 连接到 BSC
const web3 = new Web3('https://side-falling-ensemble.bsc.quiknode.pro/049fcfd0e81b7b299018b5774557ae1c0d4c9110');

// 内存缓存
const contributionsCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 获取用户参与记录
router.get('/contributions/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const receivingAddress = '0x82fa012F68420B7e30Eb48eF321d599343902e11';

        // 检查缓存
        const cached = contributionsCache.get(address);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return res.json(cached.data);
        }

        // 获取当前区块
        const currentBlock = await web3.eth.getBlockNumber();
        const fromBlock = currentBlock - 10000;

        // 获取转账记录
        const transfers = await web3.eth.getPastLogs({
            fromBlock,
            toBlock: 'latest',
            topics: [
                web3.utils.sha3('Transfer(address,address,uint256)'),
                web3.utils.padLeft(address.toLowerCase(), 64),
                web3.utils.padLeft(receivingAddress.toLowerCase(), 64)
            ]
        });

        // 计算总金额
        let totalAmount = 0;
        for (const transfer of transfers) {
            const value = web3.utils.hexToNumberString(transfer.data);
            totalAmount += parseFloat(web3.utils.fromWei(value));
        }

        const result = {
            contribution: totalAmount,
            expectedTokens: totalAmount * 13000 // DPAP per BNB
        };

        // 更新缓存
        contributionsCache.set(address, {
            timestamp: Date.now(),
            data: result
        });

        res.json(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
