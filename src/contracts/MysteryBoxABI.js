export const MYSTERY_BOX_ABI = [
  {
    "inputs": [],
    "name": "getNFTStats",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "totalSupply",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalMinted",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalBurned",
            "type": "uint256"
          }
        ],
        "internalType": "struct MysteryBoxFacet.NFTStats",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTradeStats",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "totalTrades",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalVolume",
            "type": "uint256"
          }
        ],
        "internalType": "struct MysteryBoxFacet.TradeStats",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256[]",
        "name": "tokenIds",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256[]",
        "name": "dailyRewards",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256[]",
        "name": "maxRewards",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256[]",
        "name": "rarities",
        "type": "uint256[]"
      }
    ],
    "name": "batchUpdateNFTs",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "operation",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "details",
        "type": "string"
      }
    ],
    "name": "logOperation",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
