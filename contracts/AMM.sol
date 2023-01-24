pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

// AMM will do the following:
// [X] Manage Poll
// [X] Manage Deposits
// {X] Facilitates Swaps (i.e. Trades)
// [X] Manage Withdraws

contract AMM {
    Token public token1;
    Token public token2;

    uint256 public token1Balance;
    uint256 public token2Balance;
    uint256 public K;

    uint256 public totalShares;
    mapping (address => uint256) public shares; // mapping to deternine how many shares each individual has
    uint256 constant PRECISION = 10**18; // adding 18 0's for conversion

    // EVENTS
    event Swap(
        address user,
        address tokenGive,
        uint256 tokenGiveAmount,
        address tokenGet,
        uint256 tokenGetAmount,
        uint256 token1Balance,
        uint256 token2Balance,
        uint256 timestamp
    );    
    
    constructor(Token _token1, Token _token2) {
        token1 = _token1;
        token2 = _token2;        
    }

    function addLiquidity(uint256 _token1Amount, uint256 _token2Amount) external {
        // Deposit Tokens
        require(token1.transferFrom(msg.sender, address(this), _token1Amount), "failed to transfer token 1");
        require(token2.transferFrom(msg.sender, address(this), _token2Amount), "failed to transfer token 2");
                
        // Issue Shares
        uint256 share;

        // If first times adding liquidity, make share 100
        if (totalShares == 0) {
            share = 100 * PRECISION; // adding 18 0's for conversion
        } else {
            uint256 share1 = (totalShares * _token1Amount) / token1Balance; // (total shares) * Token1 amount) / token1Balance which is the total balance 
            uint256 share2 = (totalShares * _token2Amount) / token2Balance;

            // To invest in the pool they must deposit and equal amount of Sobek and USDC tokens
            require(
                (share1 / 10**3) == (share2 / 10**3), // round to 3 decimal places
                "must provide equal token amounts");
            share = share1;
        }

        // Manage Pool
        token1Balance += _token1Amount;
        token2Balance += _token2Amount;
        K = token1Balance * token2Balance; // contant product formula: x * y = k. K reamins constant during trade

        // Update shares
        totalShares += share;
        shares[msg.sender] += share;
    }

        // Determine how many token2 tokens must be dposited when depositing liquidity for token1 
    function calculateToken2Deposit(uint256 _token1Amount) public view returns(uint256 token2Amount) {
    // token 2 amount to deposit = TOTAL Amount to token 2 balance * token 1 amount depositing / Token 1 Balance  
        token2Amount = (token2Balance * _token1Amount) / token1Balance;            
        }

    // Determine how many token2 tokens must be dposited when depositing liquidity for token1
    function calculateToken1Deposit(uint256 _token2Amount) public view returns(uint256 token1Amount) {
        token1Amount = (token1Balance * _token2Amount) / token2Balance;
        }

    // Returns amount of token2 received when swapping token1
    function calculateToken1Swap(uint256 _token1Amount) public view returns(uint256 token2Amount) {
        // Pricing formula x * y = k >> want to know what y is after swap >>  y = k/x
        uint256 token1After = token1Balance + _token1Amount;
        uint token2After = K / token1After;
        token2Amount = token2Balance - token2After;

        // Don't let pool go to 0
        if (token2Amount == token2Balance) {
            token2Amount--;            
        }

        require(token2Amount < token2Balance, "Swap amount to large");  
    }

    function swapToken1(uint256 _token1Amount) external returns(uint256 token2Amount) {

        // Calculate Token 2 Amount
        token2Amount = calculateToken1Swap(_token1Amount);        
        
        // Do Swap
        // 1. Transfer tokens out of user wallet. Use transferFrom must approve tokens first then can specify a sender, receiver, and amount
        token1.transferFrom(msg.sender, address(this), _token1Amount);

        // 2. Update the token1 balance in the contract
        token1Balance += _token1Amount;

        // 3. Update the token2 balance in the contract
        token2Balance -= token2Amount;
        
        // 4. Transfer token2 tokens from contract to user wallet
        token2.transfer(msg.sender, token2Amount);

        // Emit an event
        emit Swap(
            msg.sender,         // user
            address(token1),    // tokenGive
            _token1Amount,     // tokenGiveAmount
            address(token2),    // tokenGet
            token2Amount,      // tokenGetAmount
            token1Balance,      // token1Balance
            token2Balance,      // token2Balance
            block.timestamp     // timestamp
        );        
    }


    // Returns amount of token1 received when swapping token2
    function calculateToken2Swap(uint256 _token2Amount) public view returns(uint256 token1Amount) {
        // Pricing formula x * y = k >> want to know what y is after swap >>  y = k/x
        uint256 token2After = token2Balance + _token2Amount;
        uint token1After = K / token2After;
        token1Amount = token1Balance - token1After;

        // Don't let pool go to 0
        if (token1Amount == token1Balance) {
            token1Amount--;            
        }

        require(token1Amount < token1Balance, "Swap amount to large");
    }


    // Swamp Token 2
    function swapToken2(uint256 _token2Amount) external returns(uint256 token1Amount) {

        // Calculate Token 1 Amount
        token1Amount = calculateToken2Swap(_token2Amount); 
        
        // Do Swap
        // 1. Transfer tokens out of user wallet. Use transferFrom must approve tokens first then can specify a sender, receiver, and amount
        token2.transferFrom(msg.sender, address(this), _token2Amount);

        // 2. Update the token2 balance in the contract
        token2Balance += _token2Amount;

        // 3. Update the token1 balance in the contract
        token1Balance -= token1Amount;
        
        // 4. Transfer token1 tokens from contract to user wallet
        token1.transfer(msg.sender, token1Amount);

        // Emit an event
        emit Swap(
            msg.sender,         // user
            address(token2),    // tokenGive
            _token2Amount,     // tokenGiveAmount
            address(token1),    // tokenGet
            token1Amount,      // tokenGetAmount
            token1Balance,      // token1Balance
            token2Balance,      // token2Balance
            block.timestamp     // timestamp
        );       
    }

    // Determine how many tokens will be withdrawn
    function calculateWithdrawAmount(uint256 _share) public view returns (uint256 token1Amount, uint256 token2Amount) {
        require(_share <= totalShares, "must be less that total shares");
        token1Amount = (_share * token1Balance) / totalShares;
        token2Amount = (_share * token2Balance) / totalShares;
    }

    // Removes liquidity from the pool
    function removeLiquidity(uint256 _share) external returns(uint256 token1Amount, uint256 token2Amount) {        
        require (_share <= shares[msg.sender],  // check mapping to make sure they are taking the shares they are entitled to
        "cannot withdraw more shares than you have"
        );

        (token1Amount, token2Amount) = calculateWithdrawAmount(_share);

        shares[msg.sender] -= _share;
        totalShares -= _share;

        // Update state vars in contract
        token1Balance -= token1Amount;
        token2Balance -= token2Amount;
        K = token1Balance * token2Balance;

        // transfer tokens back to the user
        token1.transfer(msg.sender, token1Amount);
        token2.transfer(msg.sender, token2Amount);
    }
}
