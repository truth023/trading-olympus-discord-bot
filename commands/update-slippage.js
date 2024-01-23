const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
} = require("discord.js");
const { updateSlippage } = require("../utils/wallet-slippage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("update-slippage")
    .setDescription("set you solana wallet from private key"),
  async execute(interaction) {
    await updateSlippage(interaction);
    return ;
  },
};
