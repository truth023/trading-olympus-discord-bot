const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    TextInputStyle,
} = require("discord.js");
const { getWallet } = require("../config");

async function autoSellAmount(interaction) {
    const res = getWallet(interaction.user.id);
    if(res == -1) {
    interaction.reply({
        content: "You have to setup wallet first.(use `/setup` command)",
        ephemeral : true
    })
    return ;
    }

    const modal = new ModalBuilder()
    .setCustomId("solana-auto-sell-amount")
    .setTitle("Auto-Amount");


    // Add components to modal

    // An action row only holds one text input,
    // so you need one action row per text input.
    const inputSlippage = new TextInputBuilder()
    .setCustomId("inputAutoSellAmount")
    // The label is the prompt the user sees for this input
    .setLabel("Input selling token amount(percent).")
    .setValue(`${res.sellAmount}`)
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

module.exports = {autoSellAmount};