const { LAMPORTS_PER_SOL } = require("@solana/web3.js");

const { connection } = require("../config");

const getBalance = async (address) => {
  try {
    const balance = await connection.getBalance(address);
    // console.log(`Balance for address ${balance / LAMPORTS_PER_SOL} SOL`);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error("Error:", error);
    return 0;
  }
};

module.exports = { getBalance };
