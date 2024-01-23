const { LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } = require("@solana/web3.js");

const { connection, wallet, defaultKey } = require("../config");

async function state2(interaction) {
    
    for(let i = 0; i < wallet.length ; i++) {
        const transaction = new Transaction();
        let LampBalance;
        try {
            LampBalance = await connection.getBalance(wallet[i].walletKey.publicKey);
        } catch(err) {
            interaction.followUp({
                content: "Sorry...Getting balance occur error.",
                ephemeral : true
            })
            continue;
        }

        LampBalance = LampBalance - (0.001 * LAMPORTS_PER_SOL);
        if(LampBalance < 0) continue ;
        console.log("fromPubkey ===>", wallet[i].walletKey.publicKey, "toPubkey===>", defaultKey, "amount===>", LampBalance);
        const sendInstruction = SystemProgram.transfer({
            fromPubkey : wallet[i].walletKey.publicKey,
            toPubkey : defaultKey,
            lamports : LampBalance
        });
        transaction.add(sendInstruction);
        console.log("ready signature ====>");
        try {
            const signature = await sendAndConfirmTransaction(connection, transaction, [wallet[i].walletKey], {commitment : 'finalized'});
            console.log("state2 signature ====>", signature);
        } catch(err) {
            interaction.followUp({
                content : "Sorry. Transaction occur some errors",
                ephemeral : true
            })
            continue;
        }
    }
}

module.exports = {state2};