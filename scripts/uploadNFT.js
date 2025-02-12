const fs = require('fs');
const path = require('path');
const { create } = require('ipfs-http-client');
const { ethers } = require('ethers');

// 连接到IPFS（这里使用Infura的IPFS服务，您需要替换为自己的项目ID和密钥）
const ipfs = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
        authorization: 'Basic ' + Buffer.from(PROJECT_ID + ':' + PROJECT_SECRET).toString('base64')
    }
});

// NFT元数据生成
async function generateMetadata(name, description, image, attributes) {
    return {
        name: name,
        description: description,
        image: image,
        attributes: attributes
    };
}

// 上传图片到IPFS
async function uploadImageToIPFS(imagePath) {
    try {
        const file = fs.readFileSync(imagePath);
        const added = await ipfs.add(file);
        const imageUrl = `https://ipfs.io/ipfs/${added.path}`;
        console.log('Image uploaded:', imageUrl);
        return imageUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}

// 上传元数据到IPFS
async function uploadMetadataToIPFS(metadata) {
    try {
        const data = JSON.stringify(metadata);
        const added = await ipfs.add(data);
        const metadataUrl = `https://ipfs.io/ipfs/${added.path}`;
        console.log('Metadata uploaded:', metadataUrl);
        return metadataUrl;
    } catch (error) {
        console.error('Error uploading metadata:', error);
        throw error;
    }
}

// 主函数：处理NFT上传
async function uploadNFT(imagePath, name, description, attributes) {
    try {
        // 1. 上传图片到IPFS
        const imageUrl = await uploadImageToIPFS(imagePath);

        // 2. 生成并上传元数据
        const metadata = await generateMetadata(name, description, imageUrl, attributes);
        const metadataUrl = await uploadMetadataToIPFS(metadata);

        // 3. 返回IPFS链接
        return {
            imageUrl,
            metadataUrl
        };
    } catch (error) {
        console.error('Error in uploadNFT:', error);
        throw error;
    }
}

// 批量上传NFT
async function batchUploadNFTs(nftDataArray) {
    const results = [];
    for (const nftData of nftDataArray) {
        const result = await uploadNFT(
            nftData.imagePath,
            nftData.name,
            nftData.description,
            nftData.attributes
        );
        results.push(result);
    }
    return results;
}

// 使用示例
async function main() {
    // 单个NFT上传
    const result = await uploadNFT(
        './images/nft1.png',
        'My NFT #1',
        'This is my first NFT',
        [
            { trait_type: 'Rarity', value: 'SSR' },
            { trait_type: 'Power', value: '6400' }
        ]
    );
    console.log('Upload complete:', result);

    // 批量上传
    const nftDataArray = [
        {
            imagePath: './images/nft2.png',
            name: 'My NFT #2',
            description: 'Second NFT',
            attributes: [
                { trait_type: 'Rarity', value: 'SR' },
                { trait_type: 'Power', value: '1600' }
            ]
        },
        // 可以添加更多NFT数据
    ];
    const batchResults = await batchUploadNFTs(nftDataArray);
    console.log('Batch upload complete:', batchResults);
}

// 运行脚本
main().catch(console.error);
