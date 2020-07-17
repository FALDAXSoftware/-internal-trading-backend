/*
Used to get Tradding Fees
*/
var CurrencyConversionModel = require("../../models/CurrencyConversion");
var CoinsModel = require("../../models/Coins");
var moment = require('moment')
var TradeHistoryModel = require("../../models/TradeHistory");
var Fees = require("../../models/Fees");
var Wallet = require("../../models/Wallet");

var getTraddingFees = async (inputs) => {
    var makerTakerFees = {};
    try {
        var request = inputs;
        // console.log("inputs", (inputs))
        var user_id = parseInt(inputs.user_id);
        var requested_user_id = parseInt(inputs.requested_user_id);
        // inputs.makerFee = 0.21


        //Maker and Taker fee according to trades executed by user
        var getCurrencyPriceData = null

        var getCryptoPriceData = null

        // let conversionSQL = `SELECT currency_conversion.quote, currency_conversion.symbol, currency_conversion.coin_id
        //                         FROM currency_conversion
        //                         WHERE currency_conversion.deleted_at IS NULL`

        // let conversionData = await CurrencyConversionModel.knex().raw(conversionSQL)

        let conversionData = await CurrencyConversionModel
            .query()
            .select()
            .where("deleted_at", null)
            .andWhere(builder => {
                builder.where('coin_id', request.crypto_coin_id)
                    .orWhere('coin_id', request.currency_coin_id)
            })
            .orderBy("id", "DESC");

        // console.log("conversionData", conversionData)

        // console.log("conversionData", conversionData.rows)

        var now = moment().format();
        var resultData;
        var yesterday = moment(now)
            .subtract(1, 'months')
            .format();
        let userTradeHistorySum = {}
        // console.log("user_id", user_id)
        if (user_id != process.env.TRADEDESK_USER_ID) {
            // console.log("INSIDE IF USEr")
            let userTradesum = await TradeHistoryModel.knex().raw(`SELECT (a1.sum+a2.sum) as total, a1.sum as user_sum, a2.sum as requested_sum , a1.user_coin ,a2.requested_coin
                                                                        FROM(SELECT user_coin, sum(quantity) FROM trade_history
                                                                        WHERE user_id = ${user_id} AND created_at >= '${yesterday}' AND created_at <= '${now}' GROUP BY user_coin) a1
                                                                        FULL JOIN (SELECT requested_coin, sum(quantity) FROM trade_history
                                                                        WHERE requested_user_id = ${user_id} AND created_at >= '${yesterday}' AND created_at <= '${now}' GROUP BY requested_coin) as a2
                                                                        ON a1.user_coin = a2.requested_coin`)

            // console.log("userTradesum", userTradesum.rows.length)
            for (let index = 0; index < userTradesum.rows.length; index++) {
                const element = userTradesum.rows[index];
                userTradeHistorySum[element.user_coin ? element.user_coin : element.requested_coin] = element.total ? element.total : (element.user_sum ? element.user_sum : element.requested_sum)
            }
        }

        let requestedTradeHistorySum = {}
        // console.log("requested_user_id", requested_user_id)
        if (requested_user_id != process.env.TRADEDESK_USER_ID) {
            // console.log("INSIDE IF Requested")
            let requestedTradesum = await TradeHistoryModel.knex().raw(`SELECT (a1.sum+a2.sum) as total, a1.sum as user_sum, a2.sum as requested_sum , a1.user_coin ,a2.requested_coin
                                                                            FROM(SELECT user_coin, sum(quantity) FROM trade_history
                                                                            WHERE user_id = ${requested_user_id} AND created_at >= '${yesterday}' AND created_at <= '${now}' GROUP BY user_coin) a1
                                                                            FULL JOIN (SELECT requested_coin, sum(quantity) FROM trade_history
                                                                            WHERE requested_user_id = ${requested_user_id} AND created_at >= '${yesterday}' AND created_at <= '${now}' GROUP BY requested_coin) as a2
                                                                            ON a1.user_coin = a2.requested_coin`)
            for (let index = 0; index < requestedTradesum.rows.length; index++) {
                const element = requestedTradesum.rows[index];
                requestedTradeHistorySum[element.user_coin ? element.user_coin : element.requested_coin] = element.total ? element.total : (element.user_sum ? element.user_sum : element.requested_sum)
            }
        }

        // console.log("requestedTradeHistorySum", requestedTradeHistorySum)
        // console.log("userTradeHistorySum", userTradeHistorySum);
        // console.log("Object.keys(userTradeHistorySum).length", Object.keys(userTradeHistorySum).length);
        // console.log("Object.keys(requestedTradeHistorySum).length != 0", Object.keys(requestedTradeHistorySum).length != 0)

        // console.log("requestedTradeHistorySum", requestedTradeHistorySum)

        let userTotalUSDSum = 0
        let requestedTotalUSDSum = 0
        for (let index = 0; index < conversionData.length; index++) {
            const element = conversionData[index];
            if (element.coin_id == request.crypto_coin_id) {
                getCryptoPriceData = element
            }
            if (element.coin_id == request.currency_coin_id) {
                getCurrencyPriceData = element
            }
            if (Object.keys(userTradeHistorySum).length != 0) {
                if (userTradeHistorySum[element.symbol]) {
                    userTotalUSDSum += (userTradeHistorySum[element.symbol] * element.quote.USD.price)
                }
            } else {
                userTotalUSDSum = 0.0;
            }
            if (Object.keys(requestedTradeHistorySum).length != 0) {
                if (requestedTradeHistorySum[element.symbol]) {
                    requestedTotalUSDSum += (requestedTradeHistorySum[element.symbol] * element.quote.USD.price)
                }
            } else {
                requestedTotalUSDSum = 0.0
            }
        }

        // console.log("userTotalUSDSum", userTotalUSDSum);
        // console.log("requestedTotalUSDSum", requestedTotalUSDSum)

        var totalCurrencyAmount = userTotalUSDSum;
        var totalCryptoAmount = requestedTotalUSDSum;

        // if ((user_id != process.env.TRADEDESK_USER_ID)) {
        var currencyMakerFee = await Fees
            .query()
            .first()
            .select('maker_fee', 'taker_fee')
            .where('deleted_at', null)
            .andWhere('min_trade_volume', '<=', parseFloat(totalCurrencyAmount))
            .andWhere('max_trade_volume', '>=', parseFloat(totalCurrencyAmount));
        inputs.takerFee = currencyMakerFee.taker_fee
        // }

        // if (requested_user_id != process.env.TRADEDESK_USER_ID) {
        var cryptoTakerFee = await Fees
            .query()
            .first()
            .select('maker_fee', 'taker_fee')
            .where('deleted_at', null)
            .andWhere('min_trade_volume', '<=', parseFloat(totalCryptoAmount))
            .andWhere('max_trade_volume', '>=', parseFloat(totalCryptoAmount));


        // Just Replace inputs.makerFee and inputs.takerFee with following
        inputs.makerFee = cryptoTakerFee.maker_fee
        // }
        var currency_coin_id = request.currency_coin_id;
        var crypto_coin_id = request.crypto_coin_id

        var user_usd;
        let userWallets = await Wallet
            .query()
            .select()
            .where('deleted_at', null)
            .andWhere('is_active', true)
            .andWhere(function () {
                this.where('coin_id', currency_coin_id).orWhere('coin_id', crypto_coin_id)
            })
            .andWhere('user_id', inputs.user_id);
        var currencyWalletUser = null
        var cryptoWalletUser
        for (let index = 0; index < userWallets.length; index++) {
            const element = userWallets[index];
            if (element.coin_id == currency_coin_id) {
                currencyWalletUser = element
            } else if (element.coin_id == crypto_coin_id) {
                cryptoWalletUser = element
            }
        }

        // console.log("cryptoWalletUser", cryptoWalletUser);
        // console.log("currencyWalletUser", currencyWalletUser)


        let requestedWallets = await Wallet
            .query()
            .select()
            .where('deleted_at', null)
            .andWhere('is_active', true)
            .andWhere(function () {
                this.where("coin_id", currency_coin_id).orWhere("coin_id", crypto_coin_id)
            })
            .andWhere('user_id', inputs.requested_user_id);
        var currencyWalletRequested = null
        var cryptoWalletRequested = null
        for (let index = 0; index < requestedWallets.length; index++) {
            const element = requestedWallets[index];
            if (element.coin_id == currency_coin_id) {
                currencyWalletRequested = element
            } else if (element.coin_id == crypto_coin_id) {
                cryptoWalletRequested = element
            }
        }

        // console.log("currencyWalletRequested", currencyWalletRequested);
        // console.log("cryptoWalletRequested", cryptoWalletRequested)

        let adminWallets = await Wallet
            .query()
            .select()
            .where('deleted_at', null)
            .andWhere('is_active', true)
            .andWhere(function () {
                this.where("coin_id", currency_coin_id).orWhere("coin_id", crypto_coin_id)
            })
            .andWhere('user_id', 36);
        var adminWalletCrypto = null
        var adminWalletCurrency = null
        for (let index = 0; index < adminWallets.length; index++) {
            const element = adminWallets[index];
            if (element.coin_id == currency_coin_id) {
                adminWalletCurrency = element
            } else if (element.coin_id == crypto_coin_id) {
                adminWalletCrypto = element
            }
        }

        // console.log("adminWalletCurrency", adminWalletCurrency)
        // console.log("adminWalletCrypto", adminWalletCrypto)

        if (user_id == process.env.TRADEDESK_USER_ID) {
            inputs.takerFee = 0;
        }

        if (requested_user_id == process.env.TRADEDESK_USER_ID) {
            inputs.makerFee = 0;
        }

        // inputs.makerFee = 0.21
        // console.log("inputs.makerFee", inputs.makerFee)
        // console.log("inputs.takerFee", inputs.takerFee)
        // Calculating fees value on basis of the side and order executed
        if (inputs.side == "Buy") {
            // console.log("cryptouserbalance", cryptoWalletUser);
            // console.log("cryptouserPlacedbalance", cryptouserPlacedbalance)
            // ---------------------------crypto-------------------------------------- //
            var cryptouserbalance = cryptoWalletUser.balance + ((inputs.quantity) - ((inputs.quantity * inputs.takerFee / 100)));
            var cryptouserbalance = parseFloat(cryptouserbalance.toFixed(8));
            var cryptouserPlacedbalance = cryptoWalletUser.placed_balance + ((inputs.quantity) - ((inputs.quantity * inputs.takerFee / 100)));
            var cryptouserPlacedbalance = parseFloat(cryptouserPlacedbalance.toFixed(8));

            var updateSql = await Wallet.knex().raw(`UPDATE wallets
                                                        SET balance = ${cryptouserbalance}, placed_balance = ${cryptouserPlacedbalance}
                                                        WHERE id = ${cryptoWalletUser.id}
                                                        RETURNING *`)
            var a = updateSql.rows[0]
            // console.log("a", a)
            var cryptorequestedbalance;
            var cryptorequestedplacedbalance;
            if (user_id == requested_user_id) {
                // console.log("INSIDE IF")
                if (requested_user_id == process.env.TRADEDESK_USER_ID) {
                    // console.log("INSIDE BOTH IF")
                    cryptorequestedbalance = a.balance - ((inputs.quantity));
                    cryptorequestedbalance = parseFloat(cryptorequestedbalance).toFixed(8);
                    cryptorequestedplacedbalance = a.balance - ((inputs.quantity));
                    cryptorequestedplacedbalance = parseFloat(cryptorequestedplacedbalance).toFixed(8)
                    var a = await Wallet
                        .query()
                        .where('id', cryptoWalletRequested.id)
                        .update({
                            balance: cryptorequestedbalance,
                            placed_balance: cryptorequestedplacedbalance
                        });
                } else {
                    // console.log("INSIDE IF ELSE");
                    cryptorequestedbalance = a.balance - ((inputs.quantity));
                    cryptorequestedbalance = parseFloat(cryptorequestedbalance.toFixed(8));
                    var a = await Wallet
                        .query()
                        .where('id', cryptoWalletRequested.id)
                        .update({
                            balance: cryptorequestedbalance
                        });
                }
            } else {
                if (requested_user_id == process.env.TRADEDESK_USER_ID) {
                    cryptorequestedbalance = cryptoWalletRequested.balance - ((inputs.quantity));
                    cryptorequestedbalance = parseFloat(cryptorequestedbalance).toFixed(8);
                    cryptorequestedplacedbalance = cryptoWalletRequested.placed_balance - ((inputs.quantity));
                    cryptorequestedplacedbalance = parseFloat(cryptorequestedplacedbalance).toFixed(8);
                    var a = await Wallet
                        .query()
                        .where('id', cryptoWalletRequested.id)
                        .update({
                            balance: cryptorequestedbalance,
                            placed_balance: cryptorequestedplacedbalance
                        });
                } else {
                    cryptorequestedbalance = cryptoWalletRequested.balance - ((inputs.quantity));
                    cryptorequestedbalance = parseFloat(cryptorequestedbalance.toFixed(8));
                    var a = await Wallet
                        .query()
                        .where('id', cryptoWalletRequested.id)
                        .update({
                            balance: cryptorequestedbalance
                        });
                }
            }

            // -----------------------currency-------------------------------------- //
            var currencyuserbalance = currencyWalletUser.balance - (((inputs.quantity) * inputs.fill_price));
            var currencyuserbalance = parseFloat(currencyuserbalance.toFixed(8))
            var currencyuserplacedbalance = currencyWalletUser.placed_balance - (((inputs.quantity) * (inputs.fill_price)));
            var currencyuserplacedbalance = parseFloat(currencyuserplacedbalance.toFixed(8))

            var updateSql = await Wallet.knex().raw(`UPDATE wallets
                                                        SET balance = ${currencyuserbalance}, placed_balance = ${currencyuserplacedbalance}
                                                        WHERE id = ${currencyWalletUser.id}
                                                        RETURNING *`)
            var b = updateSql.rows[0]
            var currencyrequestedbalance;
            var currencyrequestedplacedbalance
            if (user_id == requested_user_id) {
                currencyrequestedbalance = b.balance + (((inputs.quantity) * inputs.fill_price) - ((inputs.quantity) * inputs.fill_price * (inputs.makerFee / 100)));
                currencyrequestedbalance = parseFloat(currencyrequestedbalance.toFixed(8));
                currencyrequestedplacedbalance = b.placed_balance + (((inputs.quantity) * inputs.fill_price) - ((inputs.quantity) * inputs.fill_price * (inputs.makerFee / 100)));
                currencyrequestedplacedbalance = parseFloat(currencyrequestedplacedbalance.toFixed(8));
            } else {
                currencyrequestedbalance = currencyWalletRequested.balance + (((inputs.quantity) * inputs.fill_price) - ((inputs.quantity) * inputs.fill_price * (inputs.makerFee / 100)));
                currencyrequestedbalance = parseFloat(currencyrequestedbalance.toFixed(8));
                currencyrequestedplacedbalance = currencyWalletRequested.placed_balance + (((inputs.quantity) * inputs.fill_price) - ((inputs.quantity) * inputs.fill_price * (inputs.makerFee / 100)));
                currencyrequestedplacedbalance = parseFloat(currencyrequestedplacedbalance.toFixed(8));
            }

            var b = await Wallet
                .query()
                .where('id', currencyWalletRequested.id)
                .update({
                    balance: currencyrequestedbalance,
                    placed_balance: currencyrequestedplacedbalance
                });

            var requestedFee = ((inputs.quantity) * inputs.fill_price * (inputs.makerFee / 100));
            var userFee = ((inputs.quantity) * (inputs.takerFee / 100));

            // console.log("requestedFee", requestedFee);
            // console.log("userFee", userFee);

            // console.log("adminWalletCrypto.balance", adminWalletCrypto.balance)

            var adminBalance = adminWalletCrypto.balance + userFee
            var adminPlacedBalance = adminWalletCrypto.placed_balance + userFee

            if (adminWalletCrypto != undefined) {
                var adminWalletCrypto = await Wallet
                    .query()
                    .first()
                    .select()
                    .where('deleted_at', null)
                    .andWhere('is_active', true)
                    .andWhere('coin_id', crypto_coin_id)
                    .andWhere('user_id', 36)
                    .patch({
                        balance: adminBalance,
                        placed_balance: adminPlacedBalance
                    })
            }

            var adminCurrencyBalance = adminWalletCurrency.balance + requestedFee;
            var adminCurrencyPlacedBalance = adminWalletCurrency.placed_balance + requestedFee

            if (adminWalletCrypto != undefined) {
                var adminWalletCrypto = await Wallet
                    .query()
                    .first()
                    .select()
                    .where('deleted_at', null)
                    .andWhere('is_active', true)
                    .andWhere('coin_id', currency_coin_id)
                    .andWhere('user_id', 36)
                    .patch({
                        balance: adminCurrencyBalance,
                        placed_balance: adminCurrencyPlacedBalance
                    })
            }

            user_usd = ((inputs.quantity) * inputs.fill_price) * (resultData);

        } else if (inputs.side == "Sell") {
            // --------------------------------------crypto--------------------------- //
            // console.log("cryptoWalletRequested", cryptoWalletRequested);
            // console.log("cryptoWalletUser", cryptoWalletUser)
            // console.log("cryptoWalletUser.balance", cryptoWalletUser.balance);
            // console.log("cryptoWalletUser.placed_balance", cryptoWalletUser.placed_balance)
            var cryptouserbalance = parseFloat(cryptoWalletUser.balance).toFixed(8) - parseFloat((inputs.quantity)).toFixed(8);
            var cryptouserbalance = parseFloat(cryptouserbalance.toFixed(8))
            var cryptouserPlacedbalance = parseFloat(cryptoWalletUser.placed_balance).toFixed(8) - parseFloat(inputs.quantity).toFixed(8);
            var cryptouserPlacedbalance = parseFloat(cryptouserPlacedbalance.toFixed(8))

            var updateSql = await Wallet.knex().raw(`UPDATE wallets
                                                        SET balance = ${cryptouserbalance}, placed_balance = ${cryptouserPlacedbalance}
                                                        WHERE id = ${cryptoWalletUser.id}
                                                        RETURNING *`)
            var a = updateSql.rows[0]
            var cryptorequestedbalance;
            var cryptorequestedplacedbalance
            // console.log("cryptoWalletRequested.balance", cryptoWalletRequested.balance);
            // console.log("cryptoWalletRequested.placed_balance", cryptoWalletRequested.placed_balance)
            // console.log("inputs.makerFee", inputs.makerFee)
            if (user_id == requested_user_id) {
                cryptorequestedbalance = parseFloat(a.balance) + parseFloat(inputs.quantity) - ((inputs.quantity) * (inputs.makerFee / 100));
                cryptorequestedbalance = parseFloat(cryptorequestedbalance).toFixed(8)
                cryptorequestedplacedbalance = parseFloat(a.placed_balance) + parseFloat(inputs.quantity) - ((inputs.quantity) * (inputs.makerFee / 100));
                cryptorequestedplacedbalance = parseFloat(cryptorequestedplacedbalance).toFixed(8)

            } else {
                cryptorequestedbalance = parseFloat(cryptoWalletRequested.balance) + parseFloat(inputs.quantity) - ((inputs.quantity) * (inputs.makerFee / 100));
                cryptorequestedbalance = parseFloat(cryptorequestedbalance).toFixed(8)
                cryptorequestedplacedbalance = parseFloat(cryptoWalletRequested.placed_balance) + parseFloat(inputs.quantity) - ((inputs.quantity) * (inputs.makerFee / 100));
                cryptorequestedplacedbalance = parseFloat(cryptorequestedplacedbalance).toFixed(8)
            }


            var a = await Wallet
                .query()
                .where('id', cryptoWalletRequested.id)
                .update({
                    balance: cryptorequestedbalance,
                    placed_balance: cryptorequestedplacedbalance
                });

            // -------------------------- currency ---------------------------- //

            var currencyuserbalance = (currencyWalletUser.balance) + parseFloat((inputs.quantity) * (inputs.fill_price)) - ((((inputs.quantity) * (inputs.fill_price)) * (inputs.takerFee / 100)));
            var currencyuserbalance = parseFloat(currencyuserbalance).toFixed(8)
            var currencyuserplacedbalance = (currencyWalletUser.placed_balance) + parseFloat((inputs.quantity) * (inputs.fill_price)) - ((((inputs.quantity) * (inputs.fill_price)) * (inputs.takerFee / 100)));
            var currencyuserplacedbalance = parseFloat(currencyuserplacedbalance).toFixed(8)

            var b = await Wallet
                .query()
                .where('id', currencyWalletUser.id)
                .update({
                    balance: currencyuserbalance,
                    placed_balance: currencyuserplacedbalance
                });

            var updateSql = await Wallet.knex().raw(`UPDATE wallets
                                                        SET balance = ${currencyuserbalance}, placed_balance = ${currencyuserplacedbalance}
                                                        WHERE id = ${currencyWalletUser.id}
                                                        RETURNING *`)
            var b = updateSql.rows[0]
            var currencyrequestedbalance;
            var currencyrequestedplacedbalance;
            if (user_id == requested_user_id) {
                if (requested_user_id == process.env.TRADEDESK_USER_ID) {
                    currencyrequestedbalance = b.balance - ((((inputs.quantity) * (inputs.fill_price))));
                    currencyrequestedbalance = parseFloat(currencyrequestedbalance).toFixed(8)
                    currencyrequestedplacedbalance = b.placed_balance - ((((inputs.quantity) * (inputs.fill_price))));
                    currencyrequestedplacedbalance = parseFloat(currencyrequestedplacedbalance).toFixed(8)
                    var b = await Wallet
                        .query()
                        .where('id', currencyWalletRequested.id)
                        .update({
                            balance: currencyrequestedbalance,
                            placed_balance: currencyrequestedplacedbalance
                        });
                } else {
                    currencyrequestedbalance = b.balance - ((((inputs.quantity) * (inputs.fill_price))));
                    currencyrequestedbalance = parseFloat(currencyrequestedbalance).toFixed(8)
                    var b = await Wallet
                        .query()
                        .where('id', currencyWalletRequested.id)
                        .update({
                            balance: currencyrequestedbalance
                        });
                }
            } else {
                if (requested_user_id == process.env.TRADEDESK_USER_ID) {
                    currencyrequestedbalance = currencyWalletRequested.balance - ((((inputs.quantity) * (inputs.fill_price))));
                    currencyrequestedbalance = parseFloat(currencyrequestedbalance).toFixed(8);
                    currencyrequestedplacedbalance = currencyWalletRequested.placed_balance - ((((inputs.quantity) * (inputs.fill_price))));
                    currencyrequestedplacedbalance = parseFloat(currencyrequestedplacedbalance).toFixed(8)
                    var b = await Wallet
                        .query()
                        .where('id', currencyWalletRequested.id)
                        .update({
                            balance: currencyrequestedbalance,
                            placed_balance: currencyrequestedplacedbalance
                        });
                } else {
                    currencyrequestedbalance = currencyWalletRequested.balance - ((((inputs.quantity) * (inputs.fill_price))));
                    currencyrequestedbalance = parseFloat(currencyrequestedbalance).toFixed(8)
                    var b = await Wallet
                        .query()
                        .where('id', currencyWalletRequested.id)
                        .update({
                            balance: currencyrequestedbalance
                        });
                }
            }


            var requestedFee = (((inputs.quantity)) * ((inputs.makerFee / 100)).toFixed(8))
            var userFee = ((((inputs.quantity) * inputs.fill_price) * ((inputs.takerFee / 100)))).toFixed(8);

            // console.log("adminWalletCrypto", adminWalletCrypto)
            var adminBalance = parseFloat(adminWalletCrypto.balance) + parseFloat(requestedFee)
            var adminPlacedBalance = parseFloat(adminWalletCrypto.placed_balance) + parseFloat(requestedFee)

            if (adminWalletCrypto != undefined) {
                var adminWalletCrypto = await Wallet
                    .query()
                    .first()
                    .select()
                    .where('deleted_at', null)
                    .andWhere('is_active', true)
                    .andWhere('coin_id', crypto_coin_id)
                    .andWhere('user_id', 36)
                    .patch({
                        balance: adminBalance,
                        placed_balance: adminPlacedBalance
                    })
            }

            var adminCurrencyBalance = parseFloat(adminWalletCurrency.balance) + parseFloat(userFee);
            var adminCurrencyPlacedBalance = parseFloat(adminWalletCurrency.placed_balance) + parseFloat(userFee)

            if (adminWalletCrypto != undefined) {
                var adminWalletCrypto = await Wallet
                    .query()
                    .first()
                    .select()
                    .where('deleted_at', null)
                    .andWhere('is_active', true)
                    .andWhere('coin_id', currency_coin_id)
                    .andWhere('user_id', 36)
                    .patch({
                        balance: adminCurrencyBalance,
                        placed_balance: adminCurrencyPlacedBalance
                    })
            }

            user_usd = ((inputs.quantity) * inputs.fill_price) * (resultData);
        }

        return ({
            'userFee': userFee,
            'requestedFee': requestedFee,
            "maker_fee": inputs.makerFee,
            "taker_fee": inputs.takerFee
        })
    } catch (err) {
        // console.log("fees Error", JSON.stringify(err));
        return (1);
    }
}

module.exports = {
    getTraddingFees
}