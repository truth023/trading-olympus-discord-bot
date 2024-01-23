const { SlashCommandBuilder } = require("discord.js");

const { client, notificationMessageDelayTime } =   require('../config');

let help =
  "/get-wallet: get current wallet and balance\n" +
  "/setup: add user's solana wallet address\n" +
  "/disable-confirm-mode : disable confirm message\n" +
  "/enable-confirm-mode : enable confirm message\n" +
  "/set-auto-amount : set auto-buy amount\n" +
  "/set-auto-sell-amount : set auto-sell amount\n" +
  "/update-slippage : update the slippage value\n" +
  "/sell-token-address : copy the token address for selling\n" +
  "/token-address : copy the token address for buying\n";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("help about commands"),
  async execute(interaction) {
    const messageReply = await interaction.reply({
      content : help,
      ephemeral : true
    });
    // setTimeout(() => {
    //   messageReply.delete();
    // }, notificationMessageDelayTime);
  },
};
