const { LIQUIDITY_STATE_LAYOUT_V4 } = require("@raydium-io/raydium-sdk");
const { connection } = require("../config");
const { getAssociatedTokenAddress, getMint } = require("@solana/spl-token");
const splToken = require('@solana/spl-token');
const { LAMPORTS_PER_SOL } = require("@solana/web3.js");

async function getWalletBalance(poolId, wallet) {
    // console.log("const poolInfo = await connection.getAccountInfo");
    let poolInfo;
    try {
        poolInfo = await connection.getAccountInfo(poolId, "processed");
    } catch(err) {
        console.log("Getting Account Info occur errors");
        return;
    }
    // console.log("....market information .....", poolInfo);
    // console.log("LIQUIDITY_STATE_LAYOUT_V4.decode(poolInfo.data)");
    const accData = LIQUIDITY_STATE_LAYOUT_V4.decode(poolInfo.data);
    
    // console.log("wallet =====================>", wallet);
    // console.log("associatedTokenAddress ==>", associatedTokenAddress);
    let baseBalance;
    let quoteBalance;
    // console.log(`await connection.getBalance(${wallet})`);
    wallet = wallet.keypair;
    let balance;
    try {
        balance = await connection.getBalance(wallet.publicKey);
    } catch(err) {
        console.log("Wallet Getting Balance occur errors");
        return ;
    }
    balance /= LAMPORTS_PER_SOL;
    // const token = new splToken(connection, accData.baseMint);
    // const tokenInfo = token.getMintInfo
    // const baseTokenInfo = await getMint(connection, accData.baseMint);
    // const quoteTokenInfo = await getMint(connection, accData.quoteMint);
    // console.log("baseTokenInfo ===================>", baseTokenInfo);
    
    if(accData.baseMint.toString() == "So11111111111111111111111111111111111111112"){
        baseBalance = balance;
    }
    else {
        try {
            // console.log(" await getAssociatedTokenAddress(accData.baseMint, wallet.publicKey)");
            const associatedBaseTokenAddress= await getAssociatedTokenAddress(accData.baseMint, wallet.publicKey);
            // console.log("await connection.getTokenAccountBalance(associatedBaseTokenAddress)");
            baseBalance = await connection.getTokenAccountBalance(associatedBaseTokenAddress);
            baseBalance = baseBalance.value.uiAmount;
        } catch(err) {
            baseBalance = 0;
        }
    }
    if(accData.quoteMint.toString() == "So11111111111111111111111111111111111111112"){
        quoteBalance = balance;
    }
    else {
        try {
            // console.log("getAssociatedTokenAddress(accData.quoteMint, wallet.publicKey)");
            const associatedQuoteTokenAddress= await getAssociatedTokenAddress(accData.quoteMint, wallet.publicKey);
            // console.log(" connection.getTokenAccountBalance(associatedQuoteTokenAddress)");
            quoteBalance = await connection.getTokenAccountBalance(associatedQuoteTokenAddress);
            quoteBalance = quoteBalance.value.uiAmount;
        } catch(err) {
            quoteBalance = 0;
        }
    }
    // console.log("quoteBalance ===>", quoteBalance);
    return {
        balance,
        baseBalance,
        quoteBalance
    }
}

module.exports = {
    getWalletBalance
}