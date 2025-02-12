const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy DiamondCutFacet
  const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
  const diamondCutFacet = await DiamondCutFacet.deploy();
  await diamondCutFacet.deployed();
  console.log("DiamondCutFacet deployed to:", diamondCutFacet.address);

  // Deploy Diamond
  const Diamond = await ethers.getContractFactory("Diamond");
  const diamond = await Diamond.deploy(deployer.address, diamondCutFacet.address);
  await diamond.deployed();
  console.log("Diamond deployed to:", diamond.address);

  // Deploy NFTFacet
  const NFTFacet = await ethers.getContractFactory("NFTFacet");
  const nftFacet = await NFTFacet.deploy();
  await nftFacet.deployed();
  console.log("NFTFacet deployed to:", nftFacet.address);

  // Get function selectors from NFTFacet
  const selectors = Object.keys(NFTFacet.interface.functions).map(
    (fn) => NFTFacet.interface.getSighash(fn)
  );

  // Add NFTFacet to Diamond
  const diamondCut = await ethers.getContractAt("IDiamondCut", diamond.address);
  const tx = await diamondCut.diamondCut(
    [{
      facetAddress: nftFacet.address,
      action: 0, // Add
      functionSelectors: selectors
    }],
    ethers.constants.AddressZero,
    "0x"
  );
  await tx.wait();
  console.log("NFTFacet added to Diamond");

  // Initialize NFTFacet
  const nftFacetOnDiamond = await ethers.getContractAt("NFTFacet", diamond.address);
  const initTx = await nftFacetOnDiamond.initialize("ZERO NFT", "ZERONFT");
  await initTx.wait();
  console.log("NFTFacet initialized");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
