const { showControlPanelChannel } = require("../config");
const {
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle,
  } = require("discord.js");
  
  const {
    amountArry,
    discordMsgColor,
    discordPostChannel,
    connection
  } = require("../config");
  const { TITLE_LIST, LP_ACTION_LIST, RAY_IX_TYPE } = require("../utils/RAY_LOG");
  const { parseAmountWithDecimal } = require("../utils/tokenHelpers");
  const { PublicKey } = require("@solana/web3.js");

async function showControlPanel(client) {
    const channel = client.channels.cache.find(
        (channel) => channel.name === showControlPanelChannel
      );
    const exampleEmbed = new EmbedBuilder().setColor(discordMsgColor[0]);
    exampleEmbed.setTitle("Olympus Sniper")
    //   .setAuthor({ name: 'Some name', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
    // .setDescription('Some description here')
    .setThumbnail('https://cdn.discordapp.com/attachments/1181259244260053095/1183104562001891338/IMG_3023.png?ex=6590597c&is=657de47c&hm=de20e40cd2b0f74b10aac6dee8e6a529ec26800cc29373fbff728dd42cbb4325&')
    // console.log("msg......", msg);
    let msgFields = [];
    
    msgFields.push({name: "Introduction", value : "Thank you for using our bot. Our bot enables you to monitor real-time creation of token swap pools on the Solana network and to buy or sell any desired token. If you encounter any issues while using the bot, please feel free to reach out to the service provider at any time."});
    msgFields.push({name : "Reference", value : "You can carry out the transaction using the buttons below or through commands. I trust this will enhance user convenience."});
    // msgFields.push({name : "Main Features", value : ""});
    msgFields.push({name : "Add Wallet Button", value : "For trading tokens, a secure connection is established between the user's wallet and the bot. Rest assured, security is fully guaranteed, so there's no need for concern."})
    msgFields.push({name : "Wallet Information Button", value : "Displays the status of the wallet that the user is currently connected to"})
    msgFields.push({name : "Update Slippage Button", value: "Change the slippage value. Enter as a percentage. Default: 5%"})
    msgFields.push({name : "Enable Confirm Mode Button", value: "Display a confirmation message for each transaction."})
    msgFields.push({name : "Disable Confirm Mode Button", value: "Don't display a confirmation message for each transaction."})
    msgFields.push({name : "Set Auto-Buy Amount Button", value: "Establish the sol amount for automatically purchasing tokens."})
    msgFields.push({name : "Set Auto-Sell Amount Button", value : "Establish the sol amount for automatically purchasing tokens."})
    msgFields.push({name : "Auto Buy Token Button", value: "Enter the token address for purchasing. After entering, the transaction will run automatically."})
    msgFields.push({name : "Auto Sell Token Button", value : "Enter the token address for selling. After entering, the transaction will run automatically."})

    const addWalletButton = new ButtonBuilder()
      .setCustomId('add-wallet')
      .setLabel('    Add Wallet    ')
      .setStyle(ButtonStyle.Danger);
    const walletInformationButton = new ButtonBuilder()
      .setCustomId('wallet-information')
      .setLabel('Wallet Information')
      .setStyle(ButtonStyle.Success);
    const updateSlippageButton = new ButtonBuilder()
      .setCustomId('update-slippage')
      .setLabel('Update Slippage')
      .setStyle(ButtonStyle.Primary);
    const enableConfirmButton = new ButtonBuilder()
      .setCustomId('enable-confirm')
      .setLabel('Enable Confirm Mode')
      .setStyle(ButtonStyle.Success);
    const disbleConfirmButton = new ButtonBuilder()
      .setCustomId('disable-confirm')
      .setLabel('Disable Confirm Mode')
      .setStyle(ButtonStyle.Secondary);
    const setAutoBuyAmountButton = new ButtonBuilder()
      .setCustomId('auto-buy-amount')
      .setLabel('Set Auto-Buy Amount')
      .setStyle(ButtonStyle.Success);
    const setAutoSellAmountButton = new ButtonBuilder()
      .setCustomId('auto-sell-amount')
      .setLabel('Set Auto-Sell Amount')
      .setStyle(ButtonStyle.Primary);
    const buyTokenAddressButton = new ButtonBuilder()
      .setCustomId('buy-token-address')
      .setLabel('---Auto Buy Token---')
      .setStyle(ButtonStyle.Success);
    const sellTokenAddressButton = new ButtonBuilder()
      .setCustomId('sell-token-address')
      .setLabel('---Auto Sell Token---')
      .setStyle(ButtonStyle.Primary);
    const row = new ActionRowBuilder().addComponents(
        walletInformationButton,
        addWalletButton,
        updateSlippageButton
    );
    const row1 = new ActionRowBuilder().addComponents(
        enableConfirmButton,
        disbleConfirmButton
    );
    const row2 = new ActionRowBuilder().addComponents(
        setAutoBuyAmountButton,
        setAutoSellAmountButton
    );
    const row3 = new ActionRowBuilder().addComponents(
        buyTokenAddressButton,
        sellTokenAddressButton
    );

    exampleEmbed.addFields(...msgFields);
    channel.send({ embeds: [exampleEmbed], components: [row, row1, row2, row3] });
}


module.exports = {showControlPanel};