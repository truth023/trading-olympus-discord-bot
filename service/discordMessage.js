const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
const https = require('https');
const {
  amountArry,
  discordMsgColor,
  discordPostChannel,
  connection
} = require("../config");
const { TITLE_LIST, LP_ACTION_LIST, RAY_IX_TYPE } = require("../utils/RAY_LOG");
const { parseAmountWithDecimal } = require("../utils/tokenHelpers");
const { PublicKey } = require("@solana/web3.js");
const { LIQUIDITY_STATE_LAYOUT_V4 } = require("@raydium-io/raydium-sdk");

async function postActivity(client, msg, type, poolId = 0) {
  const channel = client.channels.cache.find(
    (channel) => channel.name === discordPostChannel[type]
  );
  let msgFields = [];
  const poolIdString = poolId.toString();

  if (channel) {
    const exampleEmbed = new EmbedBuilder().setColor(discordMsgColor[type]);
    exampleEmbed.setTitle(TITLE_LIST[type]);
    //   .setAuthor({ name: 'Some name', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
    // .setDescription('Some description here')
    // .setThumbnail('https://i.imgur.com/AfFp7pu.png')
    // console.log("msg......", msg);
    if(!msg[1] || !msg[0] || !msg[1].token || !msg[0].token) return ;
    
    if(msg[0].token) {
      let vaultAmount;
      try {
        vaultAmount = await connection.getTokenAccountBalance(new PublicKey(msg[1].mintOrAta));
      } catch(err) {
        console.log("Getting vaultAmount occur errors");
        return ;
      }
          console.log("amount::", vaultAmount);
      let initMint;
      try {
        initMint = await connection.getParsedAccountInfo(new PublicKey(msg[0].token.address));
      } catch(err) {
        console.log("Getting initMint occur errors");
        return ;
      }
      const initMintToken = initMint.value.data.parsed.info;
      const tokenDetail = `**Name:** ${msg[0].token.symbol} / ${msg[1].token.symbol}`;
      const mint = initMintToken.mintAuthority ? ":white_check_mark:" : ":x:";
      const freeze = initMintToken.freezeAuthority ? ":white_check_mark:" : ":x:";
      const description = `${msg[0].token.desc || '---'}\n**Renounced:** Minting:${mint} / Freeze Account:${freeze}`;
      const links = `[Transaction](https://solscan.io/tx/${msg[0].signature}) | [Birdeye](https://birdeye.so/token/${msg[0].token.address}/${msg[1].token.address}?chain=solana) | [Raydium](https://raydium.io/pools)`;
      
      const poolCreateAAmount = parseAmountWithDecimal(msg[0].amount, msg[0].token.decimals) + ` ${msg[0].token.symbol}`;
      const poolCreateBAmount = parseAmountWithDecimal(msg[1].amount, msg[1].token.decimals) + ` ${msg[1].token.symbol}`;

      const poolBurnBaseVaultBalance = `${vaultAmount.value.uiAmountString}` + ` ${msg[1].token.symbol}`;
      
      
      // console.log("...initMinToken...", initMintToken);
      let flag = 0;
      for(let i = 0; i < msg[0].token.image.length ;i++) {
        if(msg[0].token.image[i] == ' ') {
          flag = 1;
          msg[0].token.image[i] = '_';
          console.log(i, "====>", msg[0].token.image[i]);
        }
      }
      console.log("thumbnail url ===>", msg[0].token.image);
      let succeed = true;
      if(msg[0].token.image.slice(0,5) == "https")
        succeed = await validation(msg[0].token.image);
      if(succeed == true && flag == 0)
        exampleEmbed.setThumbnail(msg[0].token.image);
      if(type == RAY_IX_TYPE.BURN_LIQUIDITY) {
        console.log("Burn liquidity ==========>");
          let poolInfo;
          try {
            poolInfo = await connection.getAccountInfo(poolId, "processed");
          } catch(err) {
            console.log("getAccountInfo error===>", err);
            return ;
          }
          const accData = LIQUIDITY_STATE_LAYOUT_V4.decode(poolInfo.data);
          // console.log("market data ===>", accData);
          const date = new Date(accData.poolOpenTime.toNumber()*1000);
          console.log('poolopentime ===>', date);
          const nowDate = new Date();
          let dateDifference = nowDate - date;
          console.log("now difference ==>", dateDifference);
          dateDifference /= 1000;

          const tradeStartMessage = confirmTradeTimerMessage(dateDifference);
          console.log("tradestart message ===>", tradeStartMessage);

          let data;
          try {
            data = await connection.getParsedAccountInfo(new PublicKey(msg[2].token.address));
          } catch(err) {
            console.log("Getting parsed account info occur errors");
            return ;
          }
          const mintData = data.value.data.parsed.info;
          const burnAmount = parseFloat(parseAmountWithDecimal(msg[2].amount, msg[2].token.decimals));
          const supply = parseFloat(parseAmountWithDecimal(mintData.supply, mintData.decimals)) + burnAmount;
          msgFields.push({ name: "Mint Address", value: msg[2].token.address });
          console.log("burn/supply", burnAmount/supply * 100);
          msgFields.push({name : "Token Details", value : tokenDetail});
          msgFields.push({name : "Description", value : description});
          msgFields.push({name : "Burn Amount / Supply", value : `${burnAmount} / ${supply} (${(burnAmount/supply*100).toFixed(2)}%)`});
          msgFields.push({name : "Pool Id", value : `${poolId}`});
          msgFields.push({name : "Pool Base Vault Balance", value : poolBurnBaseVaultBalance});
          if(accData.poolOpenTime.toNumber() != 0 && (dateDifference / (3600 * 24) < 30)) {
           msgFields.push({
            name : "Trade Start Time",
            value : tradeStartMessage
           }) 
          }
          msgFields.push({name : "Links", value : links});

      } else if(type == RAY_IX_TYPE.CREATE_POOL) {
        console.log("...pool name .....", `[${msg[0].token.symbol}] / [${msg[1].token.symbol}]`);
        if(msg[0].token && msg[1].token) {
          msgFields.push({name : msg[0].token.address, value : poolCreateAAmount, inline : true});
          msgFields.push({name : msg[1].token.address, value : poolCreateBAmount, inline : true});
          msgFields.push({ name: '\n', value: '\n' });
          msgFields.push({name : "Token Details", value : tokenDetail});
          msgFields.push({name : "Description", value : description});
          msgFields.push({name : "Pool Id", value : `${poolId}`});
          msgFields.push({name : "Links", value : links});
        }
      }
  }

    exampleEmbed.addFields(...msgFields);

    let buttons = [];
    for (let i = 0; i < amountArry.length; i++) {
      let symbol = msg[1].token.symbol;
      if(msg[0].token.symbol == "SOL" || msg[0].token.symbol == "USDC") symbol = msg[0].token.symbol;

      buttons[i] = new ButtonBuilder()
        .setCustomId(`${poolIdString}_${i}_${msg[0].token.symbol}_${msg[1].token.symbol}`)
        .setLabel(`${amountArry[i]} ${symbol}`)
        .setStyle(ButtonStyle.Primary);
    }
    
    const balanceButton = new ButtonBuilder()
      .setCustomId(`${poolIdString}_BALANCE_${msg[0].token.symbol}_${msg[1].token.symbol}`)
      .setLabel(`BALANCE`)
      .setStyle(ButtonStyle.Secondary);
    const sell50Button = new ButtonBuilder()
      .setCustomId(`${poolIdString}_SELL50_${msg[0].token.symbol}_${msg[1].token.symbol}`)
      .setLabel(`SELL 50%`)
      .setStyle(ButtonStyle.Danger);
    const sell100Button = new ButtonBuilder()
      .setCustomId(`${poolIdString}_SELL100_${msg[0].token.symbol}_${msg[1].token.symbol}`)
      .setLabel(`SELL 100%`)
      .setStyle(ButtonStyle.Danger);
    const buyCustomButton = new ButtonBuilder()
    .setCustomId(`${poolIdString}_BuyCustom_${msg[0].token.symbol}_${msg[1].token.symbol}`)
    .setLabel(`CUSTOM`)
    .setStyle(ButtonStyle.Primary);
    const sellCustomButton = new ButtonBuilder()
    .setCustomId(`${poolIdString}_SellCustom_${msg[0].token.symbol}_${msg[1].token.symbol}`)
    .setLabel(`CUSTOM%`)
    .setStyle(ButtonStyle.Danger);
    const row = new ActionRowBuilder().addComponents(
      buttons[0],
      buttons[1],
      buttons[2],
      buttons[3],
      buttons[4]
    );
    const row1 = new ActionRowBuilder().addComponents(
      buttons[5],
      buttons[6],
      buttons[7],
      buttons[8],
      // buttons[9],
      buyCustomButton
    );
    const row2 = new ActionRowBuilder().addComponents(
      balanceButton,
      sell50Button,
      sell100Button,
      sellCustomButton
    );
    
    if(msgFields.length != 0)
        // ], components: [row, row1, row2]
      try {
        channel.send({ embeds: [exampleEmbed], components: [row, row1, row2]});
      } catch(err) {
        console.log("Displaying token data occur errors");
        return ;
      }
  } else {
    console.error(`Discord channel "${discordPostChannel}" could not find`);
  }
}



const confirmTradeTimerMessage = (second) => {
  let message;
  if(second / (3600 * 24) >= 1) {
    message = `${parseInt(second/(3600*24))} days ago`
  } else if(second / 3600 >= 1) {
    message = `${parseInt(second/3600)} hours ago`
  } else if(second / 60 >= 1) {
    message = `${parseInt(second/60)} minutes ago`
  } else {
    message = `${parseInt(second)} seconds ago`
  }
  return message;
}

const validation = async (imageUrl) => {
  return new Promise(async (resolve, reject) => {
      https.get(imageUrl, (res) => {
          if (res.statusCode == 200) {
              // console.log("valid Image...");
              resolve(true);
          } else {
              // console.log("invalid image...");
              resolve(false);
          }
      }).on('error', (error) => {
          console.log("fetching image occur errors", error);
          resolve(false);
      })
  })
}

module.exports = {
  postActivity,
};
