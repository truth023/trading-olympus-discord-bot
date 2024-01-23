const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    TextInputStyle,
  } = require("discord.js");
  const { getWallet } = require("../config");

async function updateSlippage(interaction) {
    const res = getWallet(interaction.user.id);
    if(res == -1) {
      interaction.reply({
        content: "You have to setup wallet first.(use `/setup` command)",
        ephemeral : true
      })
      return ;
    }

    const modal = new ModalBuilder()
      .setCustomId("solana-slippage")
      .setTitle("Slippage");


    // Add components to modal

    // An action row only holds one text input,
    // so you need one action row per text input.
    const inputSlippage = new TextInputBuilder()
      .setCustomId("inputSolSlippage")
      // The label is the prompt the user sees for this input
      .setLabel("Input slippage as percent. Default: 5%")
      .setValue(`${res.slip}`)
      // Short means only a single line of text
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder("The range : 1 to 100.");
    const solRow = new ActionRowBuilder().addComponents(inputSlippage);

    // Add inputs to the modal
    modal.addComponents(solRow);

    // Show the modal to the user
    await interaction.showModal(modal);
}

module.exports = {updateSlippage};