const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    TextInputStyle,
  } = require("discord.js");
const { getWallet } = require("../config");
const { autoBuyToken } = require("../utils/auto-buy-token");  

  module.exports = {
    data: new SlashCommandBuilder()
      .setName("token-address")
      .setDescription("input token mint address"),
    async execute(interaction) {
      try {
        await autoBuyToken(interaction);
      } catch(err) {
        interaction.followUp({
          content : "Auto-Buy-Token occur errors. Please try again.",
          ephemeral : true
        })
        return ;
      }
      return ;
    },
};