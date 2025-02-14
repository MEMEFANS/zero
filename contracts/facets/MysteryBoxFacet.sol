// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MysteryBoxFacet is ERC721, AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // NFT等级
    enum NFTRarity { N, R, SR, SSR }

    // NFT属性结构
    struct NFTAttributes {
        NFTRarity rarity;
        uint256 power;
        uint256 dailyReward;
        uint256 maxReward;
        uint256 minedAmount;    // 已挖矿数量
        bool isStaked;          // 是否质押中
        uint256 stakeTime;      // 质押时间
    }

    // NFT概率配置
    struct RarityConfig {
        uint8 probability;  // 1-100
        uint256 power;
        uint256 dailyReward;
        uint256 maxReward;
    }

    // 市场挂单结构
    struct MarketListing {
        address seller;
        uint256 price;  // 以wei为单位的BNB价格
        bool isActive;
    }

    // NFT图片配置
    struct NFTImage {
        string imageURI;      // 图片URI
        string name;          // NFT名称
        string description;   // NFT描述
    }

    // 事件
    event BoxOpened(address indexed user, NFTRarity rarity, uint256 tokenId);
    event RarityConfigUpdated(NFTRarity rarity, uint8 probability, uint256 power, uint256 dailyReward, uint256 maxReward);
    event BoxPriceUpdated(uint256 newPrice);
    event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event NFTUnlisted(uint256 indexed tokenId);
    event NFTSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event NFTStaked(uint256 indexed tokenId, address indexed owner);
    event NFTUnstaked(uint256 indexed tokenId, address indexed owner);
    event NFTBurned(uint256 indexed tokenId, address indexed owner);
    event RewardClaimed(uint256 indexed tokenId, address indexed owner, uint256 amount);
    event NFTRewardUpdated(uint256 indexed tokenId, uint256 newDailyReward);
    event RarityRewardUpdated(NFTRarity indexed rarity, uint256 newDailyReward);
    event NFTMaxRewardUpdated(uint256 indexed tokenId, uint256 newMaxReward);
    event RarityMaxRewardUpdated(NFTRarity indexed rarity, uint256 newMaxReward);

    // 状态变量
    IERC20 public zoneToken;  // ZONE代币合约
    uint256 public BOX_PRICE = 100 * 10**18;  // 100 ZONE
    uint256 public MARKET_FEE = 5;  // 5% 市场手续费
    address public feeReceiver = 0xAB9b9df06f179f72B1b25BB5d9f1e08c8f708f4B;  // 手续费接收地址
    uint256 public constant MAX_MINING_DAYS = 90;  // 最大挖矿天数
    mapping(NFTRarity => RarityConfig) public rarityConfigs;
    mapping(uint256 => NFTAttributes) public nftAttributes;
    mapping(uint256 => MarketListing) public marketListings;
    mapping(address => uint256[]) public stakedNFTs;  // 用户质押的NFT列表
    mapping(address => uint256) public userBoxCount;  // 用户开盒次数记录
    mapping(NFTRarity => NFTImage) public rarityImages;
    Counters.Counter private _tokenIdCounter;

    // 市场统计数据
    uint256 public totalVolume;      // 总交易量
    uint256 public dailyVolume;      // 24小时交易量
    uint256 public floorPrice;       // 地板价
    uint256 public lastUpdateTime;   // 最后更新时间

    // 交易历史记录结构
    struct TradeHistory {
        address seller;
        address buyer;
        uint256 price;
        uint256 timestamp;
    }

    // NFT的交易历史记录
    mapping(uint256 => TradeHistory[]) public tradeHistories;

    // 构造函数
    constructor(address _zoneToken) ERC721("Zero NFT", "ZNFT") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        zoneToken = IERC20(_zoneToken);
        
        // 初始化NFT概率和属性配置
        rarityConfigs[NFTRarity.N] = RarityConfig(55, 100, 28 * 10**17, 252 * 10**18);    // 55%, 功率100, 日收益2.8, 总收益252
        rarityConfigs[NFTRarity.R] = RarityConfig(15, 400, 10 * 10**18, 900 * 10**18);    // 15%, 功率400, 日收益10, 总收益900
        rarityConfigs[NFTRarity.SR] = RarityConfig(5, 1600, 40 * 10**18, 3600 * 10**18);   // 5%, 功率1600, 日收益40, 总收益3600
        rarityConfigs[NFTRarity.SSR] = RarityConfig(1, 6400, 160 * 10**18, 14400 * 10**18); // 1%, 功率6400, 日收益160, 总收益14400

        // 设置默认NFT图片和信息
        rarityImages[NFTRarity.N] = NFTImage({
            imageURI: "https://your-image-host.com/n.png",
            name: "Normal Miner",
            description: "A basic mining machine"
        });
        rarityImages[NFTRarity.R] = NFTImage({
            imageURI: "https://your-image-host.com/r.png",
            name: "Rare Miner",
            description: "An advanced mining machine"
        });
        rarityImages[NFTRarity.SR] = NFTImage({
            imageURI: "https://your-image-host.com/sr.png",
            name: "Super Rare Miner",
            description: "A powerful mining machine"
        });
        rarityImages[NFTRarity.SSR] = NFTImage({
            imageURI: "https://your-image-host.com/ssr.png",
            name: "SSR Miner",
            description: "The ultimate mining machine"
        });
    }

    // 开箱函数 - 使用ZONE代币
    function openBox() external nonReentrant returns (uint256) {
        // 检查并转移ZONE代币
        require(zoneToken.balanceOf(msg.sender) >= BOX_PRICE, "Insufficient ZONE balance");
        require(zoneToken.transferFrom(msg.sender, address(0xdead), BOX_PRICE), "Token transfer failed");

        // 增加用户开盒次数
        userBoxCount[msg.sender]++;
        
        // 确定NFT等级
        NFTRarity rarity;
        
        // 保底机制：每300次必得SSR
        if (userBoxCount[msg.sender] % 300 == 0) {
            rarity = NFTRarity.SSR;
        }
        // 保底机制：每100次必得SR，且不是300的倍数时
        else if (userBoxCount[msg.sender] % 100 == 0) {
            rarity = NFTRarity.SR;
        }
        // 普通抽取
        else {
            uint256 randomNum = uint256(keccak256(abi.encodePacked(
                block.timestamp,
                block.difficulty,
                msg.sender,
                _tokenIdCounter.current()
            ))) % 100;

            if (randomNum < rarityConfigs[NFTRarity.SSR].probability) {
                rarity = NFTRarity.SSR;
            } else if (randomNum < rarityConfigs[NFTRarity.SSR].probability + rarityConfigs[NFTRarity.SR].probability) {
                rarity = NFTRarity.SR;
            } else if (randomNum < rarityConfigs[NFTRarity.SSR].probability + rarityConfigs[NFTRarity.SR].probability + rarityConfigs[NFTRarity.R].probability) {
                rarity = NFTRarity.R;
            } else {
                rarity = NFTRarity.N;
            }
        }

        // 铸造NFT
        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(msg.sender, tokenId);
        _tokenIdCounter.increment();

        // 设置NFT属性
        nftAttributes[tokenId] = NFTAttributes({
            rarity: rarity,
            power: rarityConfigs[rarity].power,
            dailyReward: rarityConfigs[rarity].dailyReward,
            maxReward: rarityConfigs[rarity].maxReward,
            minedAmount: 0,
            isStaked: false,
            stakeTime: 0
        });

        emit BoxOpened(msg.sender, rarity, tokenId);
        return tokenId;
    }

    // 质押NFT
    function stakeNFT(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(!nftAttributes[tokenId].isStaked, "Already staked");
        require(!marketListings[tokenId].isActive, "Listed for sale");
        require(nftAttributes[tokenId].minedAmount < nftAttributes[tokenId].maxReward, "Max reward reached");

        nftAttributes[tokenId].isStaked = true;
        nftAttributes[tokenId].stakeTime = block.timestamp;
        stakedNFTs[msg.sender].push(tokenId);

        emit NFTStaked(tokenId, msg.sender);
    }

    // 解除质押NFT
    function unstakeNFT(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(nftAttributes[tokenId].isStaked, "Not staked");

        // 计算并发放收益
        uint256 reward = calculateReward(tokenId);
        if (reward > 0) {
            require(zoneToken.transfer(msg.sender, reward), "Reward transfer failed");
            nftAttributes[tokenId].minedAmount += reward;
            emit RewardClaimed(tokenId, msg.sender, reward);
        }

        nftAttributes[tokenId].isStaked = false;
        nftAttributes[tokenId].stakeTime = 0;

        // 从质押列表中移除
        uint256[] storage userStakedNFTs = stakedNFTs[msg.sender];
        for (uint256 i = 0; i < userStakedNFTs.length; i++) {
            if (userStakedNFTs[i] == tokenId) {
                userStakedNFTs[i] = userStakedNFTs[userStakedNFTs.length - 1];
                userStakedNFTs.pop();
                break;
            }
        }

        // 如果已达到最大收益，销毁NFT
        if (nftAttributes[tokenId].minedAmount >= nftAttributes[tokenId].maxReward) {
            _burn(tokenId);
            emit NFTBurned(tokenId, msg.sender);
        } else {
            emit NFTUnstaked(tokenId, msg.sender);
        }
    }

    // 计算收益
    function calculateReward(uint256 tokenId) public view returns (uint256) {
        NFTAttributes storage nft = nftAttributes[tokenId];
        if (!nft.isStaked) return 0;
        
        uint256 stakingDuration = block.timestamp - nft.stakeTime;
        uint256 daysStaked = stakingDuration / 1 days;
        uint256 reward = daysStaked * nft.dailyReward;
        
        // 检查是否超过最大收益
        uint256 remainingReward = nft.maxReward - nft.minedAmount;
        return reward > remainingReward ? remainingReward : reward;
    }

    // 批量质押
    function batchStakeNFT(uint256[] calldata tokenIds) external {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(ownerOf(tokenIds[i]) == msg.sender, "Not the owner");
            require(!nftAttributes[tokenIds[i]].isStaked, "Already staked");
            require(!marketListings[tokenIds[i]].isActive, "Listed for sale");
            require(nftAttributes[tokenIds[i]].minedAmount < nftAttributes[tokenIds[i]].maxReward, "Max reward reached");

            nftAttributes[tokenIds[i]].isStaked = true;
            nftAttributes[tokenIds[i]].stakeTime = block.timestamp;
            stakedNFTs[msg.sender].push(tokenIds[i]);

            emit NFTStaked(tokenIds[i], msg.sender);
        }
    }

    // 批量解押
    function batchUnstakeNFT(uint256[] calldata tokenIds) external {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(ownerOf(tokenIds[i]) == msg.sender, "Not the owner");
            require(nftAttributes[tokenIds[i]].isStaked, "Not staked");

            // 计算并发放收益
            uint256 reward = calculateReward(tokenIds[i]);
            if (reward > 0) {
                require(zoneToken.transfer(msg.sender, reward), "Reward transfer failed");
                nftAttributes[tokenIds[i]].minedAmount += reward;
                emit RewardClaimed(tokenIds[i], msg.sender, reward);
            }

            nftAttributes[tokenIds[i]].isStaked = false;
            nftAttributes[tokenIds[i]].stakeTime = 0;

            // 从质押列表中移除
            _removeFromStakedList(msg.sender, tokenIds[i]);

            // 如果已达到最大收益，销毁NFT
            if (nftAttributes[tokenIds[i]].minedAmount >= nftAttributes[tokenIds[i]].maxReward) {
                _burn(tokenIds[i]);
                emit NFTBurned(tokenIds[i], msg.sender);
            } else {
                emit NFTUnstaked(tokenIds[i], msg.sender);
            }
        }
    }

    // 上架NFT
    function listNFT(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(!nftAttributes[tokenId].isStaked, "NFT is staked");
        require(price > 0, "Price must be greater than 0");
        require(!marketListings[tokenId].isActive, "Already listed");

        marketListings[tokenId] = MarketListing({
            seller: msg.sender,
            price: price,
            isActive: true
        });

        emit NFTListed(tokenId, msg.sender, price);
    }

    // 批量上架
    function batchListNFT(uint256[] calldata tokenIds, uint256[] calldata prices) external {
        require(tokenIds.length == prices.length, "Arrays length mismatch");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(ownerOf(tokenIds[i]) == msg.sender, "Not the owner");
            require(!nftAttributes[tokenIds[i]].isStaked, "NFT is staked");
            require(prices[i] > 0, "Price must be greater than 0");
            require(!marketListings[tokenIds[i]].isActive, "Already listed");

            marketListings[tokenIds[i]] = MarketListing({
                seller: msg.sender,
                price: prices[i],
                isActive: true
            });

            emit NFTListed(tokenIds[i], msg.sender, prices[i]);
        }
    }

    // 下架NFT
    function unlistNFT(uint256 tokenId) external {
        require(marketListings[tokenId].seller == msg.sender, "Not the seller");
        require(marketListings[tokenId].isActive, "Not listed");

        delete marketListings[tokenId];
        emit NFTUnlisted(tokenId);
    }

    // 批量下架
    function batchUnlistNFT(uint256[] calldata tokenIds) external {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(marketListings[tokenIds[i]].seller == msg.sender, "Not the seller");
            require(marketListings[tokenIds[i]].isActive, "Not listed");

            delete marketListings[tokenIds[i]];
            emit NFTUnlisted(tokenIds[i]);
        }
    }

    // 购买NFT
    function buyNFT(uint256 tokenId) external payable nonReentrant {
        MarketListing storage listing = marketListings[tokenId];
        require(listing.isActive, "Not listed");
        require(msg.value == listing.price, "Incorrect price");
        require(msg.sender != listing.seller, "Cannot buy your own NFT");

        address seller = listing.seller;
        uint256 price = listing.price;

        // 计算手续费
        uint256 fee = (price * MARKET_FEE) / 100;
        uint256 sellerAmount = price - fee;

        // 删除挂单
        delete marketListings[tokenId];

        // 转移NFT
        _transfer(seller, msg.sender, tokenId);

        // 转账BNB给卖家
        (bool sellerSuccess,) = seller.call{value: sellerAmount}("");
        require(sellerSuccess, "Seller transfer failed");
        
        // 转账手续费到指定地址
        (bool feeSuccess,) = feeReceiver.call{value: fee}("");
        require(feeSuccess, "Fee transfer failed");

        // 记录交易历史
        tradeHistories[tokenId].push(TradeHistory({
            seller: seller,
            buyer: msg.sender,
            price: price,
            timestamp: block.timestamp
        }));

        // 更新市场统计数据
        _updateMarketStats(price);

        emit NFTSold(tokenId, seller, msg.sender, price);
    }

    // 获取市场统计
    function getMarketStats() external view returns (
        uint256 totalVolume,
        uint256 dailyVolume,
        uint256 floorPrice,
        uint256 totalListings,
        uint256 totalHolders
    ) {
        return (totalVolume, dailyVolume, floorPrice, _getActiveListing(), _getUniqueHolders());
    }

    // 获取活跃挂单数量
    function _getActiveListing() internal view returns (uint256 count) {
        uint256 tokenId = _tokenIdCounter.current();
        for (uint256 i = 1; i <= tokenId; i++) {
            if (marketListings[i].isActive) {
                count++;
            }
        }
    }

    // 获取持有人数量
    function _getUniqueHolders() internal view returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        mapping(address => bool) storage holders;
        uint256 count;
        
        for (uint256 i = 1; i <= tokenId; i++) {
            address owner = ownerOf(i);
            if (!holders[owner]) {
                holders[owner] = true;
                count++;
            }
        }
        return count;
    }

    // 内部函数：从质押列表中移除
    function _removeFromStakedList(address user, uint256 tokenId) internal {
        uint256[] storage userStakedNFTs = stakedNFTs[user];
        for (uint256 i = 0; i < userStakedNFTs.length; i++) {
            if (userStakedNFTs[i] == tokenId) {
                userStakedNFTs[i] = userStakedNFTs[userStakedNFTs.length - 1];
                userStakedNFTs.pop();
                break;
            }
        }
    }

    // 紧急提取
    function emergencyWithdraw() external onlyRole(ADMIN_ROLE) {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success,) = msg.sender.call{value: balance}("");
        require(success, "Withdraw failed");
    }

    // 获取用户质押的NFT列表
    function getStakedNFTs(address user) external view returns (uint256[] memory) {
        return stakedNFTs[user];
    }

    // 获取NFT的交易历史
    function getTradeHistory(uint256 tokenId) external view returns (TradeHistory[] memory) {
        return tradeHistories[tokenId];
    }

    // 获取用户的交易历史（作为卖家或买家）
    function getUserTradeHistory(address user) external view returns (
        uint256[] memory tokenIds,
        TradeHistory[] memory histories
    ) {
        uint256 count = 0;
        
        // 先计算该用户参与的交易总数
        for (uint256 i = 0; i < _tokenIdCounter.current(); i++) {
            TradeHistory[] memory trades = tradeHistories[i];
            for (uint256 j = 0; j < trades.length; j++) {
                if (trades[j].seller == user || trades[j].buyer == user) {
                    count++;
                }
            }
        }
        
        // 创建返回数组
        tokenIds = new uint256[](count);
        histories = new TradeHistory[](count);
        
        // 填充数组
        uint256 index = 0;
        for (uint256 i = 0; i < _tokenIdCounter.current(); i++) {
            TradeHistory[] memory trades = tradeHistories[i];
            for (uint256 j = 0; j < trades.length; j++) {
                if (trades[j].seller == user || trades[j].buyer == user) {
                    tokenIds[index] = i;
                    histories[index] = trades[j];
                    index++;
                }
            }
        }
        
        return (tokenIds, histories);
    }

    // 设置手续费接收地址（仅管理员）
    function setFeeReceiver(address _feeReceiver) external onlyRole(ADMIN_ROLE) {
        require(_feeReceiver != address(0), "Invalid address");
        feeReceiver = _feeReceiver;
    }

    // 设置盲盒价格（仅管理员）
    function setBoxPrice(uint256 newPrice) external onlyRole(ADMIN_ROLE) {
        BOX_PRICE = newPrice;
        emit BoxPriceUpdated(newPrice);
    }

    // 设置市场手续费（仅管理员）
    function setMarketFee(uint256 newFee) external onlyRole(ADMIN_ROLE) {
        require(newFee <= 100, "Fee too high");
        MARKET_FEE = newFee;
    }

    // 更新NFT的每日收益（仅管理员）
    function updateNFTDailyReward(uint256 tokenId, uint256 newDailyReward) external onlyRole(ADMIN_ROLE) {
        require(_exists(tokenId), "NFT does not exist");
        nftAttributes[tokenId].dailyReward = newDailyReward;
        emit NFTRewardUpdated(tokenId, newDailyReward);
    }

    // 按等级更新NFT的每日收益（仅管理员）
    function updateRarityDailyReward(NFTRarity rarity, uint256 newDailyReward, bool applyToExisting) external onlyRole(ADMIN_ROLE) {
        // 更新配置
        rarityConfigs[rarity].dailyReward = newDailyReward;
        
        // 如果需要，更新所有该等级的已存在NFT
        if (applyToExisting) {
            for (uint256 i = 0; i < _tokenIdCounter.current(); i++) {
                if (_exists(i) && nftAttributes[i].rarity == rarity) {
                    nftAttributes[i].dailyReward = newDailyReward;
                    emit NFTRewardUpdated(i, newDailyReward);
                }
            }
        }
        
        emit RarityRewardUpdated(rarity, newDailyReward);
    }

    // 更新NFT的最大收益（仅管理员）
    function updateNFTMaxReward(uint256 tokenId, uint256 newMaxReward) external onlyRole(ADMIN_ROLE) {
        require(_exists(tokenId), "NFT does not exist");
        require(nftAttributes[tokenId].minedAmount <= newMaxReward, "New max reward cannot be less than mined amount");
        nftAttributes[tokenId].maxReward = newMaxReward;
        emit NFTMaxRewardUpdated(tokenId, newMaxReward);
    }

    // 按等级更新NFT的最大收益（仅管理员）
    function updateRarityMaxReward(NFTRarity rarity, uint256 newMaxReward, bool applyToExisting) external onlyRole(ADMIN_ROLE) {
        // 更新配置
        rarityConfigs[rarity].maxReward = newMaxReward;
        
        // 如果需要，更新所有该等级的已存在NFT
        if (applyToExisting) {
            for (uint256 i = 0; i < _tokenIdCounter.current(); i++) {
                if (_exists(i) && nftAttributes[i].rarity == rarity) {
                    // 只更新那些未超过新最大收益的NFT
                    if (nftAttributes[i].minedAmount <= newMaxReward) {
                        nftAttributes[i].maxReward = newMaxReward;
                        emit NFTMaxRewardUpdated(i, newMaxReward);
                    }
                }
            }
        }
        
        emit RarityMaxRewardUpdated(rarity, newMaxReward);
    }

    // 添加管理员（仅超级管理员）
    function addAdmin(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(ADMIN_ROLE, account);
    }

    // 移除管理员（仅超级管理员）
    function removeAdmin(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(ADMIN_ROLE, account);
    }

    // 提取合约中的代币
    function withdrawTokens() external onlyRole(ADMIN_ROLE) {
        uint256 balance = zoneToken.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        require(zoneToken.transfer(owner(), balance), "Transfer failed");
    }

    // 提取合约中的BNB
    function withdrawBNB() external onlyRole(ADMIN_ROLE) {
        uint256 balance = address(this).balance;
        require(balance > 0, "No BNB to withdraw");
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Failed to withdraw BNB");
    }

    // 获取NFT属性
    function getNFTAttributes(uint256 tokenId) external view returns (NFTAttributes memory) {
        return nftAttributes[tokenId];
    }

    // 获取市场挂单信息
    function getMarketListing(uint256 tokenId) external view returns (MarketListing memory) {
        return marketListings[tokenId];
    }

    // 获取用户所有的NFT
    function getOwnedNFTs(address user) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(user);
        uint256[] memory tokens = new uint256[](balance);
        for (uint256 i = 0; i < balance; i++) {
            tokens[i] = tokenOfOwnerByIndex(user, i);
        }
        return tokens;
    }

    // 获取NFT已挖矿天数
    function getMiningDays(uint256 tokenId) public view returns (uint256) {
        NFTAttributes memory nft = nftAttributes[tokenId];
        if (!nft.isStaked) {
            return 0;
        }
        uint256 duration = block.timestamp - nft.stakeTime;
        return duration / 1 days;
    }

    // 获取NFT剩余可挖矿天数
    function getRemainingMiningDays(uint256 tokenId) public view returns (uint256) {
        uint256 minedDays = getMiningDays(tokenId);
        if (minedDays >= MAX_MINING_DAYS) {
            return 0;
        }
        return MAX_MINING_DAYS - minedDays;
    }

    // 获取NFT当前收益率
    function getCurrentROI(uint256 tokenId) public view returns (uint256) {
        NFTAttributes memory nft = nftAttributes[tokenId];
        uint256 totalMined = nft.minedAmount;
        if (nft.isStaked) {
            totalMined += calculateReward(tokenId);
        }
        return (totalMined * 100) / (BOX_PRICE);  // 返回百分比
    }

    // 接收BNB
    receive() external payable {}

    // 更新NFT图片配置（管理员功能）
    function updateRarityImage(
        NFTRarity rarity,
        string memory imageURI,
        string memory name,
        string memory description
    ) external onlyRole(ADMIN_ROLE) {
        rarityImages[rarity] = NFTImage({
            imageURI: imageURI,
            name: name,
            description: description
        });
    }

    // 获取NFT元数据
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        
        NFTAttributes memory attrs = nftAttributes[tokenId];
        NFTImage memory img = rarityImages[attrs.rarity];
        
        // 构建JSON字符串
        string memory json = string(abi.encodePacked(
            '{',
            '"name": "', img.name, ' #', toString(tokenId), '",',
            '"description": "', img.description, '",',
            '"image": "', img.imageURI, '",',
            '"attributes": [',
            '{"trait_type": "Rarity", "value": "', getRarityString(attrs.rarity), '"},',
            '{"trait_type": "Power", "value": "', toString(attrs.power), '"},',
            '{"trait_type": "Daily Reward", "value": "', toString(attrs.dailyReward), '"},',
            '{"trait_type": "Max Reward", "value": "', toString(attrs.maxReward), '"},',
            '{"trait_type": "Mined Amount", "value": "', toString(attrs.minedAmount), '"}',
            ']}'
        ));

        return string(abi.encodePacked(
            "data:application/json;base64,",
            base64Encode(bytes(json))
        ));
    }

    // 辅助函数：将稀有度转换为字符串
    function getRarityString(NFTRarity rarity) internal pure returns (string memory) {
        if (rarity == NFTRarity.N) return "Normal";
        if (rarity == NFTRarity.R) return "Rare";
        if (rarity == NFTRarity.SR) return "Super Rare";
        if (rarity == NFTRarity.SSR) return "SSR";
        return "Unknown";
    }

    // 辅助函数：数字转字符串
    function toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    // Base64编码函数
    function base64Encode(bytes memory data) internal pure returns (string memory) {
        string memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        uint256 len = data.length;
        if (len == 0) return "";

        uint256 encodedLen = 4 * ((len + 2) / 3);
        bytes memory result = new bytes(encodedLen + 32);

        bytes memory tablePtr = bytes(table);
        uint256 i = 0;
        uint256 j = 0;

        while (i < len) {
            uint256 k = i + 3 <= len ? 3 : len - i;
            uint256 r = 0;
            for (uint256 l = 0; l < k; l++) {
                r |= uint256(uint8(data[i + l])) << (16 - l * 8);
            }
            for (uint256 l = 0; l < 4; l++) {
                result[j++] = tablePtr[uint8((r >> (18 - l * 6)) & 0x3F)];
            }
            i += 3;
        }

        return string(result);
    }
}
