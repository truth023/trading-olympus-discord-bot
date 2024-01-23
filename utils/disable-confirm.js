
const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    TextInputStyle,
  } = require("discord.js");
const { getWallet, setAutoBuy } = require("../config");

async function disableConfirm(interaction) {
    const res = getWallet(interaction.user.id);
    if(res == -1) {
    interaction.reply({
        content: "You have to setup wallet first.(use `/setup` command)",
        ephemeral : true
    })
    return ;
    }
  
    setAutoBuy(interaction.user.id, true);
    interaction.reply({content : "AutoBuy is set to true", ephemeral : true});
}

module.exports = {disableConfirm};