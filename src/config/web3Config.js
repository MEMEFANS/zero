import { ethers } from 'ethers';

// BSC QuickNode RPC
const RPC_URL = "https://side-falling-ensemble.bsc.quiknode.pro/049fcfd0e81b7b299018b5774557ae1c0d4c9110";

export const getProvider = () => {
    return new ethers.providers.JsonRpcProvider(RPC_URL);
};
