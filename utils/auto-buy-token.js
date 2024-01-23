const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    TextInputStyle,
} = require("discord.js");
const { getWallet } = require("../config");

async function autoBuyToken(interaction) {
    const res = getWallet(interaction.user.id);
    // console.log("res===>", res);
    if(res == -1) {
        interaction.reply({
        content: "You have to setup wallet first.(use `/setup` command)",
        ephemeral : true
        })
        return ;
    }
    if(res.amount == 0) {
        interaction.reply({
            content: "You have to set auto-buy amount.(use `/set-auto-amount` command)",
            ephemeral : true
        })
        return ;
    }

  const modal = new ModalBuilder()
    .setCustomId("token-address")
    .setTitle("Add token address");

  // Add components to modal

  // An action row only holds one text input,
  // so you need one action row per text input.
  const solWalletAddress = new TextInputBuilder()
    .setCustomId("tokenMintAddress")
    // The label is the prompt the user sees for this input
    .setLabel("input buy-token address")
    // Short means only a single line of text
    .setStyle(TextInputStyle.Short);
  const solRow = new ActionRowBuilder().addComponents(solWalletAddress);

  // Add inputs to the modal
  modal.addComponents(solRow);

  // Show the modal to the user
  await interaction.showModal(modal);
}

module.exports = {autoBuyToken};