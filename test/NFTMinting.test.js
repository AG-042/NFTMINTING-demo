const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMinting", function () {
  let nftContract;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  const name = "Test NFT";
  const symbol = "TNFT";
  const baseURI = "https://test.com/";
  const mintPrice = ethers.utils.parseEther("0.01");

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const NFTMinting = await ethers.getContractFactory("NFTMinting");
    nftContract = await NFTMinting.deploy(name, symbol, baseURI, owner.address);
    await nftContract.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nftContract.owner()).to.equal(owner.address);
    });

    it("Should set the correct name and symbol", async function () {
      expect(await nftContract.name()).to.equal(name);
      expect(await nftContract.symbol()).to.equal(symbol);
    });

    it("Should set the correct mint price", async function () {
      expect(await nftContract.mintPrice()).to.equal(mintPrice);
    });
  });

  describe("Minting", function () {
    it("Should mint NFT successfully with correct payment", async function () {
      const metadataURI = "QmTestHash123";
      const quantity = 1;
      const cost = await nftContract.calculateCost(quantity);

      await expect(
        nftContract.connect(addr1).mint(addr1.address, quantity, [metadataURI], {
          value: cost,
        })
      ).to.emit(nftContract, "NFTMinted");

      expect(await nftContract.ownerOf(0)).to.equal(addr1.address);
      expect(await nftContract.tokenURI(0)).to.equal(metadataURI);
    });

    it("Should fail with insufficient payment", async function () {
      const metadataURI = "QmTestHash123";
      const quantity = 1;
      const insufficientPayment = ethers.utils.parseEther("0.005");

      await expect(
        nftContract.connect(addr1).mint(addr1.address, quantity, [metadataURI], {
          value: insufficientPayment,
        })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should refund excess payment", async function () {
      const metadataURI = "QmTestHash123";
      const quantity = 1;
      const cost = await nftContract.calculateCost(quantity);
      const excessPayment = cost.add(ethers.utils.parseEther("0.01"));

      const balanceBefore = await addr1.getBalance();
      const tx = await nftContract.connect(addr1).mint(addr1.address, quantity, [metadataURI], {
        value: excessPayment,
      });
      const receipt = await tx.wait();
      const balanceAfter = await addr1.getBalance();

      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      const expectedBalance = balanceBefore.sub(cost).sub(gasUsed);

      expect(balanceAfter).to.equal(expectedBalance);
    });

    it("Should enforce max per transaction limit", async function () {
      const quantity = 4; // MAX_PER_TX is 3
      const metadataURIs = Array(quantity).fill("QmTestHash");
      const cost = await nftContract.calculateCost(quantity);

      await expect(
        nftContract.connect(addr1).mint(addr1.address, quantity, metadataURIs, {
          value: cost,
        })
      ).to.be.revertedWith("Invalid mint quantity");
    });

    it("Should enforce max per wallet limit", async function () {
      // First mint 3 NFTs
      let quantity = 3;
      let metadataURIs = Array(quantity).fill("QmTestHash1");
      let cost = await nftContract.calculateCost(quantity);

      await nftContract.connect(addr1).mint(addr1.address, quantity, metadataURIs, {
        value: cost,
      });

      // Try to mint 3 more (would exceed MAX_PER_WALLET of 5)
      quantity = 3;
      metadataURIs = Array(quantity).fill("QmTestHash2");
      cost = await nftContract.calculateCost(quantity);

      await expect(
        nftContract.connect(addr1).mint(addr1.address, quantity, metadataURIs, {
          value: cost,
        })
      ).to.be.revertedWith("Exceeds maximum per wallet");
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to mint without payment", async function () {
      const metadataURI = "QmOwnerHash123";
      const quantity = 1;

      await expect(
        nftContract.connect(owner).ownerMint(addr1.address, quantity, [metadataURI])
      ).to.emit(nftContract, "NFTMinted");

      expect(await nftContract.ownerOf(0)).to.equal(addr1.address);
    });

    it("Should allow owner to update mint price", async function () {
      const newPrice = ethers.utils.parseEther("0.02");

      await expect(nftContract.connect(owner).setMintPrice(newPrice))
        .to.emit(nftContract, "MintPriceUpdated")
        .withArgs(mintPrice, newPrice);

      expect(await nftContract.mintPrice()).to.equal(newPrice);
    });

    it("Should not allow non-owner to update mint price", async function () {
      const newPrice = ethers.utils.parseEther("0.02");

      await expect(
        nftContract.connect(addr1).setMintPrice(newPrice)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should allow owner to pause and unpause", async function () {
      await nftContract.connect(owner).pause();
      expect(await nftContract.paused()).to.be.true;

      // Should not be able to mint when paused
      const metadataURI = "QmTestHash123";
      const quantity = 1;
      const cost = await nftContract.calculateCost(quantity);

      await expect(
        nftContract.connect(addr1).mint(addr1.address, quantity, [metadataURI], {
          value: cost,
        })
      ).to.be.revertedWith("Pausable: paused");

      await nftContract.connect(owner).unpause();
      expect(await nftContract.paused()).to.be.false;
    });
  });

  describe("Withdrawal", function () {
    beforeEach(async function () {
      // Mint some NFTs to generate revenue
      const metadataURIs = ["QmHash1", "QmHash2"];
      const quantity = 2;
      const cost = await nftContract.calculateCost(quantity);

      await nftContract.connect(addr1).mint(addr1.address, quantity, metadataURIs, {
        value: cost,
      });
    });

    it("Should allow owner to withdraw funds", async function () {
      const contractBalance = await ethers.provider.getBalance(nftContract.address);
      const ownerBalanceBefore = await owner.getBalance();

      const tx = await nftContract.connect(owner).withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

      const ownerBalanceAfter = await owner.getBalance();
      const expectedBalance = ownerBalanceBefore.add(contractBalance).sub(gasUsed);

      expect(ownerBalanceAfter).to.equal(expectedBalance);
      expect(await ethers.provider.getBalance(nftContract.address)).to.equal(0);
    });

    it("Should not allow non-owner to withdraw", async function () {
      await expect(
        nftContract.connect(addr1).withdraw()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("View Functions", function () {
    it("Should return correct total supply", async function () {
      expect(await nftContract.totalSupply()).to.equal(0);

      // Mint 2 NFTs
      const metadataURIs = ["QmHash1", "QmHash2"];
      const quantity = 2;
      const cost = await nftContract.calculateCost(quantity);

      await nftContract.connect(addr1).mint(addr1.address, quantity, metadataURIs, {
        value: cost,
      });

      expect(await nftContract.totalSupply()).to.equal(2);
    });

    it("Should return correct remaining supply", async function () {
      const maxSupply = await nftContract.MAX_SUPPLY();
      expect(await nftContract.remainingSupply()).to.equal(maxSupply);

      // Mint 1 NFT
      const metadataURI = "QmHash1";
      const quantity = 1;
      const cost = await nftContract.calculateCost(quantity);

      await nftContract.connect(addr1).mint(addr1.address, quantity, [metadataURI], {
        value: cost,
      });

      expect(await nftContract.remainingSupply()).to.equal(maxSupply.sub(1));
    });

    it("Should correctly check if address can mint", async function () {
      expect(await nftContract.canMint(addr1.address, 1)).to.be.true;
      expect(await nftContract.canMint(addr1.address, 4)).to.be.false; // Exceeds MAX_PER_TX
      expect(await nftContract.canMint(addr1.address, 0)).to.be.false; // Invalid quantity
    });
  });
});
