const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OnchainArt", function () {
  it("Should return the new greeting once it's changed", async function () {
    const NFTDescriptor = await ethers.getContractFactory("NFTDescriptor");
    const nftDescriptorLib = await NFTDescriptor.deploy();
    await nftDescriptorLib.deployed();

    const DateTimeLibrary = await ethers.getContractFactory("NFTDescriptor");
    const dateTimeLibrary = await DateTimeLibrary.deploy();
    await dateTimeLibrary.deployed();

    const OnchainArt = await ethers.getContractFactory("OnchainArt", {
      libraries: {
        NFTDescriptor: nftDescriptorLib.address,
      },
    });
    const onchainArt = await OnchainArt.deploy(
      "OnchainArt",
      "OnchainArt",
      "OnchainArt",
      // dateTimeLibrary.address,
    );
    await onchainArt.deployed();
  });
});
