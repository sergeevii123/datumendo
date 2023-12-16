const hre = require("hardhat");

const dateTimeLibrary = dateTimeLibraryGoerli;

var currentDescriptorAddressGoerli = "0x540F5801bfCd140D20d935359B4C0aa8d479C54c";
var currentNFTAddressGoerli = "0x912Aa471EDf134fE9E175b27dC40f43511b1f56A";

var currentDescriptorAddressApothem = "0x58F0fa955654e77ca9736Fb9B6BffE065811523A"
var currentNFTAddressApothem = "0x479c628cc6C557861E630C9575A6eaC2f076AB59"

var currentDescriptorAddress = "";
var currentNFTAddress = "";

const verify = false

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Uncomment if you'd like to just mint, include return, remember to set the addresses above
  // await mintToken(elvis, elvisScale)
  // await mintToken(phone, phoneScale)
  // return

  /* Unneeded since we don't setup an external library link yet
  if (dateTimeLibrary == "") {
    const TimeLibrary = await ethers.getContractFactory("BokkyPooBahsDateTimeLibrary");
    const timeLibrary = await TimeLibrary.deploy();
    await timeLibrary.deployed();
    console.log("Address of TimeLibrary:", timeLibrary.address);
    dateTimeLibrary = timeLibrary.address

    await delay(20000);
    await hre.run("verify:verify", {
      address: dateTimeLibrary,
      contract: "contracts/libraries/BokkyPooBahsDateTimeLibrary.sol:BokkyPooBahsDateTimeLibrary",
      constructorArguments: [
      ],
      libraries: {
      }
    });
  }
  */

  const NFTDescriptor = await ethers.getContractFactory("NFTDescriptor");
  const nftDescriptorLib = await NFTDescriptor.deploy();
  await nftDescriptorLib.deployed();

  console.log("Library address:", nftDescriptorLib.address);
  currentDescriptorAddress = nftDescriptorLib.address

  const OnchainArt = await ethers.getContractFactory("OnchainArt", {
    libraries: {
      NFTDescriptor: currentDescriptorAddress,
    },
  });
  const name = "OnchainArt";
  const symbol = "OnchainArt";
  const collectionSymbol = "OnchainArt";
  const onchainArt = await OnchainArt.deploy(
    name,
    symbol,
    collectionSymbol,
  );
  await onchainArt.deployed();

  console.log("Token address:", onchainArt.address);
  currentNFTAddress = onchainArt.address;

  if (verify) {
    // The delay is necessary to avoid "the address does not have bytecode" error
  await delay(20000);

  await hre.run("verify:verify", {
    address: currentNFTAddress,
    constructorArguments: [
      name,
      symbol,
      collectionSymbol,
    ],
    libraries: {
      NFTDescriptor: currentDescriptorAddress,
    }
  });
  }

  await mintToken(elvis, elvisScale)
  await mintToken(phone, phoneScale)
}

async function mintToken(svgPath, scale) {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const OnchainArt = await ethers.getContractFactory("OnchainArt", {
    libraries: {
      NFTDescriptor: currentDescriptorAddress,
    },
  });
  const contract = await OnchainArt.attach(
    currentNFTAddress // The deployed contract address
  );

  // Now you can call functions of the contract
  const result = await contract.mint(
    deployer.address,
    // 1702785345,
    svgPath,
    scale
  );
  console.log(result);
}

const delay = ms => new Promise(res => setTimeout(res, ms));

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
