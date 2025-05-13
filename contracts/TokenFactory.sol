// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CustomToken.sol";

/// @title TokenFactory - Factory contract for creating new CustomToken instances
/// @notice This contract allows users to create new ERC20 tokens with voting and permit capabilities
contract TokenFactory {
    /// @notice Array of deployed token addresses
    address[] public deployedTokens;

    /// @notice Fee receiver address for token creation
    address public feeReceiver;

    /// @notice Fixed fee amount for token creation (2.5 CELO)
    uint256 public constant FEE_AMOUNT = 2.5 ether;

    /// @notice Emitted when a new token is created
    /// @param tokenAddress The address of the newly created token
    /// @param name The name of the token
    /// @param symbol The symbol of the token
    /// @param initialSupply The initial supply of the token
    /// @param isMintable Whether the token can be minted
    /// @param isBurnable Whether the token can be burned
    event TokenCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        uint256 initialSupply,
        bool isMintable,
        bool isBurnable
    );

    /// @notice Sets the fee receiver address
    /// @param _feeReceiver Address that will receive the creation fees
    constructor(address _feeReceiver) {
        require(_feeReceiver != address(0), "Invalid fee receiver");
        feeReceiver = _feeReceiver;
    }

    /// @notice Creates a new CustomToken with the specified parameters
    /// @param name Name of the token
    /// @param symbol Symbol of the token
    /// @param initialSupply Initial supply of the token
    /// @param isMintable Whether the token should be mintable
    /// @param isBurnable Whether the token should be burnable
    /// @dev The msg.sender will be set as the token owner
    function createToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        bool isMintable,
        bool isBurnable
    ) external payable {
        require(msg.value >= FEE_AMOUNT, "Insufficient fee");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(symbol).length > 0, "Symbol cannot be empty");

        // Create new token with msg.sender as the owner
        CustomToken token = new CustomToken(
            name,
            symbol,
            initialSupply,
            isMintable,
            isBurnable,
            msg.sender
        );

        // Store the token address
        deployedTokens.push(address(token));

        // Emit creation event
        emit TokenCreated(
            address(token),
            name,
            symbol,
            initialSupply,
            isMintable,
            isBurnable
        );

        // Transfer the creation fee
        payable(feeReceiver).transfer(FEE_AMOUNT);
    }

    /// @notice Returns all tokens created by this factory
    /// @return Array of deployed token addresses
    function getDeployedTokens() external view returns (address[] memory) {
        return deployedTokens;
    }

    /// @notice Returns the number of tokens created by this factory
    /// @return Number of deployed tokens
    function getDeployedTokenCount() external view returns (uint256) {
        return deployedTokens.length;
    }

    /// @notice Returns the current fee amount in CELO
    /// @return The fee amount in CELO
    function getFeeAmount() external pure returns (uint256) {
        return FEE_AMOUNT;
    }
}
