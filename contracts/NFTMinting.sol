// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title NFTMinting
 * @dev ERC721 NFT contract with minting functionality, IPFS metadata support, and security features
 * @author Your Name
 */
contract NFTMinting is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;

    // Token ID counter
    Counters.Counter private _tokenIdCounter;

    // Maximum supply of NFTs
    uint256 public constant MAX_SUPPLY = 10000;

    // Minting price in wei (0.01 ETH)
    uint256 public mintPrice = 0.01 ether;

    // Maximum NFTs per wallet
    uint256 public constant MAX_PER_WALLET = 5;

    // Maximum NFTs per transaction
    uint256 public constant MAX_PER_TX = 3;

    // Mapping to track minted count per address
    mapping(address => uint256) public mintedCount;

    // Mapping to track creator of each token
    mapping(uint256 => address) public tokenCreator;

    // Base URI for metadata
    string private _baseTokenURI;

    // Events
    event NFTMinted(address indexed to, uint256 indexed tokenId, string tokenURI);
    event NFTCreated(address indexed creator, address indexed to, uint256 indexed tokenId, string tokenURI);
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event BaseURIUpdated(string oldURI, string newURI);
    event Withdrawal(address indexed to, uint256 amount);

    /**
     * @dev Constructor sets the NFT name, symbol, and initial owner
     */
    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI,
        address initialOwner
    ) ERC721(name, symbol) {
        _baseTokenURI = baseTokenURI;
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Mint NFTs to a specified address with IPFS metadata URI
     * @param to Address to mint NFTs to
     * @param quantity Number of NFTs to mint
     * @param metadataURIs Array of IPFS metadata URIs for each NFT
     */
    function mint(
        address to,
        uint256 quantity,
        string[] memory metadataURIs
    ) external payable nonReentrant whenNotPaused {
        // Input validation
        require(to != address(0), "Cannot mint to zero address");
        require(quantity > 0 && quantity <= MAX_PER_TX, "Invalid mint quantity");
        require(metadataURIs.length == quantity, "Metadata URI count mismatch");
        require(msg.value >= mintPrice * quantity, "Insufficient payment");

        // Supply and wallet limits
        uint256 currentSupply = _tokenIdCounter.current();
        require(currentSupply + quantity <= MAX_SUPPLY, "Exceeds maximum supply");
        require(
            mintedCount[to] + quantity <= MAX_PER_WALLET,
            "Exceeds maximum per wallet"
        );

        // Update minted count
        mintedCount[to] += quantity;

        // Mint NFTs
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();

            _safeMint(to, tokenId);
            _setTokenURI(tokenId, metadataURIs[i]);

            emit NFTMinted(to, tokenId, metadataURIs[i]);
            emit NFTCreated(msg.sender, to, tokenId, metadataURIs[i]);
        }

        // Refund excess payment
        uint256 totalCost = mintPrice * quantity;
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
    }

    /**
     * @dev Owner-only function to mint NFTs without payment (for airdrops, etc.)
     * @param to Address to mint NFTs to
     * @param quantity Number of NFTs to mint
     * @param metadataURIs Array of IPFS metadata URIs for each NFT
     */
    function ownerMint(
        address to,
        uint256 quantity,
        string[] memory metadataURIs
    ) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(quantity > 0, "Invalid mint quantity");
        require(metadataURIs.length == quantity, "Metadata URI count mismatch");

        uint256 currentSupply = _tokenIdCounter.current();
        require(currentSupply + quantity <= MAX_SUPPLY, "Exceeds maximum supply");

        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();

            _safeMint(to, tokenId);
            _setTokenURI(tokenId, metadataURIs[i]);

            emit NFTMinted(to, tokenId, metadataURIs[i]);
            emit NFTCreated(msg.sender, to, tokenId, metadataURIs[i]);
        }
    }

    /**
     * @dev Update the mint price (owner only)
     * @param newPrice New mint price in wei
     */
    function setMintPrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = mintPrice;
        mintPrice = newPrice;
        emit MintPriceUpdated(oldPrice, newPrice);
    }

    /**
     * @dev Update the base token URI (owner only)
     * @param newBaseURI New base URI for metadata
     */
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        string memory oldURI = _baseTokenURI;
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(oldURI, newBaseURI);
    }

    /**
     * @dev Pause the contract (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Withdraw contract balance to owner
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");

        emit Withdrawal(owner(), balance);
    }

    /**
     * @dev Emergency withdraw function to specific address
     * @param to Address to withdraw funds to
     */
    function emergencyWithdraw(address payable to) external onlyOwner {
        require(to != address(0), "Cannot withdraw to zero address");
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = to.call{value: balance}("");
        require(success, "Emergency withdrawal failed");

        emit Withdrawal(to, balance);
    }

    // View functions

    /**
     * @dev Get the current total supply of minted NFTs
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    /**
     * @dev Get the remaining supply available for minting
     */
    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - _tokenIdCounter.current();
    }

    /**
     * @dev Check if a specific quantity can be minted by an address
     * @param minter Address to check
     * @param quantity Quantity to check
     */
    function canMint(address minter, uint256 quantity) external view returns (bool) {
        if (paused()) return false;
        if (quantity == 0 || quantity > MAX_PER_TX) return false;
        if (_tokenIdCounter.current() + quantity > MAX_SUPPLY) return false;
        if (mintedCount[minter] + quantity > MAX_PER_WALLET) return false;
        return true;
    }

    /**
     * @dev Calculate the total cost for minting a specific quantity
     * @param quantity Number of NFTs to calculate cost for
     */
    function calculateCost(uint256 quantity) external view returns (uint256) {
        return mintPrice * quantity;
    }

    // Internal and override functions

    /**
     * @dev Override _baseURI to return the custom base URI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Override _burn to handle URI storage
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    /**
     * @dev Override tokenURI to handle URI storage
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Override supportsInterface for multiple inheritance
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
