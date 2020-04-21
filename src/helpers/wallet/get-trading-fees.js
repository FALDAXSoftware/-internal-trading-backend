/*
Used to get Tradding Fees
*/
var CurrencyConversionModel = require("../../models/CurrencyConversion");
var CoinsModel = require("../../models/Coins");
var moment = require('moment')
var TradeHistoryModel = require("../../models/TradeHistory");
var Fees = require("../../models/Fees");
var Wallet = require("../../models/Wallet");

var getTraddingFees = async (inputs, maker_fees, taker_fees) => {
    var makerTakerFees = {};
    try {
        var request = inputs;
        var user_id = parseInt(inputs.user_id);
        var requested_user_id = parseInt(inputs.requested_user_id);
        inputs.makerFee = 0.21

        // Fetching currency data value
        var currencyData = await CoinsModel
            .query()
            .first()
            .select()
            .where('is_active', true)
            .andWhere('deleted_at', null)
            .andWhere('coin', request.currency);

        // Fetching cryptocurrency data value
        var cryptoData = await CoinsModel
            .query()
            .first()
            .select()
            .where('is_active', true)
            .andWhere('deleted_at', null)
            .andWhere('coin', request.settle_currency);

        var now = moment().format();
        var resultData;
        var yesterday = moment(now)
            .subtract(1, 'months')
            .format();

        //Maker and Taker fee according to trades executed by user
        var getCurrencyPriceData = await CurrencyConversionModel.query()
            .first()
            .select()
            .where('coin_id', currencyData.id)
            .andWhere('deleted_at', null);

        var getCryptoPriceData = await CurrencyConversionModel.query()
            .first()
            .select()
            .where('coin_id', cryptoData.id)
            .andWhere('deleted_at', null);

        var currencyAmount = await TradeHistoryModel
            .query()
            .sum('quantity')
            .where(function () {
                this.where("user_id", user_id)
                    .orWhere("requested_user_id", user_id)
            })
            .andWhere('deleted_at', null)
            .andWhere('created_at', '>=', yesterday)
            .andWhere('created_at', '<=', now);

        var cryptoAmount = await TradeHistoryModel
            .query()
            .sum('quantity')
            .where(function () {
                this.where("user_id", requested_user_id)
                    .orWhere("requested_user_id", requested_user_id)
            })
            .andWhere('deleted_at', null)
            .andWhere('created_at', '>=', yesterday)
            .andWhere('created_at', '<=', now);

        var totalCurrencyAmount = currencyAmount[0].sum * (getCurrencyPriceData.quote.USD.price);
        var totalCryptoAmount = cryptoAmount[0].sum * (getCryptoPriceData.quote.USD.price);

        var currencyMakerFee = await Fees
            .query()
            .first()
            .select('maker_fee', 'taker_fee')
            .where('deleted_at', null)
            .andWhere('min_trade_volume', '<=', parseFloat(totalCurrencyAmount))
            .andWhere('max_trade_volume', '>=', parseFloat(totalCurrencyAmount));

        var cryptoTakerFee = await Fees
            .query()
            .first()
            .select('maker_fee', 'taker_fee')
            .where('deleted_at', null)
            .andWhere('min_trade_volume', '<=', parseFloat(totalCryptoAmount))
            .andWhere('max_trade_volume', '>=', parseFloat(totalCryptoAmount));


        // Just Replace inputs.makerFee and inputs.takerFee with following
        inputs.makerFee = cryptoTakerFee.maker_fee
        inputs.takerFee = currencyMakerFee.taker_fee

        var user_usd;
        var currencyWalletUser = await Wallet
            .query()
            .first()
            .select()
            .where('deleted_at', null)
            .andWhere('is_active', true)
            .andWhere('coin_id', currencyData.id)
            .andWhere('user_id', inputs.user_id);

        var cryptoWalletRequested = await Wallet
            .query()
            .first()
            .select()
            .where('deleted_at', null)
            .andWhere('is_active', true)
            .andWhere('coin_id', cryptoData.id)
            .andWhere('user_id', inputs.requested_user_id);

        var currencyWalletRequested = await Wallet
            .query()
            .first()
            .select()
            .where('deleted_at', null)
            .andWhere('is_active', true)
            .andWhere('coin_id', currencyData.id)
            .andWhere('user_id', inputs.requested_user_id);
        console.log("cryptoData.id",cryptoData.id);
        console.log("user_id",user_id);
        var cryptoWalletUser = await Wallet
            .query()
            .first()
            .select()
            .where('deleted_at', null)
            .andWhere('is_active', true)
            .andWhere('coin_id', cryptoData.id)
            .andWhere('user_id', inputs.user_id);
        console.log("cryptoWalletUser",cryptoWalletUser);
        var adminWalletCrypto = await Wallet
            .query()
            .first()
            .select()
            .where('deleted_at', null)
            .andWhere('is_active', true)
            .andWhere('coin_id', cryptoData.id)
            .andWhere('user_id', 36);

        var adminWalletCurrency = await Wallet
            .query()
            .first()
            .select()
            .where('deleted_at', null)
            .andWhere('is_active', true)
            .andWhere('coin_id', currencyData.id)
            .andWhere('user_id', 36);

        // inputs.makerFee = 0.21
        // Calculating fees value on basis of the side and order executed
        if (inputs.side == "Buy") {

            // ---------------------------crypto-------------------------------------- //
            var cryptouserbalance = cryptoWalletUser.balance + ((inputs.quantity) - ((inputs.quantity * inputs.takerFee / 100)));
            var cryptouserbalance = parseFloat(cryptouserbalance.toFixed(8));
            console.log("cryptouserbalance", cryptouserbalance)
            console.log("(inputs.quantity * inputs.takerFee / 100))", (inputs.quantity * inputs.takerFee / 100))
            var cryptouserPlacedbalance = cryptoWalletUser.placed_balance + ((inputs.quantity) - ((inputs.quantity * inputs.takerFee / 100)));
            var cryptouserPlacedbalance = parseFloat(cryptouserPlacedbalance.toFixed(8));
            console.log(cryptouserPlacedbalance)

            var a = await Wallet
                .query()
                .where('id', cryptoWalletUser.id)
                .update({
                    balance: cryptouserbalance,
                    placed_balance: cryptouserPlacedbalance
                });

            var cryptorequestedbalance = cryptoWalletRequested.balance - ((inputs.quantity));
            var cryptorequestedbalance = parseFloat(cryptorequestedbalance.toFixed(8));

            var a = await Wallet
                .query()
                .where('id', cryptoWalletRequested.id)
                .update({
                    balance: cryptorequestedbalance
                });
            // -----------------------currency-------------------------------------- //
            var currencyuserbalance = currencyWalletUser.balance - (((inputs.quantity) * inputs.fill_price));
            var currencyuserbalance = parseFloat(currencyuserbalance.toFixed(8))
            console.log("currencyuserbalance"), currencyuserbalance
            var currencyuserplacedbalance = currencyWalletUser.placed_balance - (((inputs.quantity) * (inputs.fill_price)));
            var currencyuserplacedbalance = parseFloat(currencyuserplacedbalance.toFixed(8))
            console.log("currencyuserplacedbalance", currencyuserplacedbalance)

            var b = await Wallet
                .query()
                .where('id', currencyWalletUser.id)
                .update({
                    balance: currencyuserbalance,
                    placed_balance: currencyuserplacedbalance
                });

            var currencyrequestedbalance = currencyWalletRequested.balance + (((inputs.quantity) * inputs.fill_price) - ((inputs.quantity) * inputs.fill_price * (inputs.makerFee / 100)));
            var currencyrequestedbalance = parseFloat(currencyrequestedbalance.toFixed(8));
            console.log(" ((inputs.quantity) * inputs.fill_price * (inputs.makerFee / 100))", ((inputs.quantity) * inputs.fill_price * (inputs.makerFee / 100)))
            console.log("currencyrequestedbalance"), currencyrequestedbalance
            var currencyrequestedplacedbalance = currencyWalletRequested.placed_balance + (((inputs.quantity) * inputs.fill_price) - ((inputs.quantity) * inputs.fill_price * (inputs.makerFee / 100)));
            var currencyrequestedplacedbalance = parseFloat(currencyrequestedplacedbalance.toFixed(8));
            console.log("currencyrequestedplacedbalance", currencyrequestedplacedbalance)

            var b = await Wallet
                .query()
                .where('id', currencyWalletRequested.id)
                .update({
                    balance: currencyrequestedbalance,
                    placed_balance: currencyrequestedplacedbalance
                });

            var requestedFee = ((inputs.quantity) * inputs.fill_price * (inputs.makerFee / 100));
            var userFee = ((inputs.quantity) * inputs.takerFee / 100);

            var adminBalance = adminWalletCrypto.balance + userFee
            var adminPlacedBalance = adminWalletCrypto.placed_balance + userFee

            if (adminWalletCrypto != undefined) {
                var adminWalletCrypto = await Wallet
                    .query()
                    .first()
                    .select()
                    .where('deleted_at', null)
                    .andWhere('is_active', true)
                    .andWhere('coin_id', cryptoData.id)
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
                    .andWhere('coin_id', currencyData.id)
                    .andWhere('user_id', 36)
                    .patch({
                        balance: adminCurrencyBalance,
                        placed_balance: adminCurrencyPlacedBalance
                    })
            }

            user_usd = ((inputs.quantity) * inputs.fill_price) * (resultData);

        } else if (inputs.side == "Sell") {
            console.log("cryptoWalletUser", cryptoWalletUser)
            console.log("cryptoWalletRequested", cryptoWalletRequested)
            console.log("currencyWalletUser", currencyWalletUser)
            console.log("currencyWalletRequested", currencyWalletRequested)
            // --------------------------------------crypto--------------------------- //
            var cryptouserbalance = parseFloat(cryptoWalletUser.balance).toFixed(8) - parseFloat((inputs.quantity)).toFixed(8);
            var cryptouserbalance = parseFloat(cryptouserbalance.toFixed(8))
            console.log("cryptouserbalance", cryptouserbalance)
            var cryptouserPlacedbalance = parseFloat(cryptoWalletUser.placed_balance).toFixed(8) - parseFloat(inputs.quantity).toFixed(8);
            var cryptouserPlacedbalance = parseFloat(cryptouserPlacedbalance.toFixed(8))

            var a = await Wallet
                .query()
                .where('id', cryptoWalletUser.id)
                .update({
                    balance: cryptouserbalance,
                    placed_balance: cryptouserPlacedbalance
                });
            console.log("cryptoWalletRequested.balance", cryptoWalletRequested.balance)
            var cryptorequestedbalance = parseFloat(cryptoWalletRequested.balance) + parseFloat(inputs.quantity) - ((inputs.quantity) * (inputs.makerFee / 100));
            var cryptorequestedbalance = parseFloat(cryptorequestedbalance).toFixed(8)
            console.log("cryptorequestedbalance", cryptorequestedbalance)
            console.log("(inputs.makerFee / 100)", (inputs.makerFee / 100))
            console.log("(inputs.quantity)", (inputs.quantity))
            console.log("(inputs.quantity) - ((inputs.quantity) * (inputs.makerFee / 100))", (inputs.quantity) - ((inputs.quantity) * (inputs.makerFee / 100)))
            var cryptorequestedplacedbalance = parseFloat(cryptoWalletRequested.placed_balance) + parseFloat(inputs.quantity) - ((inputs.quantity) * (inputs.makerFee / 100));
            var cryptorequestedplacedbalance = parseFloat(cryptorequestedplacedbalance).toFixed(8)
            console.log("cryptorequestedplacedbalance", cryptorequestedplacedbalance)


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
            console.log("currencyuserbalance", currencyuserbalance)
            console.log("(inputs.takerFee / 100)", (inputs.takerFee / 100))
            console.log("(inputs.quantity) * (inputs.fill_price) - (((inputs.quantity) * (inputs.fill_price) * (inputs.takerFee / 100)))", (inputs.quantity) * (inputs.fill_price) - (((inputs.quantity) * (inputs.fill_price) * (inputs.takerFee / 100))))
            var currencyuserplacedbalance = (currencyWalletUser.placed_balance) + parseFloat((inputs.quantity) * (inputs.fill_price)) - ((((inputs.quantity) * (inputs.fill_price)) * (inputs.takerFee / 100)));
            var currencyuserplacedbalance = parseFloat(currencyuserplacedbalance).toFixed(8)
            console.log("currencyuserplacedbalance", currencyuserplacedbalance)
            console.log("parseFloat((inputs.quantity) * (inputs.fill_price)) - ((((inputs.quantity) * (inputs.fill_price)) * (inputs.takerFee / 100)))", parseFloat((inputs.quantity) * (inputs.fill_price)) - ((((inputs.quantity) * (inputs.fill_price)) * (inputs.takerFee / 100))))

            var b = await Wallet
                .query()
                .where('id', currencyWalletUser.id)
                .update({
                    balance: currencyuserbalance,
                    placed_balance: currencyuserplacedbalance
                });
            var currencyrequestedbalance = currencyWalletRequested.balance - ((((inputs.quantity) * (inputs.fill_price))));
            var currencyrequestedbalance = parseFloat(currencyrequestedbalance).toFixed(8)
            console.log("currencyrequestedbalance", currencyrequestedbalance)

            var b = await Wallet
                .query()
                .where('id', currencyWalletRequested.id)
                .update({
                    balance: currencyrequestedbalance
                });
            var requestedFee = (((inputs.quantity)) * ((inputs.makerFee / 100)).toFixed(8))
            var userFee = ((((inputs.quantity) * inputs.fill_price) * ((inputs.takerFee / 100)))).toFixed(8);

            var adminBalance = parseFloat(adminWalletCrypto.balance) + parseFloat(requestedFee)
            var adminPlacedBalance = parseFloat(adminWalletCrypto.placed_balance) + parseFloat(requestedFee)

            if (adminWalletCrypto != undefined) {
                var adminWalletCrypto = await Wallet
                    .query()
                    .first()
                    .select()
                    .where('deleted_at', null)
                    .andWhere('is_active', true)
                    .andWhere('coin_id', cryptoData.id)
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
                    .andWhere('coin_id', currencyData.id)
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
            'requestedFee': requestedFee
        })
    } catch (err) {
        console.log("fees Error", err);
        return (1);
    }
}

module.exports = {
    getTraddingFees
}