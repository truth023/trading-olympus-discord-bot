const { PublicKey } = require("@solana/web3.js");

const { connection } = require("../config");
const { getMetadata } = require("./getMetaData");

const getTokenAddress = async (accounts) => {
  try {
    // Get the pool account info
    let poolAccountInfo = await connection.getMultipleParsedAccounts(accounts);

    let mintInfo = {};
    poolAccountInfo.value.map((info, idx) => {
      const account = accounts[idx].toBase58();
      if (info.data.space === 165) {
        const mint = info.data.parsed?.info?.mint;
        mintInfo[account] = {
          address: mint,
          decimals: info.data.parsed?.info?.tokenAmount?.decimals,
        };
      } else if (info.data.space === 82) {
        mintInfo[account] = {
          address: account,
          decimals: info.data.parsed?.info?.decimals,
        };
      }
    });
    // console.log(mintInfo);

    // Retrieve the token address from the token account data
    return await getMetadata(mintInfo);
  } catch (error) {
    console.error("Error:", error);
  }
};

module.exports = { getTokenAddress };
