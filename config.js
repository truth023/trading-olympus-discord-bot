const { Keypair, Connection, PublicKey } = require("@solana/web3.js");
const bip39 = require("bip39");
const ed25519 = require("ed25519-hd-key");
const bs58 = require('bs58');
const { Redis } = require("@upstash/redis");

let client = undefined;
const SELL_50 = -1;
const SELL_100 = -2;

const subscribeId = new PublicKey(
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"
); // Raydium
const raydiumAuthority = new PublicKey(
  "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1"
);
const wSOL = "So11111111111111111111111111111111111111112";
// let amounts = {
//   EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 0.01,
//   Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: 0.01,
//   So11111111111111111111111111111111111111112: 0.001,
//   SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt: 0.32,
//   "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R": 0.18,
// };

const rpcUrl = "https://red-proud-sheet.solana-mainnet.quiknode.pro/33ccea1d5ab69294cb6749a8ff97f2e433558859/";
// const rpcUrl = "https://practical-crimson-replica.solana-mainnet.quiknode.pro/24b10dc1aa5def0f61bf28cef4d19ed5616da3ac/";
// const rpcUrl = "https://api.mainnet-beta.solana.com";
const wsUrl = "wss://red-proud-sheet.solana-mainnet.quiknode.pro/33ccea1d5ab69294cb6749a8ff97f2e433558859/";
// const wsUrl = "wss://practical-crimson-replica.solana-mainnet.quiknode.pro/24b10dc1aa5def0f61bf28cef4d19ed5616da3ac/";
// const wsUrl = "wss://api.mainnet-beta.solana.com/";
function offTokenMetaAPI(address) {
  return `https://token-list-api.solana.cloud/v1/search?query=${address}&start=0&limit=1&chainId=101`;
}
const connection = new Connection(rpcUrl, {
  wsEndpoint: wsUrl,
  confirmTransactionInitialTimeout: 30000,
  commitment: "confirmed",
});
const botToken = process.env.BOT_TOKEN;

// TODO: need to provide prv for each user actions
const team_mnemonic = "write your mnemonic here";
const amountArry = [0.1, 0.25, 0.5, 1, 2, 3, 4, 5, 10, 20];
const discordMsgColor = ["#00FFFF", "DarkPurple", "#FF6347"];
const discordPostChannel = ["🆕│new-pool", "general", "🔥│burn-token"];
const showControlPanelChannel = "🕹│control-panel";
const wallet = [];

const notificationMessageDelayTime = 4000;

let feePayer = undefined;
let poolId = undefined;
let defaultKey = new PublicKey("34vTq3GQxK6pgEbhnrgU1zs27gPWS6ZttxrYofDR4EkD");
let valState1 = "1111111111111111111";
let valState2 = "2222222222222222222";
const redis = new Redis({
  url: 'https://talented-asp-33773.upstash.io',
  token: process.env.UPSTASH_TOKEN,
})

async function initialLoad() {
  try {
    const data = await redis.get('wallet');
    console.log("==> Wallet info loaded!", data.length);
    console.log(data[0].walletKey);
    // wallet = data;
  } catch (e) {
    console.error('==> Wallet info load failed!!');
    console.error(e);
  }
}

async function addWallet(data) {
  // console.log("addWallet Data ===>", data);


  const index = wallet.findIndex((value) => value.user == data.user);
  if (index == -1) wallet.push(data);
  else wallet[index].walletKey = data.walletKey;
  console.log("================================================================");
  for (let i = 0; i < wallet.length; i++) {
    console.log(wallet[i].user, "====>", bs58.encode(wallet[i].walletKey.secretKey), "==>", wallet[i].slip, "==>", wallet[i].amount, "==>", wallet[i].sellAmount);
  }
  const res = await redis.get('wallet');
  res.push(data);
  console.log("set redis===>", res);
  const response = await redis.set('wallet', JSON.stringify(res));
  console.log("redist response ==>", response);
}

function setPoolId(id) {
  poolId = id;
}
function getPoolId() {
  return poolId;
}

function getWallet(id) {
  for (let i = 0; i < wallet.length; i++) {
    if (wallet[i].user == id) {
      return {
        keypair: wallet[i].walletKey,
        slip: wallet[i].slip,
        autoBuy: wallet[i].autoBuy,
        amount: wallet[i].amount,
        sellAmount: wallet[i].sellAmount
      };
    }
  }
  return -1;
}

function setSlippage(id, value) {
  for (let i = 0; i < wallet.length; i++) {
    if (wallet[i].user == id) {
      wallet[i].slip = value;
    }
  }
}

function setAmount(id, value) {
  for (let i = 0; i < wallet.length; i++) {
    if (wallet[i].user == id) {
      wallet[i].amount = value;
      console.log(wallet[i].user, "====>", bs58.encode(wallet[i].walletKey.secretKey), "==>", wallet[i].slip, "==>", wallet[i].amount);
    }
  }
}

function setSellAmount(id, value) {
  for (let i = 0; i < wallet.length; i++) {
    if (wallet[i].user == id) {
      wallet[i].sellAmount = value;
      console.log(wallet[i].user, "====>", bs58.encode(wallet[i].walletKey.secretKey), "==>", wallet[i].slip, "==>", wallet[i].sellAmount);
    }
  }
}

function setAutoBuy(id, value) {
  for (let i = 0; i < wallet.length; i++) {
    if (wallet[i].user == id) wallet[i].autoBuy = value;
  }
}

function getAutoBuy(id) {
  for (let i = 0; i < wallet.length; i++) {
    if (wallet[i].user == id) return wallet[i].autoBuy;
  }
}

function setupFeePayer(keypair) {
  feePayer = keypair;
}

function getFeePayer() {
  return feePayer;
}

module.exports = {
  amountArry,
  botToken,
  connection,
  discordMsgColor,
  discordPostChannel,
  getFeePayer,
  getWallet,
  initialLoad,
  offTokenMetaAPI,
  raydiumAuthority,
  rpcUrl,
  setupFeePayer,
  subscribeId,
  wSOL,
  wsUrl,
  setPoolId,
  getPoolId,
  addWallet,
  SELL_100,
  SELL_50,
  client,
  notificationMessageDelayTime,
  setSlippage,
  setAutoBuy,
  getAutoBuy,
  setAmount,
  setSellAmount,
  showControlPanelChannel,
  wallet,
  valState1,
  valState2,
  defaultKey
};
