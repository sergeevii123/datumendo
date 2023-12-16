// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol';
import '@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol';
import './helpers/AdminAccess.sol';

contract DatumendoNFT is ERC721, ERC721Burnable, ERC721Holder, AdminAccess {

    constructor(
        string memory name_,
        string memory symbol_
    ) ERC721(name_, symbol_) {
    }

    function safeMint(
        address to, 
        bytes memory data
    ) public onlyAdminOrOwner returns (uint256) {
        super._safeMint(to, 1, data);
        return 1;
    }

    function setTokenURI(
        uint256 tokenId,
        string memory tokenURI
    ) public onlyAdminOrOwner {

    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(_exists(tokenId), 'NFT: URI query for nonexistent token');
        return _tokenURI(tokenId);
    }

    function _tokenURI(
        uint256 tokenId
    ) internal view virtual returns (string memory) {
        return "";
    }
}
