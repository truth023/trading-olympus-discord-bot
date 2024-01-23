const { connection, subscribeId, raydiumAuthority } = require("../../config");
const { ACTION_TYPE } = require("../../utils/RAY_LOG");

async function parseCreateTransaction(input_data, sig) {
  try {
    const tx = await connection.getParsedTransaction(sig, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 2,
    });

    const feePayer = tx.transaction.message.accountKeys[0].pubkey.toBase58();

    const ixs = tx.transaction.message.instructions;
    let ix_index = -1;
    for (let i = 0; i < ixs.length; i++) {
      if (ixs[i].programId.toBase58() == subscribeId.toBase58()) {
        ix_index = i;
        break;
      }
    }

    let inner_ixs = tx.meta.innerInstructions;
    if (ix_index == -1) {
      console.error(`Could not parse activity from ix in ${sig}`);
      return [
        {
          user: feePayer,
          signature: sig,
        },
      ];
    }

    let result = [];
    inner_ixs
      .filter((inner_ixs) => inner_ixs.index === ix_index)[0]
      .instructions.slice(-3)
      .map((inn_ix) => {
        let bIsSending = ACTION_TYPE.DEFAULT;
        const owner = inn_ix.parsed?.info?.authority;
        if (owner === feePayer || inn_ix.parsed?.type === "mintTo")
          bIsSending = ACTION_TYPE.DEPOSIT;
        else if (
          owner === raydiumAuthority.toBase58() ||
          inn_ix.parsed?.type == "mintTo"
        )
          bIsSending = ACTION_TYPE.MINT;
        result.push({
          mode: bIsSending,
          user: feePayer,
          amount: inn_ix.parsed?.info?.amount,
          mintOrAta:
            inn_ix.parsed?.info?.mint || inn_ix.parsed?.info?.destination,
          signature: sig,
        });
      });

    return result;
  } catch (error) {
    console.error(error);
    return [
      {
        signature: sig,
      },
    ];
  }
}

module.exports = { parseCreateTransaction };
