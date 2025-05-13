// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Nonces.sol";

contract CustomToken is ERC20, ERC20Permit, ERC20Votes, ERC20Burnable, Ownable, Pausable {
    bool public isMintable;
    bool public isBurnable;
    bool public isWhitelistEnabled;

    mapping(address => bool) public whitelist;
    mapping(address => bool) public blacklist;

    address[] private whitelistAddresses;
    address[] private blacklistAddresses;

    event WhitelistUpdated(address indexed account, bool isWhitelisted);
    event BlacklistUpdated(address indexed account, bool isBlacklisted);
    event WhitelistEnabled(bool enabled);

    constructor(
        string memory name,
        string memory symbol,
        uint256 supply,
        bool _isMintable,
        bool _isBurnable,
        address tokenOwner
    ) 
        ERC20(name, symbol)
        ERC20Permit(name)
        Ownable(tokenOwner)
    {
        _mint(tokenOwner, supply * 10 ** decimals());
        isMintable = _isMintable;
        isBurnable = _isBurnable;
        isWhitelistEnabled = false;
    }

    // --- PAUSABLE ---
    function pause() public onlyOwner {
        _pause();
    }
    function unpause() public onlyOwner {
        _unpause();
    }

    // --- MINT ---
    function mint(address to, uint256 amount) external onlyOwner whenNotPaused {
        require(isMintable, "Minting is disabled");
        _mint(to, amount);
    }

    // --- BURN ---
    function burn(uint256 amount) public virtual override whenNotPaused {
        require(isBurnable, "Burning is disabled");
        super.burn(amount);
    }
    function burnFrom(address account, uint256 amount) public virtual override whenNotPaused {
        require(isBurnable, "Burning is disabled");
        super.burnFrom(account, amount);
    }

    // --- WHITELIST ---
    function setWhitelistEnabled(bool enabled) external onlyOwner {
        isWhitelistEnabled = enabled;
        emit WhitelistEnabled(enabled);
    }
    function addToWhitelist(address account) external onlyOwner {
        if (!whitelist[account]) {
            whitelist[account] = true;
            whitelistAddresses.push(account);
            emit WhitelistUpdated(account, true);
        }
    }
    function removeFromWhitelist(address account) external onlyOwner {
        if (whitelist[account]) {
            whitelist[account] = false;
            // Remover do array usando swap and pop
            for (uint256 i = 0; i < whitelistAddresses.length; i++) {
                if (whitelistAddresses[i] == account) {
                    whitelistAddresses[i] = whitelistAddresses[whitelistAddresses.length - 1];
                    whitelistAddresses.pop();
                    break;
                }
            }
            emit WhitelistUpdated(account, false);
        }
    }
    function getWhitelist() external view returns (address[] memory) {
        return whitelistAddresses;
    }

    // --- BLACKLIST ---
    function addToBlacklist(address account) external onlyOwner {
        if (!blacklist[account]) {
            blacklist[account] = true;
            blacklistAddresses.push(account);
            emit BlacklistUpdated(account, true);
        }
    }
    function removeFromBlacklist(address account) external onlyOwner {
        if (blacklist[account]) {
            blacklist[account] = false;
            // Remover do array usando swap and pop
            for (uint256 i = 0; i < blacklistAddresses.length; i++) {
                if (blacklistAddresses[i] == account) {
                    blacklistAddresses[i] = blacklistAddresses[blacklistAddresses.length - 1];
                    blacklistAddresses.pop();
                    break;
                }
            }
            emit BlacklistUpdated(account, false);
        }
    }
    function getBlacklist() external view returns (address[] memory) {
        return blacklistAddresses;
    }

    // --- OZ 5.0 overrides ---
    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override(ERC20, ERC20Votes) {
        // --- PAUSE, BLACKLIST, WHITELIST CHECKS ---
        require(!paused(), "Token: paused");
        require(!blacklist[from] && !blacklist[to], "Token: address blacklisted");
        if (isWhitelistEnabled && from != address(0)) {
            require(whitelist[to], "Token: recipient not whitelisted");
        }
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        virtual
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
