// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/IZoneNFT.sol";

contract NFTMarketplace is ReentrancyGuard, AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // 合约依赖
    IZoneNFT public nft;        // NFT合约

    // 市场配置
    uint256 public marketFeeRate = 25;    // 市场费率 2.5%
    address public feeReceiver;            // 费用接收地址
    uint256 public constant FEE_DENOMINATOR = 1000;
    uint256 public minPrice = 0.01 ether;  // 最低价格 0.01 BNB

    // 市场数据
    uint256 public totalVolume;           // 总交易量(BNB)
    uint256 public dailyVolume;           // 日交易量(BNB)
    uint256 public lastVolumeReset;       // 上次重置时间
    uint256 public floorPrice;            // 地板价(BNB)

    // 上架信息
    struct Listing {
        bool isActive;      // 是否在售
        uint256 price;      // 价格(BNB)
        address seller;     // 卖家
    }

    // 交易记录
    struct TradeHistory {
        uint256 tokenId;    // NFT ID
        address seller;     // 卖家
        address buyer;      // 买家
        uint256 price;      // 成交价格
        uint256 timestamp;  // 成交时间
    }

    // NFT上架信息
    mapping(uint256 => Listing) public listings;
    // 交易历史
    TradeHistory[] public tradeHistory;
    // 用户交易次数
    mapping(address => uint256) public userTradeCount;

    // 事件
    event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event NFTUnlisted(uint256 indexed tokenId, address indexed seller);
    event NFTSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event MarketFeeUpdated(uint256 newFee);
    event FeeReceiverUpdated(address newReceiver);
    event MinPriceUpdated(uint256 newMinPrice);
    event BatchNFTsListed(uint256[] tokenIds, uint256[] prices);
    event BatchNFTsUnlisted(uint256[] tokenIds);
    event NFTContractUpdated(address newNFTContract);

    constructor(
        address _nft,
        address _feeReceiver
    ) {
        require(_nft != address(0), "Invalid NFT address");
        require(_feeReceiver != address(0), "Invalid fee receiver");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        
        nft = IZoneNFT(_nft);
        feeReceiver = _feeReceiver;
        lastVolumeReset = block.timestamp;
    }

    // 批量上架NFT
    function batchListNFTs(uint256[] calldata tokenIds, uint256[] calldata prices) external nonReentrant whenNotPaused {
        require(tokenIds.length == prices.length, "Array length mismatch");
        require(tokenIds.length <= 20, "Too many NFTs"); // 限制每次最多20个

        for(uint256 i = 0; i < tokenIds.length; i++) {
            require(prices[i] >= minPrice, "Price too low");
            require(nft.ownerOf(tokenIds[i]) == msg.sender, "Not token owner");
            
            // 检查NFT状态
            (,,,,, bool isStaked,) = nft.getNFTAttributes(tokenIds[i]);
            require(!isStaked, "NFT is staked");
            require(!listings[tokenIds[i]].isActive, "Already listed");

            // 检查NFT授权
            require(
                nft.getApproved(tokenIds[i]) == address(this) || 
                nft.isApprovedForAll(msg.sender, address(this)),
                "NFT not approved"
            );

            // 更新上架信息
            listings[tokenIds[i]] = Listing({
                isActive: true,
                price: prices[i],
                seller: msg.sender
            });

            // 更新地板价
            if (floorPrice == 0 || prices[i] < floorPrice) {
                floorPrice = prices[i];
            }
        }

        emit BatchNFTsListed(tokenIds, prices);
    }

    // 批量下架NFT
    function batchUnlistNFTs(uint256[] calldata tokenIds) external nonReentrant {
        require(tokenIds.length <= 20, "Too many NFTs"); // 限制每次最多20个

        for(uint256 i = 0; i < tokenIds.length; i++) {
            Listing storage listing = listings[tokenIds[i]];
            require(listing.isActive, "Not listed");
            require(listing.seller == msg.sender, "Not seller");

            delete listings[tokenIds[i]];
        }

        emit BatchNFTsUnlisted(tokenIds);
    }

    // 上架NFT
    function listNFT(uint256 tokenId, uint256 price) external nonReentrant whenNotPaused {
        require(nft.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(price >= minPrice, "Price too low");
        
        // 检查NFT状态
        (,,,,, bool isStaked,) = nft.getNFTAttributes(tokenId);
        require(!isStaked, "NFT is staked");
        require(!listings[tokenId].isActive, "Already listed");

        // 检查NFT授权
        require(
            nft.getApproved(tokenId) == address(this) || 
            nft.isApprovedForAll(msg.sender, address(this)),
            "NFT not approved"
        );

        // 更新上架信息
        listings[tokenId] = Listing({
            isActive: true,
            price: price,
            seller: msg.sender
        });

        // 更新地板价
        if (floorPrice == 0 || price < floorPrice) {
            floorPrice = price;
        }

        emit NFTListed(tokenId, msg.sender, price);
    }

    // 下架NFT
    function unlistNFT(uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.isActive, "Not listed");
        require(listing.seller == msg.sender, "Not seller");

        delete listings[tokenId];
        emit NFTUnlisted(tokenId, msg.sender);
    }

    // 购买NFT
    function buyNFT(uint256 tokenId) external payable nonReentrant whenNotPaused {
        _buyNFT(tokenId);
    }

    // 批量购买NFT
    function batchBuyNFTs(uint256[] calldata tokenIds) external payable nonReentrant whenNotPaused {
        require(tokenIds.length <= 20, "Too many NFTs");
        uint256 totalPrice = 0;
        
        // 计算总价
        for(uint256 i = 0; i < tokenIds.length; i++) {
            Listing storage listing = listings[tokenIds[i]];
            require(listing.isActive, "Not listed");
            require(listing.seller != msg.sender, "Cannot buy your own NFT");
            totalPrice += listing.price;
        }
        
        require(msg.value == totalPrice, "Incorrect payment amount");
        
        // 执行购买
        for(uint256 i = 0; i < tokenIds.length; i++) {
            _buyNFT(tokenIds[i]);
        }
    }

    // 内部购买函数
    function _buyNFT(uint256 tokenId) internal {
        Listing storage listing = listings[tokenId];
        require(listing.isActive, "Not listed");
        
        uint256 price = listing.price;
        address seller = listing.seller;
        require(seller != msg.sender, "Cannot buy your own NFT");
        require(msg.value == price, "Incorrect payment amount");

        // 计算费用
        uint256 fee = (price * marketFeeRate) / FEE_DENOMINATOR;
        uint256 sellerAmount = price - fee;

        // 尝试转移NFT
        try nft.transferFrom(seller, msg.sender, tokenId) {
            // 转移BNB
            (bool feeSuccess,) = feeReceiver.call{value: fee}("");
            require(feeSuccess, "Fee transfer failed");
            
            (bool sellerSuccess,) = seller.call{value: sellerAmount}("");
            require(sellerSuccess, "Seller transfer failed");

            // 更新市场数据
            delete listings[tokenId];
            totalVolume += price;
            
            // 更新日交易量
            if (block.timestamp - lastVolumeReset >= 1 days) {
                dailyVolume = price;
                lastVolumeReset = block.timestamp;
            } else {
                dailyVolume += price;
            }
            
            // 更新交易历史
            tradeHistory.push(TradeHistory({
                tokenId: tokenId,
                seller: seller,
                buyer: msg.sender,
                price: price,
                timestamp: block.timestamp
            }));
            
            userTradeCount[msg.sender]++;
            
            emit NFTSold(tokenId, seller, msg.sender, price);
        } catch {
            revert("NFT transfer failed");
        }
    }

    // 设置市场费率
    function setMarketFee(uint256 newFee) external onlyRole(ADMIN_ROLE) {
        require(newFee <= 100, "Fee too high"); // 最高 10%
        marketFeeRate = newFee;
        emit MarketFeeUpdated(newFee);
    }

    // 设置费用接收地址
    function setFeeReceiver(address newReceiver) external onlyRole(ADMIN_ROLE) {
        require(newReceiver != address(0), "Invalid address");
        feeReceiver = newReceiver;
        emit FeeReceiverUpdated(newReceiver);
    }

    // 设置最低价格
    function setMinPrice(uint256 newMinPrice) external onlyRole(ADMIN_ROLE) {
        minPrice = newMinPrice;
        emit MinPriceUpdated(newMinPrice);
    }

    // 设置 NFT 合约地址
    function setNFTContract(address _nft) external onlyRole(ADMIN_ROLE) {
        require(_nft != address(0), "Invalid NFT address");
        nft = IZoneNFT(_nft);
        emit NFTContractUpdated(_nft);
    }

    // 紧急取回NFT
    function emergencyWithdraw(uint256 tokenId) external onlyRole(ADMIN_ROLE) {
        require(listings[tokenId].isActive, "Not listed");
        address seller = listings[tokenId].seller;
        delete listings[tokenId];
        emit NFTUnlisted(tokenId, seller);
    }

    // 暂停/恢复市场
    function togglePause() external onlyRole(ADMIN_ROLE) {
        if (paused()) {
            _unpause();
        } else {
            _pause();
        }
    }

    // 查询NFT市场信息
    function getNFTMarketInfo(uint256 tokenId) external view returns (
        bool isActive,
        uint256 price,
        address seller
    ) {
        Listing storage listing = listings[tokenId];
        return (listing.isActive, listing.price, listing.seller);
    }

    // 获取市场统计数据
    function getMarketStats() external view returns (
        uint256 _totalVolume,
        uint256 _dailyVolume,
        uint256 _floorPrice,
        uint256 _marketFeeRate,
        address _feeReceiver,
        uint256 _minPrice
    ) {
        return (
            totalVolume,
            dailyVolume,
            floorPrice,
            marketFeeRate,
            feeReceiver,
            minPrice
        );
    }

    // 获取用户交易历史
    function getUserTradeHistory(address user, uint256 offset, uint256 limit) external view returns (
        TradeHistory[] memory
    ) {
        uint256 count = 0;
        for(uint256 i = 0; i < tradeHistory.length; i++) {
            if (tradeHistory[i].seller == user || tradeHistory[i].buyer == user) {
                count++;
            }
        }

        uint256 resultCount = limit > count ? count : limit;
        TradeHistory[] memory result = new TradeHistory[](resultCount);
        uint256 current = 0;
        uint256 skipped = 0;

        for(uint256 i = 0; i < tradeHistory.length && current < resultCount; i++) {
            if (tradeHistory[i].seller == user || tradeHistory[i].buyer == user) {
                if (skipped >= offset) {
                    result[current] = tradeHistory[i];
                    current++;
                } else {
                    skipped++;
                }
            }
        }

        return result;
    }
}
