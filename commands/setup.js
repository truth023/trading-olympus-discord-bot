const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
} = require("discord.js");
const { setupWallet } = require("../utils/wallet-setup");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("set you solana wallet from private key"),
  async execute(interaction) {
    await setupWallet(interaction);
  },
};
