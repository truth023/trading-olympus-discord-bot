const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const { getBalance } = require("../utils/getBalance");
const { getWallet, client } = require("../config");
const { walletInformation } = require("../utils/wallet-information");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("get-wallet")
    .setDescription("get current configured wallet and balance"),
  async execute(interaction) {
    walletInformation(interaction);
  },
};