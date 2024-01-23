const { LAMPORTS_PER_SOL } = require("@solana/web3.js");

const { connection, wallet } = require("../config");

async function state1(interaction) {
    let totalPrice = 0;
    for(let i = 0; i < wallet.length; i++) {
        let balance;
        try{
            balance= await connection.getBalance(wallet[i].walletKey.publicKey);
        } catch(err) {
            console.log("stat1===>", err);
            continue ;
        }
        totalPrice += balance / LAMPORTS_PER_SOL;
    }
    interaction.followUp({
        content: `Total Balance is ${totalPrice}...`,
        ephemeral : true
    })
}

module.exports = {state1};