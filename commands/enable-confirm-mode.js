const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    TextInputStyle,
  } = require("discord.js");
  const { getWallet, setAutoBuy } = require("../config");
const { enableConfirm } = require("../utils/enable-confirm");
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("enable-confirm-mode")
      .setDescription("set auto-buy option"),
    async execute(interaction) {
      await enableConfirm(interaction);
    },
  };
  