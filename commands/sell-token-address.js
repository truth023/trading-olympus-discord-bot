const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    TextInputStyle,
  } = require("discord.js");
const { getWallet } = require("../config");
const { autoSellToken } = require("../utils/auto-sell-token");
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("sell-token-address")
      .setDescription("input token mint address"),
    async execute(interaction) {
      await autoSellToken(interaction);
      return ;
    },
  };