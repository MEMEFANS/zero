const { ethers } = require("hardhat");
const nftImagesConfig = require("./nft-images-config");

async function main() {
    // 获取合约实例
    const mysteryBoxFacet = await ethers.getContractAt(
        "MysteryBoxFacet",
        process.env.DIAMOND_ADDRESS // 确保在.env文件中设置了DIAMOND_ADDRESS
    );

    console.log("Setting NFT images configuration...");
    
    // 调用setNFTImageConfig函数
    const tx = await mysteryBoxFacet.setNFTImageConfig(
        nftImagesConfig.normalImages,
        nftImagesConfig.rareImages,
        nftImagesConfig.superRareImages,
        nftImagesConfig.ssrImages
    );

    console.log("Transaction sent:", tx.hash);
    await tx.wait();
    console.log("NFT images configuration has been set successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
