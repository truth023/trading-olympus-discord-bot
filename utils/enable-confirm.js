const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    TextInputStyle,
  } = require("discord.js");
  const { getWallet, setAutoBuy } = require("../config");


async function enableConfirm(interaction) {
    const res = getWallet(interaction.user.id);
    if(res == -1) {
    interaction.reply({
        content: "You have to setup wallet first.(use `/setup` command)",
        ephemeral : true
    })
    return ;
    }
  
    setAutoBuy(interaction.user.id, false);
    interaction.reply({content : "AutoBuy is set to false", ephemeral : true});
}

module.exports = {enableConfirm}