const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
} = require("discord.js");
const { getWallet } = require("../config");
const { autoBuyAmount } = require("../utils/auto-buy");

  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("set-auto-amount")
      .setDescription("set auto amount for buying token."),
    async execute(interaction) {
        // console.log("set-auto-amount value ===>", interaction);
      try{
        await autoBuyAmount(interaction);
      } catch(err) {
        interaction.followUp({
          content : "Setting Auto-Buy-Amount occur errors. Please try again.",
          ephemeral : true
        })
        return ;
      }
    },
  };
  