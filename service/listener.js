const lo = require("lodash");
const { PublicKey } = require("@solana/web3.js");

const { connection, subscribeId } = require("../config");
const { postActivity } = require("./discordMessage");
const { parseAddTransaction } = require("./parsers/addLiquidity");
const { parseBurnTransaction } = require("./parsers/burnLiquidity");
const { parseCreateTransaction } = require("./parsers/createPool");
const { getTokenAddress } = require("../utils/getTokenAddress");
const { LOG_TYPE, RAY_IX_TYPE, INIT_LOG } = require("../utils/RAY_LOG");

const MockupData = require("../mockup");
const { LIQUIDITY_STATE_LAYOUT_V4 } = require("@raydium-io/raydium-sdk");
const datetime = require("datetime");

const startListener = async (client) => {
  connection.onLogs(
    [subscribeId],
    async (x) => {
      try {
        let log = x.logs;
        let sig = x.signature;
        await onMarket(client, x.err, log, sig);
      } catch (ex) {
        console.error(ex);
      }
    },
    "confirmed"
  );
};

async function onMarket(client, err, log, sig) {
  try {
    let ray_log_row = lo.find(log, (y) => y.includes("ray_log"));
    
    if (!err && ray_log_row) {
      try {
        let ray_data = Buffer.from(
          ray_log_row.match(/ray_log: (.*)/)[1],
          "base64"
        );
        let log_type = LOG_TYPE.decode(ray_data).log_type;
        switch (log_type) {
          case RAY_IX_TYPE.BURN_LIQUIDITY: {
            let tx;
            try {
              tx = await connection.getParsedTransaction(sig, {
              maxSupportedTransactionVersion: 0,
              });
            } catch(err) {
              // interaction.followUp({
              //   content : "Getting Parsed Transaction occur errors. Please try again.",
              //   ephemeral : true
              // })
              return ;
            }
            // console.log("tx ===>", tx);
            const instructions = tx.transaction.message.instructions;
            const raydiumInstruction = instructions.find((instruction) => {return instruction.programId.toString() == "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"});
            if(!raydiumInstruction || !raydiumInstruction.accounts[1]) return ;
            const poolId = raydiumInstruction.accounts[1];
            console.log("pool id .....", poolId);

            // console.log(`Got burn liquidity tx: ${sig}`);
            try {
              const info = await parseBurnTransaction(sig);
              // console.log("==================> const info = await parseBurnTransaction(sig);");
              let res = info.map((data) => ({ ...data, token: undefined }));
              try {
                res = await fetchTokenInfo(res);
              } catch(err) {
                console.log("fetchTokenInfo error ===>", err);
                return ;
              }
              // console.log("==================> res = await fetchTokenInfo(res);");
              try {
                await postActivity(client, res, RAY_IX_TYPE.BURN_LIQUIDITY, poolId);
              } catch(err) {
                // interaction.followUp({
                //   content : "Post Activity occur errors. Please try again.",
                //   ephemeral : true
                // })
                return ;
              }
              // console.log("==================> await postActivity(client, res, RAY_IX_TYPE.BURN_LIQUIDITY, poolId);");
            }
            catch(err) {
              return ;
              // console.log("burn liquidity error ==>", err);
            }
            break;
          }
          case RAY_IX_TYPE.CREATE_POOL: {
            let tx = await connection.getParsedTransaction(sig, {
              maxSupportedTransactionVersion: 0,
            });
            const instructions = tx.transaction.message.instructions;
            const raydiumInstruction = instructions.find((instruction) => {return instruction.programId.toString() == "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"});
            const poolId = raydiumInstruction.accounts[4];

            // console.log(`Got create pool tx: ${sig}`);
            
            // console.log('...Pool Id.....', poolId);
            const ray_input = INIT_LOG.decode(ray_data);
            let info;
            try {
              info = await parseCreateTransaction(ray_input, sig);
            } catch(err) {
              // interaction.followUp({
              //   content : "Parsing Create Transaction occur errors. Please try again.",
              //   ephemeral : true
              // })
              return ;
            }
            let res = info.map((data) => ({ ...data, token: undefined }));
            try {
              res = await fetchTokenInfo(res);
            }
            catch(err) {
              console.log("fetchTokenInfo error ===>", err);
              return ;
            }
            try {
              await postActivity(client, res, RAY_IX_TYPE.CREATE_POOL, poolId);
            } catch(err) {
              console.log("posting activity occur errors");
              return ;
            }
            break;
          }
        }
      } catch (ex) {
        console.error(ex);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

async function fetchTokenInfo(info) {
  let result = info;
  if (!info[0].mintOrAta) return result;

  let data;
  try {
    data = await getTokenAddress(
      result.map((r) => new PublicKey(r.mintOrAta))
    );
  } catch(err) {
    console.log("Getting token address occur errors");
    return ;
  }
  for (let key of Object.keys(result)) {
    result[key].token = data[result[key].mintOrAta];
  }

  return result;
}

// const startListener = async (client) => {
// // MockupData.ADD_MOCKUP.map((data) => {
// //   onMarket(client, false, data.log, data.sig);
// // });
//   await MockupData.BURN_MOCKUP.map(async (data) => {
//   await onMarket(client, false, data.log, data.sig);
// });
//   // MockupData.CREATE_MOCKUP.map(async (data) => {
//   //   await onMarket(client, false, data.log, data.sig);
//   // });
// };

module.exports = { startListener };
