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
    // var coin1 = await CoinsModel
    //     .query()
    //     .first()
    //     .select("id")
    //     .where('is_active', true)
    //     .andWhere('deleted_at', null)
    //     .andWhere('coin', crypto);

    try {
        var request = inputs;
        var user_id = parseInt(inputs.user_id);
        var requested_user_id = parseInt(inputs.requested_user_id);

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

        // Fetching Amount of trade done on the basis of time and usd value
        // var currencyAmount = await TradeHistory
        //     .sum('quantity')
        //     .where({
        //         or: [{
        //             user_id: user_id,
        //         },
        //         {
        //             requested_user_id: user_id
        //         }
        //         ],
        //         deleted_at: null,
        //         created_at: {
        //             ">=": yesterday
        //         },
        //         created_at: {
        //             "<=": now
        //         }
        //     });
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
        // Fetching Amount of trade done on the basis of time and usd value
        // var cryptoAmount = await TradeHistory
        //     .sum('quantity')
        //     .where({
        //         or: [{
        //             user_id: requested_user_id,
        //         },
        //         {
        //             requested_user_id: requested_user_id
        //         }
        //         ],
        //         deleted_at: null,
        //         created_at: {
        //             ">=": yesterday
        //         },
        //         created_at: {
        //             "<=": now
        //         }
        //     });
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

        // Fetching the fees on the basis of the total trade done in last 30 days
        // var currencyMakerFee = await Fees.findOne({
        //     select: [
        //         'maker_fee',
        //         'taker_fee'
        //     ],
        //     where: {
        //         deleted_at: null,
        //         min_trade_volume: {
        //             '<=': parseFloat(totalCurrencyAmount)
        //         },
        //         max_trade_volume: {
        //             '>=': parseFloat(totalCurrencyAmount)
        //         }
        //     }
        // });
        var currencyMakerFee = await Fees
            .query()
            .first()
            .select('maker_fee', 'taker_fee')
            .where('deleted_at', null)
            .andWhere('min_trade_volume', '<=', parseFloat(totalCurrencyAmount))
            .andWhere('max_trade_volume', '>=', parseFloat(totalCurrencyAmount));

        // Fetching the fees on the basis of the total trade done in last 30 days
        // var cryptoTakerFee = await Fees.findOne({
        //     select: [
        //         'maker_fee',
        //         'taker_fee'
        //     ],
        //     where: {
        //         deleted_at: null,
        //         min_trade_volume: {
        //             '<=': parseFloat(totalCryptoAmount)
        //         },
        //         max_trade_volume: {
        //             '>=': parseFloat(totalCryptoAmount)
        //         }
        //     }
        // });

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

        var cryptoWalletUser = await Wallet
            .query()
            .first()
            .select()
            .where('deleted_at', null)
            .andWhere('is_active', true)
            .andWhere('coin_id', cryptoData.id)
            .andWhere('user_id', inputs.user_id);
        // Calculating fees value on basis of the side and order executed
        if (inputs.side == "Buy") {

            // ---------------------------crypto-------------------------------------- //
            var cryptouserbalance = cryptoWalletUser.balance + ((inputs.quantity) - ((inputs.quantity * inputs.takerFee / 100)));
            var cryptouserbalance = parseFloat(cryptouserbalance.toFixed(8));
            var cryptouserPlacedbalance = cryptoWalletUser.placed_balance + ((inputs.quantity) - ((inputs.quantity * inputs.takerFee / 100)));
            var cryptouserPlacedbalance = parseFloat(cryptouserPlacedbalance.toFixed(8));

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
            var currencyuserplacedbalance = currencyWalletUser.placed_balance - (((inputs.quantity) * (inputs.fill_price)));
            var currencyuserplacedbalance = parseFloat(currencyuserplacedbalance.toFixed(8))

            var b = await Wallet
                .query()
                .where('id', currencyWalletUser.id)
                .update({
                    balance: currencyuserbalance,
                    placed_balance: currencyuserplacedbalance
                });

            var currencyrequestedbalance = currencyWalletRequested.balance + (((inputs.quantity) * inputs.fill_price) - ((inputs.quantity) * inputs.fill_price * (inputs.makerFee / 100)));
            var currencyrequestedbalance = parseFloat(currencyrequestedbalance.toFixed(8));
            var currencyrequestedplacedbalance = currencyWalletRequested.placed_balance + (((inputs.quantity) * inputs.fill_price) - ((inputs.quantity) * inputs.fill_price * (inputs.makerFee / 100)));
            var currencyrequestedplacedbalance = parseFloat(currencyrequestedplacedbalance.toFixed(8));

            var b = await Wallet
                .query()
                .where('id', currencyWalletRequested.id)
                .update({
                    balance: currencyrequestedbalance,
                    placed_balance: currencyrequestedplacedbalance
                });

            var requestedFee = ((inputs.quantity) * inputs.fill_price * (inputs.makerFee / 100));
            var userFee = ((inputs.quantity) * inputs.takerFee / 100);

            user_usd = ((inputs.quantity) * inputs.fill_price) * (resultData);

        } else if (inputs.side == "Sell") {

            // --------------------------------------crypto--------------------------- //
            var cryptouserbalance = cryptoWalletUser.balance - ((inputs.quantity));
            var cryptouserbalance = parseFloat(cryptouserbalance.toFixed(8))
            var cryptouserPlacedbalance = cryptoWalletUser.placed_balance - (((inputs.quantity)));
            var cryptouserPlacedbalance = parseFloat(cryptouserPlacedbalance.toFixed(8))

            var a = await Wallet
                .query()
                .where('id', cryptoWalletUser.id)
                .update({
                    balance: cryptouserbalance,
                    placed_balance: cryptouserPlacedbalance
                });
            var cryptorequestedbalance = cryptoWalletRequested.balance + ((inputs.quantity) - ((inputs.quantity) * (inputs.makerFee / 100)));
            var cryptorequestedbalance = parseFloat(cryptorequestedbalance.toFixed(8))
            var cryptorequestedplacedbalance = cryptoWalletRequested.placed_balance + ((inputs.quantity) - (((inputs.quantity) * (inputs.makerFee / 100))));
            var cryptorequestedplacedbalance = parseFloat(cryptorequestedplacedbalance.toFixed(8))


            var a = await Wallet
                .query()
                .where('id', cryptoWalletRequested.id)
                .update({
                    balance: cryptorequestedbalance,
                    placed_balance: cryptorequestedplacedbalance
                });

            // -------------------------- currency ---------------------------- //

            var currencyuserbalance = currencyWalletUser.balance + ((inputs.quantity) * (inputs.fill_price) - (((inputs.quantity) * (inputs.fill_price) * (inputs.takerFee / 100))));
            var currencyuserbalance = parseFloat(currencyuserbalance.toFixed(8))
            var currencyuserplacedbalance = currencyWalletUser.placed_balance + ((inputs.quantity) * inputs.fill_price - ((inputs.quantity) * inputs.fill_price * (inputs.takerFee / 100)));
            var currencyuserplacedbalance = parseFloat(currencyuserplacedbalance.toFixed(8))

            var b = await Wallet
                .query()
                .where('id', currencyWalletUser.id)
                .update({
                    balance: currencyuserbalance,
                    placed_balance: currencyuserplacedbalance
                });
            var currencyrequestedbalance = currencyWalletRequested.balance - ((((inputs.quantity) * (inputs.fill_price))));
            var currencyrequestedbalance = parseFloat(currencyrequestedbalance.toFixed(8))

            var b = await Wallet
                .query()
                .where('id', currencyWalletRequested.id)
                .update({
                    balance: currencyrequestedbalance
                });
            var requestedFee = (((inputs.quantity)) * ((inputs.makerFee / 100)).toFixed(8))
            var userFee = ((((inputs.quantity) * inputs.fill_price) * ((inputs.takerFee / 100)))).toFixed(8);
            user_usd = ((inputs.quantity) * inputs.fill_price) * (resultData);
        }

        return ({
            'userFee': userFee,
            'requestedFee': requestedFee
        })
    } catch (err) {
        console.log("fees Error", err);
        return exits.serverError();
    }
}

module.exports = {
    getTraddingFees
}