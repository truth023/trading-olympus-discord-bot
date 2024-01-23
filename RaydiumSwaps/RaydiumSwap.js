const { Connection, Keypair, PublicKey, Transaction } = require("@solana/web3.js");
const { Liquidity, Token, TokenAmount, Percent, TxVersion, parseBigNumberish, LIQUIDITY_STATE_LAYOUT_V4 } = require("@raydium-io/raydium-sdk");
const { fetchPoolKeys } = require("./util_mainnet");
const { getTokenAccountsByOwner} = require("./util");
const { getWallet, getAutoBuy } = require("../config");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

// import { RaydiumPools } from "./RaydiumPools";

function raydiumApiSwap(connection, ammount, side, ownerKeypair, pairing, marketProgramId, baseDecimal, quoteDecimal, interaction, client, flag){
    return new Promise((resolve, reject) => {

        const swap = async () => {
            
            // let raydiumPairing: string = pairing.replace('/', '_')
            // const fromRaydiumPools = RaydiumPools[pairing]
            const fromRaydiumPools = pairing;
            // console.log(`fetched pool key ${pairing}: ${fromRaydiumPools}`);

            // const connection = new Connection("https://solana-api.projectserum.com", "confirmed");
            // const skBuffer = Buffer.from(secretKey);
            // const ownerKeypair = Keypair.fromSecretKey(skBuffer);
            const owner = ownerKeypair.publicKey;
            
            try {
                let tokenAccounts;
                try{
                    tokenAccounts = await getTokenAccountsByOwner(connection, owner);
                } catch(err) {
                    interaction.followUp({
                        content : "Getting Token Accounts occur errors. Please try again.",
                        ephemeral : true
                      })
                    return ;
                }
                // console.log('connected token account')
                let poolKeys;
                try {
                    poolKeys = await fetchPoolKeys(connection, new PublicKey(fromRaydiumPools), marketProgramId);
                } catch(err) {
                    interaction.followUp({
                        content : "Fetching PoolKeys occur errors. Please try again.",
                        ephemeral : true
                      })
                    return ;
                }
                // console.log(`fetched pool keys: ====>`, poolKeys);
                // console.log(poolKeys.marketBids)
                
                if (poolKeys) {
                    let poolInfo;
                    try{
                        poolInfo = await Liquidity.fetchInfo({ connection, poolKeys });
                    } catch(err) {
                        console.log("liquidity fetching ==>", err);
                        interaction.followUp({
                            content : "Liquidity Fetching Info occur errors. Please try again.",
                            ephemeral : true
                          })
                        return ;
                    }
                    // console.log("poolInfo ===>", poolInfo);
                    
                    let coinIn;
                    let coinOut;
                    let coinInDecimal;
                    let coinOutDecimal;
                    
                    if(side == 'buy'){
                        coinIn = poolKeys.quoteMint;
                        coinInDecimal = quoteDecimal;
                        coinOut = poolKeys.baseMint;
                        coinOutDecimal = baseDecimal;
                    }
                    else{
                        coinIn = poolKeys.baseMint;
                        coinInDecimal = baseDecimal;
                        coinOut = poolKeys.quoteMint;
                        coinOutDecimal = quoteDecimal;
                    }
                    amount = parseInt((ammount * 10 ** coinInDecimal).toFixed(0));
                    // console.log("amountIn ===>");
                    // console.log("coninIn ==> ", coinIn);
                    const amountIn = new TokenAmount(new Token(TOKEN_PROGRAM_ID, coinIn, coinInDecimal), amount);
                    // console.log("currencyOut ==>");
                    const currencyOut = new Token(TOKEN_PROGRAM_ID, coinOut, coinOutDecimal);
                    // console.log("slippage ===>");
                    const value = getWallet(interaction.user.id);
                    const slippage = new Percent(value.slip, 100);
                    // console.log("slippage ===>", slippage);
                    // interaction.followUp({
                    //     content : `Your transactin slippage value is ${slippage}`,
                    //     ephemeral : true
                    // })
                    // console.log("slippage finished", slippage);
                    const { amountOut, minAmountOut, currentPrice, executionPrice, priceImpact, fee } = Liquidity.computeAmountOut({
                        poolKeys,
                        poolInfo,
                        amountIn,
                        currencyOut,
                        slippage
                    });

                    const excPr = () =>{
                        if(executionPrice != null){
                            return `executionPrice : ${executionPrice.toFixed()}\n`;
                        }
                    }
                    
                    // console.log(
                    //     amountOut.toFixed(),
                    //     minAmountOut.toFixed(),
                    //     currentPrice.toFixed(),
                    //     excPr(),
                    //     priceImpact.toFixed(),
                    //     fee.toFixed(),
                    // );
                    
                    
                    const runTransaction = async () => {
                        if(minAmountOut <=0 || amountIn <= 0) {
                            interaction.followUp({
                                content : "Amounts must greater than zero. Please try again.",
                                ephemeral : true
                            })
                            return ;
                        }
                        const transaction = new Transaction();
                        let simpleInstruction;
                        try{
                          simpleInstruction = await Liquidity.makeSwapInstructionSimple({
                            connection,
                            poolKeys,
                            userKeys: {
                                tokenAccounts,
                                owner,
                            },
                            amountIn,
                            amountOut: minAmountOut,
                            fixedSide: "in",
                            makeTxVersion : TxVersion.V0
                        });
                        } catch(err) {
                            interaction.followUp({
                                content : "Making swap instruction occurs errors.",
                                ephemeral : true
                            })
                            return ;
                        }
                        const instructions = simpleInstruction.innerTransactions[0].instructions;
                        for(let i = 0; i < instructions.length; i++)    transaction.add(instructions[i]);
                        let signature;
                        try {
                            signature = await connection.sendTransaction(transaction, [ownerKeypair], { skipPreflight: true });
                        console.log("signature ===>",signature);
                        } catch(err) {
                            interaction.followUp({
                                content: "Sending Transaction occurs errors. Please try again!",
                                ephemeral : true
                            })
                            return ;
                        }


                        //check transaction
                        let timeNow = new Date().getTime();

                        function checkTransactionError(timeNow, signature){

                            let newtime = new Date().getTime();
                            let tdiff = newtime - timeNow
                            if(tdiff > 30000){
                                return reject(new Error('Transaction not processed'));
                            }

                            const checkConfirmation = async () => {
                                let status;
                                try {
                                    status = await connection.getSignatureStatus(signature);
                                } catch(err) {
                                    interaction.followUp({
                                        content : "Getting signature occurs errors",
                                        ephemeral : true
                                    })
                                    return ;
                                }
                                
                                if(status.value?.confirmationStatus == 'confirmed'){
                                    if(status.value?.err){
                                        console.log('error');
                                        return reject(new Error('Transaction Failed'));
                                    }else{
                                        return resolve(signature);
                                    }
                                }
                                checkTransactionError(timeNow, signature);
                                
                            }
                            return checkConfirmation();
                            
                        }

                        checkTransactionError(timeNow, signature);
                    }

                    const autoBuyState = getAutoBuy(interaction.user.id);
                    if(autoBuyState == false) {
                    const yesButton = new ButtonBuilder()
                    .setCustomId(`Yes`)
                    .setLabel(`Yes`)
                    .setStyle(ButtonStyle.Secondary);
                    const noButton = new ButtonBuilder()
                        .setCustomId(`No`)
                        .setLabel(`No`)
                        .setStyle(ButtonStyle.Danger);
                    const row2 = new ActionRowBuilder().addComponents(
                        yesButton,
                        noButton,
                    );
                    const content = `Transaction Information\nAmountOut : ${amountOut.toFixed()}(Token/Sol)\nMinAmountOut : ${minAmountOut.toFixed()}(Token/Sol)\nCurrentPrice : ${currentPrice.toFixed()}\n${excPr()}PriceImpact : ${priceImpact.toFixed()}%\nFee : 0.000005 SOL`;
                    let response;
                    try {
                        response = await interaction.followUp({content, ephemeral : true, components : [row2]});
                    } catch(err) {
                        console.log("Responsing occur errors");
                        return ;
                    }
                    const filter = i => i.customId === 'Yes' || i.customId ==='No';
                    console.log("filter ==>", filter);
                    const collector = response.createMessageComponentCollector({filter, time: 15000});
                    let flag = 0;
                    collector.on('collect', async i => {
                        if (i.customId === 'Yes') {
                            
                        if(amountOut == 0) {
                            interaction.followUp({
                                content: "This transaction can't run. Because the amountOut is zero.",
                                ephemeral: true
                            })
                            return ;
                        }
                        try {
                            await i.reply({content : 'Transaction is running!', ephemeral : true});
                        } catch(err) {
                            interaction.followUp({
                                content : "Running transaction occurs errors.",
                                ephemeral : true
                            })
                            return ;
                        }
                        
                        runTransaction();
                        collector.stop();
                        } else if (i.customId === 'No') {
                        console.log("i =================================>", i.message.reference);
                        try {
                            await i.reply({content : 'Transaction has been canceled!', ephemeral : true});
                        } catch(err) {
                            interaction.followUp({
                                content : "Transaction failed.",
                                ephemeral : true
                            })
                            return ;
                        }
                        collector.stop();
                        }
                    });
                    collector.on('end',async (collected) => {
                        if(collected.size === 0) {
                        interaction.followUp({content : 'No button was clicked within the time limit.', ephemeral : true});
                        }
                    })
                    } else {
                        runTransaction();
                    }

                    // const transaction = new Transaction();

                    // const simpleInstruction = await Liquidity.makeSwapInstructionSimple({
                    //     connection,
                    //     poolKeys,
                    //     userKeys: {
                    //         tokenAccounts,
                    //         owner,
                    //     },
                    //     amountIn,
                    //     amountOut: minAmountOut,
                    //     fixedSide: "in",
                    //     makeTxVersion : TxVersion.V0
                    // });
                    // const instructions = simpleInstruction.innerTransactions[0].instructions;
                    // for(let i = 0; i < instructions.length; i++)    transaction.add(instructions[i]);
                    // const signature = await connection.sendTransaction(transaction, [ownerKeypair], { skipPreflight: true });
                    // console.log("signature ===>",signature);


                    // //check transaction
                    // let timeNow = new Date().getTime();

                    // function checkTransactionError(timeNow, signature){

                    //     let newtime = new Date().getTime();
                    //     let tdiff = newtime - timeNow
                    //     if(tdiff > 30000){
                    //         return reject(new Error('Transaction not processed'));
                    //     }

                    //     const checkConfirmation = async () => {
                    //         const status = await connection.getSignatureStatus(signature);
                            
                    //         if(status.value?.confirmationStatus == 'confirmed'){
                    //             if(status.value?.err){
                    //                 console.log('error');
                    //                 return reject(new Error('Transaction Failed'));
                    //             }else{
                    //                 return resolve(signature);
                    //             }
                    //         }
                    //         checkTransactionError(timeNow, signature);
                            
                    //     }
                    //     return checkConfirmation();
                        
                    // }

                    // checkTransactionError(timeNow, signature);
                }
            }

            catch(err){
                console.log('Swap() function error ===>', err);
                reject(err);
            }
            
        }
        swap();
    })
}

module.exports = {raydiumApiSwap};



