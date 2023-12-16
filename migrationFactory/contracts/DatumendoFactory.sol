// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
// import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

import './DatumendoNFT.sol';

import './helpers/AdminAccess.sol';

contract DatumendoFactory is AdminAccess {

    using SafeERC20 for IERC20;

    /* ========== CONSTANTS ========== */

    /* ========== STATE VARIABLES ========== */
    mapping(address => address) public wrappedCollections;

    mapping(address => uint[]) public userIds;


    string public collectionSymbol;

    /* ========== CONSTRUCTOR ========== */

    constructor(
    ) {
    }

    /* ========== ADMIN FUNCTIONS ========== */
    
    function mint(
        address collectionAddress, 
        string calldata svgPath,
        string calldata scale
    ) public returns(uint tokenId) {
    }

    /* ========== USER FUNCTIONS ========== */

    function transfer(address to, uint tokenId) public {
        // require(ownerOf(tokenId) == msg.sender, "Datumendo: You are not the owner");
    }

    /* ========== VIEWS ========== */

    function userIdsLength(address user) public view returns(uint) {
        return userIds[user].length;
    }
}
