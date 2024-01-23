const { SlashCommandBuilder, ActionRowBuilder } = require("discord.js");
/**
 * slash command for transfer
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName("send-token")
    .setDescription("transfer token to another"),
  async execute(interaction) {
    //, period) {
    // if (!period) {
    //     interaction.reply("You must set the rule to arcue points");
    //     return;
    // }
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("input-address")
        .setStyle(ButtonStyle.Primary)
        .setLabel("Input Address")
    );

    await interaction.reply({
      content: "Transfer token to another wallet!",
      components: [row],
    });
  },
};
