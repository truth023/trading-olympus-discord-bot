function parseAmountWithDecimal(strAmount, decimals) {
  const amount = parseFloat(strAmount) / 10 ** decimals;
  return amount.toString();
}

module.exports = { parseAmountWithDecimal };
