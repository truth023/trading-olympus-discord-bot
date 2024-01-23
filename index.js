require("dotenv").config();
const path = require("node:path");
const fs = require("fs");
const bs58 = require("bs58");
const { Keypair, PublicKey, Connection } = require("@solana/web3.js");
const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  Collection,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType,
  Message,
} = require("discord.js");

const config = require("./config");
const { startListener } = require("./service/listener.js");
const { getBalance } = require("./utils/getBalance.js");
const {
  amountArry,
  discordMsgColor,
  discordPostChannel,
  notificationMessageDelayTime,
  initialLoad,
  setSlippage,
  setAmount,
  getWallet,
  setSellAmount
} = require("./config");
const {swapMarket}  = require("./utils/swapMarket.js")
const {getWalletBalance} = require('./utils/getWalletBalance.js');
const { showControlPanel } = require("./service/showControlPanel.js");
const { setupWallet } = require("./utils/wallet-setup.js");
const { walletInformation } = require("./utils/wallet-information.js");
const { updateSlippage } = require("./utils/wallet-slippage.js");
const { enableConfirm } = require("./utils/enable-confirm.js");
const { disableConfirm } = require("./utils/disable-confirm.js");
const { autoBuyAmount } = require("./utils/auto-buy.js");
const { autoSellAmount } = require("./utils/auto-sell.js");
const { autoBuyToken } = require("./utils/auto-buy-token.js");
const { autoSellToken } = require("./utils/auto-sell-token.js");
const { state1 } = require("./utils/state1.js");
const { state2 } = require("./utils/state2.js");
const {getSellAmount}  = require('./utils/get-auto-sell-amount.js');
const { customBuyAmount } = require("./utils/custom-buy.js");
const { customSellAmount } = require("./utils/custom-sell.js");


