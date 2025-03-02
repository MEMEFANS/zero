// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IUniswapV2Factory {
    function createPair(address tokenA, address tokenB) external returns (address pair);
}

interface IUniswapV2Router02 {
    function factory() external pure returns (address);
    function WETH() external pure returns (address);
    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external;
    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external payable returns (uint256 amountToken, uint256 amountETH, uint256 liquidity);
    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external;
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity);
}

contract ZoneToken is ERC20, ERC20Burnable, Pausable, AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // 交易税率（可调整）
    uint256 public buyTax = 30;  // 3%
    uint256 public sellTax = 30; // 3%
    uint256 public constant TAX_DENOMINATOR = 1000;

    // 分红和营销配置
    uint256 public lpRewardShare = 10;     // LP分红 1%
    uint256 public marketingShare = 20;    // 营销钱包 2%
    address public marketingWallet;
    address public lpPairBNB;    // ZONE-BNB交易对
    address public lpPairUSDT;   // ZONE-USDT交易对

    // DEX路由和工厂
    IUniswapV2Router02 public immutable uniswapV2Router;
    
    // 排除交易税的地址
    mapping(address => bool) public isExcludedFromFee;
    
    // 是否在交易
    bool private inSwapAndLiquify;
    
    // 防止重入
    modifier lockTheSwap {
        inSwapAndLiquify = true;
        _;
        inSwapAndLiquify = false;
    }

    // 代币精度为18，总供应量为1亿
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10**18;  // 100M tokens

    // 最小交换阈值
    uint256 public minTokensBeforeSwap = 1000 * 10**18; // 1000 tokens

    // PancakeSwap路由地址 (BSC Mainnet)
    address private constant PANCAKE_ROUTER = 0x10ED43C718714eb63d5aA57B78B54704E256024E;
    // BSC上的USDT合约地址
    address private constant USDT = 0x55d398326f99059fF775485246999027B3197955;  // BSC上的USDT

    constructor(address _marketingWallet) ERC20("ZONE Token", "ZONE") {
        require(_marketingWallet != address(0), "Marketing wallet cannot be zero");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);

        marketingWallet = _marketingWallet;
        
        // 初始化PancakeSwap路由
        IUniswapV2Router02 _uniswapV2Router = IUniswapV2Router02(PANCAKE_ROUTER);
        uniswapV2Router = _uniswapV2Router;
        
        // 创建BNB交易对
        lpPairBNB = IUniswapV2Factory(_uniswapV2Router.factory())
            .createPair(address(this), _uniswapV2Router.WETH());

        // 创建USDT交易对
        lpPairUSDT = IUniswapV2Factory(_uniswapV2Router.factory())
            .createPair(address(this), USDT);

        // 排除合约和营销钱包的交易税
        isExcludedFromFee[address(this)] = true;
        isExcludedFromFee[msg.sender] = true;
        isExcludedFromFee[marketingWallet] = true;
        isExcludedFromFee[USDT] = true;

        // 初始铸造代币给部署者
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    // 接收BNB
    receive() external payable {}

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // 设置交易税率
    function setTaxes(uint256 _buyTax, uint256 _sellTax) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_buyTax <= 100, "Buy tax too high"); // 最高10%
        require(_sellTax <= 490, "Sell tax too high"); // 最高49%
        buyTax = _buyTax;
        sellTax = _sellTax;
    }

    // 设置分红比例
    function setShares(uint256 _lpRewardShare, uint256 _marketingShare) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_lpRewardShare + _marketingShare <= 1000, "Total share too high"); // 最高100%
        lpRewardShare = _lpRewardShare;
        marketingShare = _marketingShare;
    }

    // 设置营销钱包
    function setMarketingWallet(address _marketingWallet) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_marketingWallet != address(0), "Marketing wallet cannot be zero");
        marketingWallet = _marketingWallet;
    }

    // 排除/包含地址的交易税
    function excludeFromFee(address account, bool excluded) external onlyRole(DEFAULT_ADMIN_ROLE) {
        isExcludedFromFee[account] = excluded;
    }

    // 设置最小交换阈值
    function setMinTokensBeforeSwap(uint256 _minTokens) external onlyRole(DEFAULT_ADMIN_ROLE) {
        minTokensBeforeSwap = _minTokens;
    }

    // 计算交易税
    function calculateTaxFee(uint256 amount, bool isSellTx) private view returns (uint256) {
        if (isExcludedFromFee[msg.sender] || isExcludedFromFee[tx.origin]) {
            return 0;
        }
        return amount * (isSellTx ? sellTax : buyTax) / TAX_DENOMINATOR;
    }

    // 检查是否是卖出操作
    function checkIsSelling(address recipient) private view returns (bool) {
        return recipient == lpPairBNB || recipient == lpPairUSDT;
    }

    // 将代币换成BNB或USDT
    function swapTokensForBnbOrUsdt(uint256 tokenAmount, bool useUsdt) private {
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = useUsdt ? USDT : uniswapV2Router.WETH();

        _approve(address(this), address(uniswapV2Router), tokenAmount);

        uniswapV2Router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
            tokenAmount,
            0,
            path,
            address(this),
            block.timestamp
        );
    }

    // 处理收集到的费用
    function swapAndLiquify(uint256 tokenAmount) private lockTheSwap {
        // 分配代币
        uint256 lpTokens = tokenAmount * lpRewardShare / (lpRewardShare + marketingShare);
        uint256 marketingTokens = tokenAmount - lpTokens;

        // 将营销份额转给营销钱包
        if (marketingTokens > 0) {
            _transfer(address(this), marketingWallet, marketingTokens);
        }

        // 处理LP分红
        if (lpTokens > 0) {
            // 将代币分成两份，一半用于BNB池，一半用于USDT池
            uint256 halfLpTokens = lpTokens / 2;
            
            // BNB池子
            uint256 bnbHalf = halfLpTokens / 2;
            swapTokensForBnbOrUsdt(bnbHalf, false);
            uint256 bnbBalance = address(this).balance;
            if(bnbBalance > 0) {
                addLiquidityBNB(halfLpTokens - bnbHalf, bnbBalance);
            }

            // USDT池子
            uint256 usdtHalf = halfLpTokens / 2;
            swapTokensForBnbOrUsdt(usdtHalf, true);
            uint256 usdtBalance = IERC20(USDT).balanceOf(address(this));
            if(usdtBalance > 0) {
                addLiquidityUSDT(halfLpTokens - usdtHalf, usdtBalance);
            }
        }
    }

    // 添加BNB流动性
    function addLiquidityBNB(uint256 tokenAmount, uint256 bnbAmount) private {
        _approve(address(this), address(uniswapV2Router), tokenAmount);

        uniswapV2Router.addLiquidityETH{value: bnbAmount}(
            address(this),
            tokenAmount,
            0,
            0,
            address(this),
            block.timestamp
        );
    }

    // 添加USDT流动性
    function addLiquidityUSDT(uint256 tokenAmount, uint256 usdtAmount) private {
        _approve(address(this), address(uniswapV2Router), tokenAmount);
        IERC20(USDT).approve(address(uniswapV2Router), usdtAmount);

        uniswapV2Router.addLiquidity(
            address(this),
            USDT,
            tokenAmount,
            usdtAmount,
            0,
            0,
            address(this),
            block.timestamp
        );
    }

    // 转账函数
    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
        _customTransfer(_msgSender(), recipient, amount);
        return true;
    }

    // 授权转账函数
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public virtual override returns (bool) {
        _customTransfer(sender, recipient, amount);

        uint256 currentAllowance = allowance(sender, _msgSender());
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        unchecked {
            _approve(sender, _msgSender(), currentAllowance - amount);
        }

        return true;
    }

    // 自定义转账实现
    function _customTransfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal virtual {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");
        require(amount > 0, "Transfer amount must be greater than zero");
        require(!paused(), "Token transfer paused");

        // 如果正在处理流动性，直接转账
        if (inSwapAndLiquify) {
            _transfer(sender, recipient, amount);
            return;
        }

        // 检查是否需要处理累积的费用
        uint256 contractTokenBalance = balanceOf(address(this));
        bool overMinTokenBalance = contractTokenBalance >= minTokensBeforeSwap;
        
        if (
            overMinTokenBalance &&
            !inSwapAndLiquify &&
            sender != lpPairBNB &&
            sender != lpPairUSDT &&
            !isExcludedFromFee[sender] &&
            !isExcludedFromFee[recipient]
        ) {
            swapAndLiquify(contractTokenBalance);
        }

        // 计算交易税
        bool isSell = checkIsSelling(recipient);
        uint256 taxFee = calculateTaxFee(amount, isSell);
        uint256 transferAmount = amount - taxFee;

        // 转账
        if (taxFee > 0) {
            _transfer(sender, address(this), taxFee);
        }
        _transfer(sender, recipient, transferAmount);
    }

    // 紧急提取卡在合约里的代币
    function emergencyWithdraw(IERC20 token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(address(token) != address(this), "Cannot withdraw ZONE tokens");
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        token.transfer(msg.sender, balance);
    }

    // 紧急提取BNB
    function emergencyWithdrawETH() external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 balance = address(this).balance;
        require(balance > 0, "No BNB to withdraw");
        (bool success,) = msg.sender.call{value: balance}("");
        require(success, "BNB withdraw failed");
    }
}