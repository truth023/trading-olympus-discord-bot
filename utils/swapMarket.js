const { PublicKey, Transaction, Keypair, VersionedTransaction, Connection, LAMPORTS_PER_SOL } = require("@solana/web3.js");
const { connection, subscribeId, discordPostChannel, SELL_100, SELL_50 } = require("../config");
const {
  LIQUIDITY_STATE_LAYOUT_V4,
  Liquidity,
  Spl,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Market,
  buildSimpleTransaction,
  TokenAmount,
  SPL_ACCOUNT_LAYOUT,
  LOOKUP_TABLE_CACHE,
  TxVersion
} = require("@raydium-io/raydium-sdk");
const bs58 = require("bs58");
const { raydiumApiSwap } = require('../RaydiumSwaps/RaydiumSwap');
const { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } = require('@solana/spl-token');

async function swapMarket(poolId, amount, mode, wallet, globalName, client, interaction, firstSymbol = "Unknown", secondSymbol = "Unknown") {
    let poolInfo;
    try {
        poolInfo = await connection.getAccountInfo(poolId, "processed");
    } catch(err) {
        console.log("getting poolinfo error ===>", err);
        return;
    }
    // console.log("....market information .....", poolInfo);
    const accData = LIQUIDITY_STATE_LAYOUT_V4.decode(poolInfo.data);
    // console.log("....market data information...", accData);
    // console.log("public key:",wallet.publicKey.toBase58());
    console.log("amount ===>", amount);
    let flag = 0;
    if(firstSymbol == "SOL" || firstSymbol == "USDC")   flag = 1;


    if(amount == SELL_100 || amount == SELL_50 || mode == "sell") {
        if(flag == 1) {
            const temp = accData.baseMint;
            accData.baseMint = accData.quoteMint;
            accData.quoteMint = temp;
            const temp1 = accData.baseDecimal;
            accData.baseDecimal = accData.quoteDecimal;
            accData.quoteDecimal = temp1;
            mode = "buy";
        }
        let associatedTokenAddress;
        try {
            associatedTokenAddress= await getAssociatedTokenAddress(accData.baseMint, wallet.publicKey);
        } catch(err) {
            console.log("Getting associated token address occur errors");
            return;
        }
        // console.log("associatedTokenAddress ==>", associatedTokenAddress);
        let balance;
        if(accData.baseMint.toString() == "So11111111111111111111111111111111111111112"){
            try {
                balance = await connection.getBalance(wallet.publicKey);
            } catch(err) {
                interaction.followUp({
                    content : "some error occur during the wallet balance. Please check again.",
                    ephemeral : true
                })
                return ;
            }
            balance /= LAMPORTS_PER_SOL;
        }
        else {
            try {
            balance = await connection.getTokenAccountBalance(associatedTokenAddress);
            } catch(err) {
                interaction.followUp({
                    content: "Some error occur during  the getting token account balance. Please check again.",
                    ephemeral : true
                })
                return ;
            }
            balance = balance.value.uiAmount;
        }
        // console.log("balance ===>", balance);
        if(amount == SELL_100) {
            amount = balance;
            if(accData.baseMint.toString() == "So11111111111111111111111111111111111111112") amount -= 0.00005;
        }
        else if(amount == SELL_50) {
            const data = (balance / 2).toFixed(accData.baseDecimal.toNumber());
            // console.log("data ===>", data, typeof data);
            amount = new Number(data);
        }
        else if(amount < 0) {
            const data = (balance / 100 * (-amount)).toFixed(accData.baseDecimal.toNumber());
            // console.log("data ===>", data, typeof data);
            amount = new Number(data);
        }
    } else {
        if(flag == 1) {
            mode = "sell";
        }
    }
    const targetUser = client.users.cache.get(interaction.user.id);

    // console.log("amount ==>", amount, mode, typeof amount);
    try {
        if(flag == 1 && mode == "buy") {
            const temp = accData.baseDecimal;
            accData.baseDecimal = accData.quoteDecimal;
            accData.quoteDecimal = temp;
        }
        let signature;
        try {
        signature = await raydiumApiSwap(connection, amount, mode, wallet, poolId, accData.marketProgramId, accData.baseDecimal.toNumber(), accData.quoteDecimal.toNumber(), interaction, client, flag);
        } catch(err) {
            console.log("raydiumswap ======>", err);
            interaction.followUp({
                content : "Some error occur during the swapping token. Please check transaction again.\n1. You don't have enough balance or\n2.The swap pool is not ready to swap because this is new pool",
                ephemeral : true
            })
            return ;
        }
        console.log("finished....");
        console.log("signature ==>", signature);
        interaction.followUp({
            content : `Transaction was successful. You can see transcation ===> https://solscan.io/tx/${signature}`,
            ephemeral : true
        });
    }
    catch(err) {
        console.log("err ===>", err);
        interaction.followUp({
            content : `Transaction Failed...\n some network errors occured. Please try again.`,
            ephemeral : true
        });
        return;
    }
    
}


module.exports = {
  swapMarket,
};
