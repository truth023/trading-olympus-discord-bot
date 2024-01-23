const { publicKey, struct, u64, u8, ns64 } = require("@raydium-io/raydium-sdk");

const LOG_TYPE = struct([u8("log_type")]);
const INIT_LOG = struct([
  u8("log_type"),
  u64("time"),
  u8("pc_decimals"),
  u8("coin_decimals"),
  u64("pc_lot_size"),
  u64("coin_lot_size"),
  u64("pc_amount"),
  u64("coin_amount"),
  publicKey("market"),
]);

const RAY_IX_TYPE = {
  CREATE_POOL: 0,
  ADD_LIQUIDITY: 1,
  BURN_LIQUIDITY: 2,
  SWAP: 3,
};

const ACTION_TYPE = {
  DEPOSIT: "deposit",
  WITHDRAW: "withdraw",
  MINT: "mint",
  BURN: "burn",
  CREATE: "create",
  DEFAULT: "unknown",
};

const TITLE_LIST = [
  "NEW PAIR(RAYDIUM)",
  "Add liquidity (Mint LP)",
  "LP TOKEN BURNED",
];

const LP_ACTION_LIST = [
  "LP Created Amount",
  "LP Minted Amount",
  "LP Burnt Amount",
];

module.exports = {
  ACTION_TYPE,
  LOG_TYPE,
  LP_ACTION_LIST,
  INIT_LOG,
  RAY_IX_TYPE,
  TITLE_LIST,
};
