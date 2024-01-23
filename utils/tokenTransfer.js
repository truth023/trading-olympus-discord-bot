const bs58 = require("bs58");
const {
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
} = require("@solana/web3.js");

const { connection } = require("../config");

const tokenTransfer = async (privateKey, publicKey, amount) => {
  console.log("privatekey on function", privateKey);
  console.log("wallet addresss on function", publicKey);

  try {
    const feePayer = Keypair.fromSecretKey(bs58.decode(privateKey));

    let tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: feePayer.publicKey,
        toPubkey: new PublicKey(publicKey),
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );
    let txhash = await connection.sendTransaction(tx, [feePayer]);
    console.log(`txhash: ${txhash}`);
    return txhash;
  } catch (error) {
    console.error("Error:", error);
  }
};

module.exports = { tokenTransfer };
