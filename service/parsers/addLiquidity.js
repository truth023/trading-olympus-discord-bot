const { connection, subscribeId, raydiumAuthority } = require("../../config");
const { ACTION_TYPE } = require("../../utils/RAY_LOG");

async function parseAddTransaction(sig) {
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
      for (let i = 0; i < inner_ixs.length; i++) {
        // Check if inner ixs has raydium ix
        const idx = inner_ixs[i].instructions
          .map((inn_ix) => inn_ix.programId.toBase58())
          .indexOf(subscribeId.toBase58());
        // TODO: need to check the inner ix is add liquidity ix
        if (idx > -1) {
          ix_index = inner_ixs[i].index;
          inner_ixs = [
            {
              index: ix_index,
              instructions: inner_ixs[i].instructions.filter(
                (inn_ix) =>
                  inn_ix.programId.toBase58() !== subscribeId.toBase58()
              ),
            },
          ];
          break;
        }
      }
      if (ix_index == -1) {
        console.error(`Could not parse activity from ix in ${sig}`);
        return [
          {
            user: feePayer,
            signature: sig,
          },
        ];
      }
    }

    let result = [];
    inner_ixs
      .filter((inner_ixs) => inner_ixs.index === ix_index)[0]
      .instructions.slice(-3)
      .map((inn_ix) => {
        let bIsSending = ACTION_TYPE.DEFAULT;
        const owner =
          inn_ix.parsed?.info?.mintAuthority || inn_ix.parsed?.info?.authority;
        if (owner === feePayer || inn_ix.parsed?.type === "transfer")
          bIsSending = ACTION_TYPE.DEPOSIT;
        else if (
          owner === raydiumAuthority.toBase58() ||
          inn_ix.parsed?.type === "mintTo"
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

module.exports = { parseAddTransaction };
