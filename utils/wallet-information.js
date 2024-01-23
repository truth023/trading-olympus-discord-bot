const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const { getBalance } = require("../utils/getBalance");
const { getWallet, client } = require("../config");

async function walletInformation(interaction) {
    const res = getWallet(interaction.user.id);

    const keypair = res == -1 ? res : res.keypair;
    try  {
      await interaction.reply({
        content : "Getting Wallet Information....",
        ephemeral : true
      });
    } catch(err) {
      console.log("Getting Wallet Information occur errors");
      return ;
    }
    if (keypair != -1) {
      try {
        const balance = await getBalance(keypair.publicKey);
        // await interaction.deleteReply();
        try {
          await interaction.followUp({
            content: `@${interaction.user.globalName} Wallet\n Address : ${keypair.publicKey.toBase58()}\nBalance : ${balance}\nSlippage : ${res.slip}%\nAuto-buy : ${res.autoBuy}\nAuto-buy-amount : ${res.amount}\nAuto-sell-amount : ${res.sellAmount}%`,
            ephemeral : true
          });
        } catch(err) {
          console.log("Wallet Information Displaying occur errors");
          return ;
        }
      } catch(err) {
        console.log("get balance error ==>", err);
        // await interaction.deleteReply();
        interaction.followUp({
          content: `Connecting wallet failed. Retry!!!`,
          ephemeral : true
        });
        return ;
      }
    } else {
      console.log(`@${interaction.user.globalName}\nWallet is not configured yet`);
      // await interaction.deleteReply();
      const response = await interaction.followUp({content: `@${interaction.user.globalName}\nWallet is not configured yet`, ephemeral : true});
    }
}

module.exports = {walletInformation};