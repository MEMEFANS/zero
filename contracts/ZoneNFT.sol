// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ZoneNFT is ERC721, ERC721Enumerable, Pausable, AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    using Strings for uint256;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant STAKING_ROLE = keccak256("STAKING_ROLE");
    
    Counters.Counter private _tokenIdCounter;

    // 销毁地址
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    // NFT属性结构
    struct NFTAttributes {
        uint8 rarity;        // 稀有度 (N=0, R=1, SR=2, SSR=3)
        uint256 power;       // 算力
        uint256 dailyReward; // 每日奖励 (ZONE)
        uint256 maxReward;   // 最大奖励 (ZONE)
        uint256 minedAmount; // 已挖矿数量
        bool isStaked;       // 是否质押
        uint256 stakeTime;   // 质押时间
    }

    // NFT图片配置
    mapping(uint8 => string[]) private _nftImages; // rarity => images

    // NFT属性映射
    mapping(uint256 => NFTAttributes) public nftAttributes;
    
    // 稀有度配置
    uint256[] public rarityWeights = [550, 150, 50, 10];  // N:55%, R:15%, SR:5%, SSR:1%
    uint256[] public powerRanges = [100, 400, 1600, 6400];  // 基础算力
    uint256[] public rewardRanges = [28e17, 10e18, 40e18, 160e18];  // 每日收益(wei)
    uint256[] public maxRewardRanges = [252e18, 900e18, 3600e18, 14400e18];  // 总收益上限(wei)

    // 盲盒配置
    IERC20 public zoneToken;              // ZONE代币合约
    uint256 public boxPrice = 100 * 10**18; // 盲盒价格：100 ZONE
    uint256 public boxOpenCount;          // 总开盒次数
    mapping(address => uint256) public userBoxOpenCount; // 用户开盒次数

    // 回本周期 (天)
    uint256[] public returnPeriods = [357, 111, 28, 7];  // N:35.7天, R:11.1天, SR:2.8天, SSR:0.7天

    // 总收益率
    uint256[] public totalReturnRates = [152, 800, 3500, 14300];  // N:152%, R:800%, SR:3500%, SSR:14300%

    event BoxOpened(address indexed user, uint256 indexed tokenId, string rarity);
    event BoxPriceUpdated(uint256 newPrice);

    constructor(address _zoneToken) ERC721("Zone NFT", "ZONE") {
        require(_zoneToken != BURN_ADDRESS, "Invalid token address");
        
        zoneToken = IERC20(_zoneToken);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(STAKING_ROLE, msg.sender);

        _initializeSSRImages();
        _initializeSRImages();
        _initializeRImages();
        _initializeNImages();
    }

    function _initializeSSRImages() private {
        _nftImages[3].push("ipfs://bafkreigggfktmbu4foz3dwtcbhfldvqbvv73ogdn3hcphfyvwaswwqjbna");
        _nftImages[3].push("ipfs://bafkreidhdgn3bhyyjyiy6nj7nix72fbnyry2iesz3gjyav6tv7ych63wme");
        _nftImages[3].push("ipfs://bafkreibyitzhuxdf46ynyyyw6jzavd2o54vlndrkn2d2pfwanu3cq3ouke");
        _nftImages[3].push("ipfs://bafkreihtjpm2wxxpf5fcm7fdo73ycrm5thvybi6mpom4ml47gadrzq2yd4");
    }

    function _initializeSRImages() private {
        _nftImages[2].push("ipfs://bafkreiejcncdya3dofutwzjbppr7iesbnbqny5hiuivkkmqizolmsul7wa");
        _nftImages[2].push("ipfs://bafkreicg7kb3yq22s3jh4jxp7nd4rovzvmsnpuf4dnn7syctstlaec7aja");
        _nftImages[2].push("ipfs://bafkreifdm6yc2ey6qlejbg3ohhcgtswy4uywcxrvvys37k745t54xqoscu");
        _nftImages[2].push("ipfs://bafkreibrsyio7fwpb773vryfo7byr5mzor5pty6i6cdle3qxvsm7qoq2ba");
    }

    function _initializeRImages() private {
        _nftImages[1].push("ipfs://bafkreib75y2zt6dygbqvr675k77qkvamuozrq3ehcjhj63uiwvatfpnwcy");
        _nftImages[1].push("ipfs://bafkreifzp2mf37rqhv7jbllgdtno3pafny66neyr4chfun5dipt7pyc5lq");
        _nftImages[1].push("ipfs://bafkreib44hbtd5mw6bnljd5idvmyheedw4uldyngqdqyrnr237zbtd5ydy");
        _nftImages[1].push("ipfs://bafkreidbzii233sbt53kprnpguupt4r3vkrnkzxkqtojitsinclbbrxmmy");
    }

    function _initializeNImages() private {
        _nftImages[0].push("ipfs://bafkreicg2o5srn26flfurg3aks2ozenazepewyug776xxsc3hznrtjvdfq");
        _nftImages[0].push("ipfs://bafkreigygfxouqc2wwarzqbjpbuk5px7q6ywkihxopy6svzbw5i6ks6jnq");
        _nftImages[0].push("ipfs://bafkreibjwpuw2f7vm42efx5f2yf3nmjqrvf2yn45iepys2do5deecjcwaq");
        _nftImages[0].push("ipfs://bafkreidqbaffdedxivwncxb3n4ivzr75jj25od35lz7urgyvih7g3rpfdm");
    }

    // 内部函数：初始化图片
    function _initializeImages(uint8 rarity, string[] memory images) private {
        for(uint i = 0; i < images.length; i++) {
            _nftImages[rarity].push(images[i]);
        }
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // 重写所需的函数
    function _update(address to, uint256 tokenId, address auth) 
        internal 
        virtual 
        override(ERC721, ERC721Enumerable) 
        returns (address) 
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) 
        internal 
        virtual 
        override(ERC721, ERC721Enumerable) 
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // 开启神秘盒子
    function openBox() external nonReentrant whenNotPaused returns (uint256) {
        require(zoneToken.balanceOf(msg.sender) >= boxPrice, "Insufficient ZONE balance");
        require(zoneToken.transferFrom(msg.sender, BURN_ADDRESS, boxPrice), "Burn failed"); // 销毁到特定地址

        // 生成NFT
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        // 更新开盒次数
        boxOpenCount++;
        userBoxOpenCount[msg.sender]++;

        // 确定稀有度
        uint8 rarity = _determineRarity();
        
        // 生成并设置属性
        NFTAttributes memory attrs = _generateAttributes(rarity);
        nftAttributes[tokenId] = attrs;
        
        _safeMint(msg.sender, tokenId);
        
        emit BoxOpened(msg.sender, tokenId, _rarityToString(rarity));
        
        return tokenId;
    }

    // 确定NFT稀有度
    function _determineRarity() internal returns (uint8) {
        uint256 rand = _random() % 1000;
        uint256 accWeight = 0;
        
        for (uint8 i = 0; i < rarityWeights.length; i++) {
            accWeight += rarityWeights[i];
            if (rand < accWeight) {
                return i;
            }
        }
        return 0; // 默认返回普通级别
    }

    // 生成随机数
    function _random() internal returns (uint256) {
        _tokenIdCounter.increment(); // 用于增加随机性
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            _tokenIdCounter.current()
        )));
    }

    // 生成NFT属性
    function _generateAttributes(uint8 rarity) internal returns (NFTAttributes memory) {
        // 生成算力（在基础算力上浮动±20%）
        uint256 powerVariation = (powerRanges[rarity] * (_random() % 40 + 80)) / 100;
        uint256 power = powerVariation;

        // 生成每日奖励（与算力成正比）
        uint256 dailyReward = (rewardRanges[rarity] * power) / powerRanges[rarity];
        
        // 设置最大奖励（30天）
        uint256 maxReward = maxRewardRanges[rarity];

        return NFTAttributes({
            rarity: rarity,
            power: power,
            dailyReward: dailyReward,
            maxReward: maxReward,
            minedAmount: 0,
            isStaked: false,
            stakeTime: 0
        });
    }

    // 将稀有度转换为字符串
    function _rarityToString(uint8 rarity) internal pure returns (string memory) {
        if (rarity == 3) return "SSR";
        if (rarity == 2) return "SR";
        if (rarity == 1) return "R";
        return "N";
    }

    // 设置盲盒价格（仅管理员）
    function setBoxPrice(uint256 newPrice) external onlyRole(DEFAULT_ADMIN_ROLE) {
        boxPrice = newPrice;
        emit BoxPriceUpdated(newPrice);
    }

    // 设置NFT图片（仅管理员）
    function setNFTImages(uint8 rarity, string[] memory images) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(rarity <= 3, "Invalid rarity");
        delete _nftImages[rarity];
        for(uint i = 0; i < images.length; i++) {
            _nftImages[rarity].push(images[i]);
        }
    }

    // 更新NFT质押状态（仅质押合约）
    function updateStakeStatus(uint256 tokenId, bool isStaked) external onlyRole(STAKING_ROLE) {
        require(_ownerOf(tokenId) != BURN_ADDRESS, "Token does not exist");
        nftAttributes[tokenId].isStaked = isStaked;
        if (isStaked) {
            nftAttributes[tokenId].stakeTime = block.timestamp;
        } else {
            nftAttributes[tokenId].stakeTime = 0;
        }
    }

    // 授权质押合约
    function setStakingContract(address stakingContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(stakingContract != BURN_ADDRESS, "Invalid staking contract");
        _grantRole(STAKING_ROLE, stakingContract);
    }

    // 销毁NFT（仅质押合约）
    function burn(uint256 tokenId) external onlyRole(STAKING_ROLE) {
        require(_ownerOf(tokenId) != BURN_ADDRESS, "Token does not exist");
        _burn(tokenId);
    }

    // 获取NFT属性
    function getNFTAttributes(uint256 tokenId) external view returns (
        uint8 rarity,
        uint256 power,
        uint256 dailyReward,
        uint256 maxReward,
        uint256 minedAmount,
        bool isStaked,
        uint256 stakeTime
    ) {
        require(_ownerOf(tokenId) != BURN_ADDRESS, "Token does not exist");
        NFTAttributes memory attrs = nftAttributes[tokenId];
        return (
            attrs.rarity,
            attrs.power,
            attrs.dailyReward,
            attrs.maxReward,
            attrs.minedAmount,
            attrs.isStaked,
            attrs.stakeTime
        );
    }

    // 获取NFT授权地址
    function getApproved(uint256 tokenId) public view override(ERC721, IERC721) returns (address) {
        require(_ownerOf(tokenId) != BURN_ADDRESS, "Token does not exist");
        return super.getApproved(tokenId);
    }

    // 检查是否全部授权
    function isApprovedForAll(address owner, address operator) public view override(ERC721, IERC721) returns (bool) {
        return super.isApprovedForAll(owner, operator);
    }

    // 更新已挖矿数量（仅质押合约）
    function updateMinedAmount(uint256 tokenId, uint256 amount) external onlyRole(STAKING_ROLE) {
        require(_ownerOf(tokenId) != BURN_ADDRESS, "Token does not exist");
        nftAttributes[tokenId].minedAmount = amount;
    }

    // 生成NFT元数据
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_ownerOf(tokenId) != BURN_ADDRESS, "Token does not exist");
        return _generateTokenURI(tokenId);
    }

    // 内部函数：生成元数据
    function _generateTokenURI(uint256 tokenId) internal view returns (string memory) {
        NFTAttributes memory nft = nftAttributes[tokenId];
        
        string memory part1 = string(abi.encodePacked(
            '{"name":"Mystery Box #', tokenId.toString(),
            '","description":"A mysterious NFT","image":"', getNFTImageURI(tokenId),
            '","attributes":[{"trait_type":"Rarity","value":"', _rarityToString(nft.rarity), '"}'
        ));
        
        string memory part2 = string(abi.encodePacked(
            ',{"trait_type":"Power","value":', nft.power.toString(),
            '},{"trait_type":"Daily Reward","value":', nft.dailyReward.toString(),
            '},{"trait_type":"Max Reward","value":', nft.maxReward.toString()
        ));
        
        string memory part3 = string(abi.encodePacked(
            '},{"trait_type":"Mined Amount","value":', nft.minedAmount.toString(),
            '},{"trait_type":"Is Staked","value":', nft.isStaked ? "true" : "false",
            '}]}'
        ));

        string memory json = string(abi.encodePacked(part1, part2, part3));
        json = Base64.encode(bytes(json));
        return string(abi.encodePacked('data:application/json;base64,', json));
    }

    // 获取NFT图片URI
    function getNFTImageURI(uint256 tokenId) public view returns (string memory) {
        require(_ownerOf(tokenId) != BURN_ADDRESS, "Token does not exist");
        uint8 rarity = nftAttributes[tokenId].rarity;
        
        string[] storage images = _nftImages[rarity];
        require(images.length > 0, "No images configured");
        uint256 index = uint256(keccak256(abi.encodePacked(tokenId))) % images.length;
        return images[index];
    }

    // 获取NFT等级
    function getNFTRarity(uint256 tokenId) external view returns (string memory) {
        require(_ownerOf(tokenId) != BURN_ADDRESS, "Token does not exist");
        return _rarityToString(nftAttributes[tokenId].rarity);
    }

    // 获取NFT算力
    function getNFTPower(uint256 tokenId) external view returns (uint256) {
        require(_ownerOf(tokenId) != BURN_ADDRESS, "Token does not exist");
        return nftAttributes[tokenId].power;
    }

    // 获取NFT每日收益
    function getNFTDailyReward(uint256 tokenId) external view returns (uint256) {
        require(_ownerOf(tokenId) != BURN_ADDRESS, "Token does not exist");
        return nftAttributes[tokenId].dailyReward;
    }

    // 查询用户开盒次数
    function getUserBoxOpenCount(address user) external view returns (uint256) {
        return userBoxOpenCount[user];
    }
}