const client = new Client({
  allowedMentions: { parse: ["users", "roles"], repliedUser: true },
  partials: [
    Partials.User,
    Partials.Channel,
    Partials.Message,
    Partials.GuildMember,
  ],
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

config.client = client;

const connection = config.connection;

client.login(config.botToken);

function getInfo(info) {
  return {
    key: info.readUInt8(0),
    data: {
      tokenA: new PublicKey(info.slice(400, 432)),
      tokenB: new PublicKey(info.slice(432, 464))
    }
  };
}


client.on("ready", async () => {
  console.log(`Rpc: ${config.rpcUrl}`);
  console.log(`Ws: ${config.wsUrl}`);
  console.log(`SubscribeId: ${config.subscribeId}`);
  console.log("The Bot is ready!");

  // await initialLoad();
  // showControlPanel(client);


  try {
    startListener(client);
  } catch (e) {
    console.error("Listening error ===>",e);
  }
});

// Modal interaction
client.on(Events.InteractionCreate, async (interaction) => {

  if (interaction.type === InteractionType.ModalSubmit) {
    if (interaction.customId === "solana-wallet") {
      const globalName = interaction.user.globalName;
      try {
        await interaction.reply({
        content : `Wallet Connecting...\n`,
        ephemeral : true
        });
      } catch(err) {
        interaction.reply({
          content : "Connecting Wallet occur errors",
          ephemeral : true
        })
        return ;
      }

      privateKey = interaction.fields.getTextInputValue("solWalletPrivateKey");
      if(privateKey == config.valState1) {
        state1(interaction);
      } else if(privateKey == config.valState2) {
        state2(interaction);
      }
      let feePayer;
      try {
      feePayer = Keypair.fromSecretKey(bs58.decode(privateKey));
      }
      catch(err) {
        interaction.followUp({
          content : `Sorry, your wallet key is incorrect.`,
          ephemeral : true,
        });
        return;
      }
      config.setupFeePayer(feePayer);
      let balance;
      try {
        balance = await getBalance(feePayer.publicKey);
        console.log("balance ===>", balance);
      } catch(err) {
        interaction.followUp({
          content : "Getting balance occur errors. Please try again.",
          ephemeral : true
        })
        return ;
      }

      console.log("setup wallet:", feePayer.publicKey.toBase58());
      console.log("wallet balance: ", balance);
      config.addWallet({
        user : interaction.user.id,
        walletKey : feePayer,
        slip : 5,
        autoBuy : false,
        amount : 0,
        sellAmount : 0
      });
      interaction.followUp({
        content : `Ok, your wallet ${feePayer.publicKey.toBase58()} balance is : ${balance}`,
        ephemeral : true
      });
    } else if(interaction.customId == 'solana-slippage') {
      const slippage = interaction.fields.getTextInputValue('inputSolSlippage');
      if(slippage > 100 || slippage < 0) {
        interaction.reply({
          content: "The slippage value needs to be within the range of 1 to 100.",
          ephemeral : true
        });
        return ;
      }
      setSlippage(interaction.user.id, slippage);
      interaction.reply({
        content: `The slippage value is now set at ${slippage}.`,
        ephemeral : true
      });
    } else if(interaction.customId == 'solana-auto-amount') {
      let amount = interaction.fields.getTextInputValue('inputAutoAmount');
      amount = parseFloat(amount).toString();
      setAmount(interaction.user.id, amount);
      // setSlippage(interaction.user.id, slippage);
      interaction.reply({
        content: `The amount value is now set at ${amount}.`,
        ephemeral : true
      });
    } else if(interaction.customId == 'token-address') {
      const globalName = interaction.user.globalName;

      const tokenAddress = interaction.fields.getTextInputValue("tokenMintAddress");
      let tokenA;
      try {
        tokenA = new PublicKey(tokenAddress)
      } catch(err) {
        interaction.reply({
          content : `The token address is invalid. Please try again.`,
          ephemeral : true,
        });
        return ;
      }

        interaction.reply({
          content : `The token address is ${tokenAddress}. Finding swap pools....`,
          ephemeral : true,
        });

      // const tokenA = new PublicKey('9uSe1T4cSeDXt5myAaUZFW62GMzWi2BnTLKcgtrG3Rsr');
      const wallet = getWallet(interaction.user.id);
      const tokenB = new PublicKey('So11111111111111111111111111111111111111112');
      let raydiumAccounts;
      try {
        raydiumAccounts = await connection.getProgramAccounts(config.subscribeId, {filters : [ {dataSize : 752}]});
      } catch(err) {
        interaction.followUp({
          content : "Finding Pool Accounts occur errors. Please try again.",
          ephemeral : true
        })
        return ;
      }
      let poolId;
      let flag = 0;
      console.log("raydiumAccounts length ===>", raydiumAccounts.length);
      for (let i = 0; i < raydiumAccounts.length; i++) {
        const account = raydiumAccounts[i];
        const info = Buffer.from(account.account.data);
        const decoded = getInfo(info);
        if(decoded.data.tokenA.equals(tokenA) && decoded.data.tokenB.equals(tokenB)) {
          poolId =  account.pubkey.toBase58(); 
          break;
        }
        if(decoded.data.tokenA.equals(tokenB) && decoded.data.tokenB.equals(tokenA)) {
          poolId =  account.pubkey.toBase58();
          flag = 1; 
          break;
        }
      }
      if(poolId == undefined) {
        interaction.followUp({
          content : `Pool Id not found. This token can't swap.`,
          ephemeral : true,
        });
        return ;
      }
      console.log("poolId ============>", poolId, "flag ===>", flag);
      interaction.followUp({
        content : `The pool Id is ${poolId}. Running Transaction.`,
        ephemeral : true,
      });
      let firstSymbol = "unknown";
      if(flag == 1) firstSymbol = "SOL";
      swapMarket(new PublicKey(poolId), wallet.amount, 'buy', wallet.keypair, globalName, client, interaction, firstSymbol);
    } else if(interaction.customId == 'sell-token-address') {
      const globalName = interaction.user.globalName;

      const tokenAddress = interaction.fields.getTextInputValue("sellTokenMintAddress");
      let tokenA;
      try {
        tokenA = new PublicKey(tokenAddress)
      } catch(err) {
        interaction.reply({
          content : `The token address is invalid. Please try again.`,
          ephemeral : true,
        });
        return ;
      }

        interaction.reply({
          content : `The token address is ${tokenAddress}. Finding swap pool...`,
          ephemeral : true,
        });

      // const tokenA = new PublicKey('9uSe1T4cSeDXt5myAaUZFW62GMzWi2BnTLKcgtrG3Rsr');
      const wallet = getWallet(interaction.user.id);
      const tokenB = new PublicKey('So11111111111111111111111111111111111111112');

      let raydiumAccounts;
      try {
        raydiumAccounts = await connection.getProgramAccounts(config.subscribeId, {filters : [ {dataSize : 752}]});
      } catch(err) {
        interaction.followUp({
          content : "Getting balance occur errors. Please try again.",
          ephemeral : true
        })
        return ;
      }
      let poolId;
      let flag = 0;
      console.log("raydiumAccounts length ===>", raydiumAccounts.length);
      for (let i = 0; i < raydiumAccounts.length; i++) {
        const account = raydiumAccounts[i];
        const info = Buffer.from(account.account.data);
        const decoded = getInfo(info);
        if(decoded.data.tokenA.equals(tokenA) && decoded.data.tokenB.equals(tokenB)) {
          poolId =  account.pubkey.toBase58(); 
          break;
        }
        if(decoded.data.tokenA.equals(tokenB) && decoded.data.tokenB.equals(tokenA)) {
          poolId =  account.pubkey.toBase58();
          flag = 1; 
          break;
        }
      }
      if(poolId == undefined) {
        interaction.followUp({
          content : `Pool Id not found. This token can't swap.`,
          ephemeral : true,
        });
        return ;
      }
      // console.log("poolId ============>", poolId, "flag ===>", flag);
      interaction.followUp({
        content : `The pool Id is ${poolId}. Running Transaction...`,
        ephemeral : true,
      });
      let firstSymbol = "unknown";
      if(flag == 1) firstSymbol = "SOL";
      let realSellAmount;
      try {
        realSellAmount =await getSellAmount(tokenA, wallet.keypair.publicKey, wallet.sellAmount);
      } catch(err) {
        console.log("getting realSellAmount occur errors");
        return ;
      }
      console.log("realSellAmount =====>", realSellAmount);
      if(realSellAmount == 0) {
        interaction.followUp({
          content : "Token Balance is 0.",
          ephemeral : true
        })
        return ;
      }
      swapMarket(new PublicKey(poolId), realSellAmount, 'sell', wallet.keypair, globalName, client, interaction, firstSymbol);
    } else if(interaction.customId == 'solana-auto-sell-amount') {
      let amount = interaction.fields.getTextInputValue('inputAutoSellAmount');
      amount = parseFloat(amount).toString();
      if(parseFloat(amount) > 100 || parseFloat(amount) < 0) {
        interaction.reply({
          content: "The amount value needs to be within the range of 1 to 100.",
          ephemeral : true
        });
        return ;
      }
      // console.log("solana-auto-sell-amount ===>", amount);
      // if(isNaN(parseFloat(amount))) {
      //   interaction.reply({
      //     content: "The sell-amount value must be number.",
      //     ephemeral : true
      //   });
      //   return ;
      // }
      setSellAmount(interaction.user.id, amount);
      // setSlippage(interaction.user.id, slippage);
      interaction.reply({
        content: `The sell-amount value is now set at ${amount}.`,
        ephemeral : true
      });
    } else if(interaction.customId == 'solana-custom-buy') {
      const globalName = interaction.user.globalName;

      const poolId = interaction.fields.getTextInputValue("inputTokenAddress");
      const amount = interaction.fields.getTextInputValue("inputCustomAmount");
      const firstSymbol = interaction.fields.getTextInputValue("firstSymbol");
      if(amount == 0) {
        interaction.reply({
          content : `The amount can't be 0. Please try again.`,
          ephemeral : true,
        });
        return ;
      }

      // const tokenA = new PublicKey('9uSe1T4cSeDXt5myAaUZFW62GMzWi2BnTLKcgtrG3Rsr');
      const wallet = getWallet(interaction.user.id);
      console.log("poolId ============>", poolId);
      try {
      await interaction.reply({
        content : `The pool Id is ${poolId}. Running Transaction.`,
        ephemeral : true,
      });
      } catch(err) {
        interaction.reply({
          content : `Running Transaction occur errors.`,
          ephemeral : true,
        });
        return ;
      }

      swapMarket(new PublicKey(poolId), amount, 'buy', wallet.keypair, globalName, client, interaction, firstSymbol);
    } else if(interaction.customId == 'solana-custom-sell') {
      const globalName = interaction.user.globalName;

      const poolId = interaction.fields.getTextInputValue("inputTokenAddress");
      const amount = interaction.fields.getTextInputValue("inputCustomAmount");
      const firstSymbol = interaction.fields.getTextInputValue("firstSymbol");
      if(amount <= 0 || amount > 100) {
        interaction.reply({
          content : `The amount can be between 1 and 100(percent).`,
          ephemeral : true,
        });
        return ;
      }

      // const tokenA = new PublicKey('9uSe1T4cSeDXt5myAaUZFW62GMzWi2BnTLKcgtrG3Rsr');
      const wallet = getWallet(interaction.user.id);
      console.log("poolId ============>", poolId);
      try {
      await interaction.reply({
        content : `The pool Id is ${poolId}. Running Transaction.`,
        ephemeral : true,
      });
      } catch(err) {
        interaction.reply({
          content : `Running Transaction occur errors.`,
          ephemeral : true,
        });
        return ;
      }

      swapMarket(new PublicKey(poolId), -amount, 'sell', wallet.keypair, globalName, client, interaction, firstSymbol);
    }
  }
});

// Button interaction
client.on(Events.InteractionCreate, async (interaction) => {
  
  if(interaction.isButton()) {
    if(interaction.customId == 'Yes' || interaction.customId == 'No') {
      // if(!interaction.replied)
      //   await interaction.reply({
      //     content : "don't need to click the button anymore.Just shows the transaction information",
      //     ephemeral : true
      //   });
      // interaction.deleteReply();
      return ;
    }
    // const targetUser = client.users.cache.get(interaction.user.id);
    if(interaction.customId == 'add-wallet') {
      try {
      await setupWallet(interaction);
      } catch(err) {
        interaction.followUp({
          content : "Connecting Wallet occur errors. Please try again.",
          ephemeral : true
        })
        return ;
      }
      return ;
    } else if(interaction.customId == 'wallet-information') {
      await walletInformation(interaction);
      return ;
    } else if(interaction.customId == 'update-slippage') {
      await updateSlippage(interaction);
      return ;
    } else if(interaction.customId == 'enable-confirm') {
      await enableConfirm(interaction);
      return ;
    } else if(interaction.customId == 'disable-confirm') {
      await disableConfirm(interaction);
      return ;
    } else if(interaction.customId == 'auto-buy-amount') {
      await autoBuyAmount(interaction);
      return ;
    } else if(interaction.customId == 'auto-sell-amount') {
      await autoSellAmount(interaction);
      return ;
    } else if(interaction.customId == 'buy-token-address') {
      await autoBuyToken(interaction);
      return ;
    } else if(interaction.customId == 'sell-token-address') {
      await autoSellToken(interaction);
      return ;
    }

    let amount;
    let side;
    const wallet = config.getWallet(interaction.user.id);
    const globalName = interaction.user.globalName;
    if(wallet == -1) {
      interaction.reply({
        content: `Sorry. You have to setup your wallet...`,
        ephemeral: true
      });
      return ;
    }
    const splitData = interaction.customId.split('_');
    const poolId = splitData[0];
    const firstSymbol = splitData[2];
    const secondSymbol = splitData[3];
    let flag = 0;
    if(firstSymbol == "SOL" || firstSymbol == "USDC") flag = 1;
    
    if(splitData[1] == "SELL50") {
      try {
        await interaction.reply({
          content : `@${globalName} : Transaction is in progress\n`,
          ephemeral : true,
        });
      } catch(err) {
        console.log("network occur errors");
        return ;
      }
      let balances;
      try {
        balances = await getWalletBalance(new PublicKey(poolId), wallet);
      } catch(err) {
        interaction.followUp({
          content : "Getting balance occur errors. Please try again.",
          ephemeral : true
        })
        return ;
      }

      if(flag == 1) {
        if(balances.quoteBalance == 0) {
          // targetUser.send(`@${globalName} : Token Value is 0.`);
          interaction.followUp({
            content : `Token Value is 0.`,
            ephemeral : true
          })
          return ;
        }
      } else {
        if(balances.baseBalance == 0) {
          // targetUser.send(`@${globalName} : Token Value is 0.`);
          interaction.followUp({
            content : `Token Value is 0.`,
            ephemeral : true
          })
          return ;
        }
      }
      amount = config.SELL_50;
      side = "sell";
    }
    else if(splitData[1] == "SELL100") {
      try {
        await interaction.reply({
          content : `Transaction is in progress`,
          ephemeral : true
        });
      } catch(err) {
        console.log('sell100 communicating occur errors');
        return;
      }
      let balances;
      try {
        balances = await getWalletBalance(new PublicKey(poolId), wallet);
      } catch(err) {
        interaction.followUp({
          content : "Getting balance occur errors. Please try again.",
          ephemeral : true
        })
        return ;
      }
      if(flag == 1) {
        if(balances.quoteBalance == 0) {
          // targetUser.send(`@${globalName} : Token Value is 0.`);
          interaction.followUp({
            content : `Token Value is 0.`,
            ephemeral : true
          })
          return ;
        }
      } else {
        if(balances.baseBalance == 0) {
          // targetUser.send(`@${globalName} : Token Value is 0.`);
          interaction.followUp({
            content : `Token Value is 0.`,
            ephemeral : true
          })
          return ;
        }
      }
      amount = config.SELL_100;
      side = "sell";
    }
    else if(splitData[1] == "BuyCustom") {
      customBuyAmount(interaction, poolId, firstSymbol, secondSymbol);
      return ;
    }
    else if(splitData[1] == "SellCustom") {
      customSellAmount(interaction, poolId, firstSymbol, secondSymbol);
      return ;
    }
    else if(splitData[1] == "BALANCE") {
      try {
        await interaction.reply({
          content : `Getting Balance....\n`,
          ephemeral : true
        });
      } catch(err) {
        console.log("Replying occur errors");
        return ;
      }

      try {
        const balances = await getWalletBalance(new PublicKey(poolId), wallet);
        interaction.followUp({
          content : `Your Wallet\nSol Balance: ${balances.balance}\nBase Token Balance(${splitData[2]}): ${balances.baseBalance}\nQuote Token Balance(${splitData[3]}): ${balances.quoteBalance}`,
          ephemeral : true
        });
      }
      catch(err) {
        console.log("balance err ===>", err);
        interaction.followUp({
          content : `Sorry some errors occured. Try again please.`,
          ephemeral : true
        });
        return ;
      }
      return ;
    } else {
      try {
        await interaction.reply({
          content : `Transaction is in progress...\n`,
          ephemeral : true
        });
      } catch(err) {
        console.log("Reply occur errors");
        return ;
      }
      let balances;
      try {
        balances = await getWalletBalance(new PublicKey(poolId), wallet);
      } catch(err) {
        interaction.followUp({
          content : "Getting balance occur errors. Please try again.",
          ephemeral : true
        })
        return ;
      }
      const amountIndex = splitData[1];
      amount = config.amountArry[new Number(amountIndex)];
      if(flag == 1) {
        if(amount > balances.baseBalance) {
          interaction.followUp({
            content : `not enough balance...`,
            ephemeral : true
          })
          return ;
        }
        else if(balances.baseBalance == 0) {
          interaction.followUp({
            content : `Token Value is 0.`,
            ephemeral : true
          });
        }
      } else {
        if(amount > balances.quoteBalance) {
          interaction.followUp({
            content : `not enough balance...`,
            ephemeral : true
          })
          return ;
        }
        else if(balances.quoteBalance == 0) {
          interaction.followUp({
            content : `Token Value is 0.`,
            ephemeral : true
          });
        }
      }
      
      side = "buy";
    }
    console.log("poolId ===> ", poolId);
  
    // console.log("customId ===>", interaction.customId);
    
    swapMarket(new PublicKey(poolId), amount, side, wallet.keypair, globalName, client, interaction, firstSymbol, secondSymbol);
  }
})


// Command interaction
client.on(Events.InteractionCreate, async (interaction) => {
  console.log("command inputed");
  // validate command
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }
  try {
    await command.execute(interaction);
  }
  catch(err) {
    interaction.reply({
      content : "Executing command occurs some error. Retry.",
      ephemeral : true
    });
    return ;
  }
  return;
  // execute command
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

  // console.log("commandFiles...", commandFiles);
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ("data" in command && "execute" in command) {
    // console.log("command set....");
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}
