const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    TextInputStyle,
  } = require("discord.js");
  const { getWallet } = require("../config");

async function customBuyAmount(interaction, poolId, firstSymbol,secondSymbol) {

    const res = getWallet(interaction.user.id);
    if(res == -1) {
        interaction.reply({
            content: "You have to setup wallet first.(use `/setup` command)",
            ephemeral : true
        })
        return ;
    }
    const modal = new ModalBuilder()
    .setCustomId("solana-custom-buy")
    .setTitle("Custom-Buy");
    // Add components to modal

    // An action row only holds one text input,
    // so you need one action row per text input.
    const inputSlippage = new TextInputBuilder()
    .setCustomId("inputCustomAmount")
    // The label is the prompt the user sees for this input
    .setLabel("Input Sol Amount for buying token.")
    .setValue(`0`)
    // Short means only a single line of text
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
    const inputTokenAddress = new TextInputBuilder()
    .setCustomId("inputTokenAddress")
    // The label is the prompt the user sees for this input
    .setLabel("This is SwapPoolId.")
    .setValue(`${poolId}`)
    // Short means only a single line of text
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
    const first = new TextInputBuilder()
    .setCustomId("firstSymbol")
    // The label is the prompt the user sees for this input
    .setLabel("This is first token symbol.")
    .setValue(`${new String(firstSymbol)}`)
    // Short means only a single line of text
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
    const second = new TextInputBuilder()
    .setCustomId("secondSymbol")
    // The label is the prompt the user sees for this input
    .setLabel("This is second token symbol.")
    .setValue(`${new String(secondSymbol)}`)
    // Short means only a single line of text
    .setStyle(TextInputStyle.Short)
    .setRequired(true);
    const solRow = new ActionRowBuilder().addComponents(inputSlippage);
    const solRow1 = new ActionRowBuilder().addComponents(inputTokenAddress);
    const solRow2 = new ActionRowBuilder().addComponents(first);
    const solRow3 = new ActionRowBuilder().addComponents(second);

    // Add inputs to the modal
    modal.addComponents(solRow, solRow1, solRow2, solRow3);

    // Show the modal to the user
    await interaction.showModal(modal);
}

module.exports = {customBuyAmount};