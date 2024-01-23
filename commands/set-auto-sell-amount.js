const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
} = require("discord.js");
const { getWallet } = require("../config");
const { autoSellAmount } = require("../utils/auto-sell");
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("set-auto-sell-amount")
      .setDescription("set auto amount for selling token."),
    async execute(interaction) {
        // console.log("set-auto-amount value ===>", interaction);
      try {
        await autoSellAmount(interaction);
      } catch(err) {
        interaction.followUp({
          content : "Setting Auto-Sell-Amount occur errors. Please try again.",
          ephemeral : true
        })
        return ;
      }
    },
  };
  