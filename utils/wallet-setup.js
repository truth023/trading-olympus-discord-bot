const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    TextInputStyle,
  } = require("discord.js");

async function setupWallet(interaction) {
    const modal = new ModalBuilder()
      .setCustomId("solana-wallet")
      .setTitle("Add your wallet");

    // Add components to modal

    // An action row only holds one text input,
    // so you need one action row per text input.
    const solWalletAddress = new TextInputBuilder()
      .setCustomId("solWalletPrivateKey")
      // The label is the prompt the user sees for this input
      .setLabel("input sol wallet private key")
      // Short means only a single line of text
      .setStyle(TextInputStyle.Short);
    const solRow = new ActionRowBuilder().addComponents(solWalletAddress);

    // Add inputs to the modal
    modal.addComponents(solRow);

    // Show the modal to the user
    await interaction.showModal(modal);
}

module.exports = {setupWallet};