const { LIQUIDITY_STATE_LAYOUT_V4 } = require("@raydium-io/raydium-sdk");
const { connection } = require("../config");
const { getAssociatedTokenAddress, getMint } = require("@solana/spl-token");
const splToken = require('@solana/spl-token');
const { LAMPORTS_PER_SOL } = require("@solana/web3.js");

async function getSellAmount(tokenAddress, publicKey, amount) {
    // const associatedQuoteTokenAddress= await getAssociatedTokenAddress(accData.quoteMint, wallet.publicKey);
    //         // console.log(" connection.getTokenAccountBalance(associatedQuoteTokenAddress)");
    //         quoteBalance = await connection.getTokenAccountBalance(associatedQuoteTokenAddress);
    //         quoteBalance = quoteBalance.value.uiAmount;
    console.log("token address ===>", tokenAddress, publicKey, amount);
    const associatedTokenAddress = await getAssociatedTokenAddress(tokenAddress, publicKey);
    console.log("associatedTokenAddress ===>", associatedTokenAddress);
    let tokenBalance;
    try {
        const tokenData = await connection.getTokenAccountBalance(associatedTokenAddress);
        tokenBalance = tokenData.value.uiAmount;
        console.log("tokenBalance ==>", tokenBalance);
    } catch(err) {
        tokenBalance = 0;
    }
    return tokenBalance / 100 * amount;
}

module.exports = {getSellAmount};