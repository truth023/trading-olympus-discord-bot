const { Metaplex } = require("@metaplex-foundation/js");
const { PublicKey } = require("@solana/web3.js");
const axios = require("axios");

const { connection, offTokenMetaAPI } = require("../config");

const getMetadata = async (tokenInfos) => {
  const metaplex = Metaplex.make(connection);
  let tokens = await metaplex.nfts().findAllByMintList({
    mints: Object.values(tokenInfos).map((info) => new PublicKey(info.address)),
  });

  for (let i = 0; i < tokens.length; i++) {

    if (!tokens[i]?.uri) {
      const res = await axios
        .get(offTokenMetaAPI(Object.values(tokenInfos)[i].address))
        .then((res) => res.data)
        .catch((e) => {
          console.error(
            `Could not get token meta for ${
              Object.values(tokenInfos)[i].address
            }`
          );
          return {
            content: [],
          };
        });
      if (res.content.length > 0)
        tokens[i] = {
          mintAddress: new PublicKey(Object.values(tokenInfos)[i].address),
          name: res.content[0].name,
          symbol: res.content[0].symbol,
          uri: res.content[0].logoURI,
          image: res.content[0].logoURI,
        };
      else
        tokens[i] = {
          mintAddress: new PublicKey(Object.values(tokenInfos)[i].address),
          name: "Unregistered Token",
          symbol: Object.values(tokenInfos)[i].address,
          uri: "",
        };
    } else if (!tokens[i]?.image) {
      // TODO: fetch uri json and read image url.
      const response = await axios.get(tokens[i]?.uri);
      tokens[i].image = response.data.image;
      tokens[i].description = response.data.description;
    }
  }

  let result = tokenInfos;
  tokens
    .filter((info) => info !== null)
    .map((info) => {
      mint = info.mintAddress.toBase58();
      const idx = Object.values(result)
        .map((info) => info.address)
        .indexOf(mint);
      const account = Object.keys(result)[idx];
      result[account] = {
        ...result[account],
        name: info.name,
        symbol: info.symbol,
        uri: info.uri,
        image: info.json?.image || info.image,
        desc: info.json?.description || info?.description,
      };
    });
  return result;
};

module.exports = { getMetadata };
