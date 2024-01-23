const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    TextInputStyle,
  } = require("discord.js");
const { getWallet, setAutoBuy } = require("../config");
const { disableConfirm } = require("../utils/disable-confirm");
  
module.exports = {
  data: new SlashCommandBuilder()
    .setName("disable-confirm-mode")
    .setDescription("set auto-buy option"),
  async execute(interaction) {
    await disableConfirm(interaction);
    return ;
  },
};
  