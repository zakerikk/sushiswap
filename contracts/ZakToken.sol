// SPDX-License-Identifier: MIT

//SPDX-License-Identifier: CC0-1.0
pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ZakToken is ERC20 {
    uint8 constant _DECIMALS = 18;
    uint256 constant _TOTALCAP = 1000000000;

    constructor(
        string memory name,
        string memory symbol,
        address dao
    ) ERC20(name, symbol) {
        uint256 _maxSupply = _TOTALCAP * (uint256(10) ** _DECIMALS);
        _mint(dao, _maxSupply);
    }
}
