// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title CampusCredit
 * @dev Production-style ERC-20 token with advanced features for DIDLab Assignment 3
 * Features: Burnable, Pausable, Capped, AccessControl, Batch Airdrop
 */
contract CampusCredit is ERC20, ERC20Burnable, ERC20Capped, ERC20Pausable, AccessControl {
    // Define role constants
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Custom errors for gas efficiency
    error ArrayLengthMismatch();
    error CapExceeded(uint256 totalSupply, uint256 cap, uint256 amount);
    error InvalidRecipient();

    /**
     * @dev Constructor to initialize the token
     * @param name Token name
     * @param symbol Token symbol
     * @param cap Maximum supply (in wei units)
     * @param initialReceiver Address to receive initial mint
     * @param initialMint Amount to mint initially (in wei units)
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 cap,
        address initialReceiver,
        uint256 initialMint
    ) ERC20(name, symbol) ERC20Capped(cap) {
        // Grant roles to the deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);

        // Mint initial supply to specified receiver
        if (initialMint > 0) {
            _mint(initialReceiver, initialMint);
        }
    }

    /**
     * @dev Pause token transfers (restricted to PAUSER_ROLE)
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause token transfers (restricted to PAUSER_ROLE)
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Mint new tokens (restricted to MINTER_ROLE)
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /**
     * @dev Batch airdrop tokens to multiple recipients (restricted to MINTER_ROLE)
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to airdrop
     */
    function airdrop(address[] calldata recipients, uint256[] calldata amounts) external onlyRole(MINTER_ROLE) {
        // Check array lengths match
        if (recipients.length != amounts.length) {
            revert ArrayLengthMismatch();
        }

        // Calculate total amount to mint
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; ) {
            totalAmount += amounts[i];
            unchecked {
                ++i;
            }
        }

        // Check if minting would exceed cap
        if (totalSupply() + totalAmount > cap()) {
            revert CapExceeded(totalSupply(), cap(), totalAmount);
        }

        // Perform batch minting
        for (uint256 i = 0; i < recipients.length; ) {
            if (recipients[i] == address(0)) {
                revert InvalidRecipient();
            }
            _mint(recipients[i], amounts[i]);
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev Returns the number of decimals (standard 18)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }

    // Required overrides for multiple inheritance
    function _update(address from, address to, uint256 value) 
        internal 
        override(ERC20, ERC20Capped, ERC20Pausable) 
    {
        super._update(from, to, value);
    }
}
