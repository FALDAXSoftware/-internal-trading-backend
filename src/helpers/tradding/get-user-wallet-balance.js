/*
Get user wallet balance
*/
var moment = require('moment');
var CoinsModel = require("../../models/Coins");
var WalletsModel = require("../../models/Wallet");
var CurrencyConversionModel = require("../../models/CurrencyConversion");
var FeesModel = require("../../models/Fees");
var TradeHistoryModel = require("../../models/TradeHistory");
var SellBookOrderHelper = require("../../helpers/sell/get-sell-book-order");
var BuyBookOrderHelper = require("../../helpers/buy/get-buy-book-order");

var getUserWalletBalance = async (user_id, currency, crypto) => {
    var userWalletBalance;
    var coinId = await CoinsModel
        .query()
        .first()
        .select()
        .where('coin', currency)
        .andWhere('deleted_at', null);

    var currencyMessage = '';
    var userWalletCurrencyBalance = 0.0;
    if (coinId != undefined) {
        if (coinId.is_active == false || coinId.is_active == "false") {
            currencyMessage = "Coin is Currently inactive"
        } else {
            userWalletCurrencyBalance = await WalletsModel
                .query()
                .select()
                .where('coin_id', coinId.id)
                .andWhere('deleted_at', null)
                .andWhere('is_active', true)
                .andWhere('user_id', user_id);

            if (userWalletCurrencyBalance.length == 0) {
                currencyMessage = "Please create wallet for " + currency;
            }
        }
    }

    var cryptoId = await CoinsModel
        .query()
        .first()
        .select()
        .where('coin', crypto)
        .andWhere('deleted_at', null);

    var cryptoMessage = '';
    if (cryptoId != undefined) {
        if (cryptoId.is_active == false) {
            currencyMessage = "Coin is Inactive"
        } else {
            var userWalletCryptoBalance = await WalletsModel
                .query()
                .select()
                .where('coin_id', cryptoId.id)
                .andWhere('deleted_at', null)
                .andWhere('is_active', true)
                .andWhere('user_id', user_id);

            if (userWalletCryptoBalance.length == 0) {
                cryptoMessage = "Please create the wallet for " + crypto;
            }
        }
    }

    var sellBookValue,
        buyBookValue;

    var user_id = parseInt(user_id);
    // Fetching cryptocurrency data value
    var cryptoData = await CoinsModel
        .query()
        .first()
        .select()
        .where('coin', crypto)
        .andWhere('deleted_at', null)
        .andWhere('is_active', true);

    var currencyData = await CoinsModel
        .query()
        .first()
        .select()
        .where('coin', currency)
        .andWhere('deleted_at', null)
        .andWhere('is_active', true);

    var now = moment().format();
    var yesterday = moment(now)
        .subtract(1, 'months')
        .format();

    //Maker and Taker fee according to trades executed by user
    var getCryptoPriceData = await CurrencyConversionModel
        .query()
        .first()
        .select()
        .where('coin_id', cryptoData.id)
        .andWhere('deleted_at', null)
        .andWhere('is_active', true);

    var getCurrencyPriceData = await CurrencyConversionModel
        .query()
        .first()
        .select()
        .where('coin_id', currencyData.id)
        .andWhere('deleted_at', null)
        .andWhere('is_active', true);

    // Fetching Amount of trade done on the basis of time and usd value
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
    console.log("CurrencyAmount", currencyAmount[0].sum)
    var totalCryptoAmount = currencyAmount[0].sum * (getCryptoPriceData.quote.USD.price);

    // Fetching the fees on the basis of the total trade done in last 30 days
    var cryptoTakerFee = await FeesModel
        .query()
        .first()
        .select('maker_fee', 'taker_fee')
        .where('deleted_at', null)
        .andWhere('min_trade_volume', '<=', parseFloat(totalCryptoAmount))
        .andWhere('max_trade_volume', '>=', parseFloat(totalCryptoAmount));

    let sellBook = await SellBookOrderHelper.sellOrderBook(crypto, currency);
    let buyBook = await BuyBookOrderHelper.getBuyBookOrder(crypto, currency);

    if (sellBook.length == 0) {
        sellBookValue = 0;
    } else {
        sellBookValue = sellBook[0].price;
    }
    if (buyBook.length == 0) {
        buyBookValue = 0;
    } else {
        buyBookValue = buyBook[0].price;
    }
    var buyEstimatedFee = sellBookValue - (sellBookValue * (cryptoTakerFee.taker_fee / 100));
    var sellEstimatedFee = buyBookValue - (buyBookValue * (cryptoTakerFee.taker_fee / 100));

    var buyPay = sellBookValue;
    var sellPay = buyBookValue;

    userWalletBalance = {
        'currency': userWalletCurrencyBalance,
        'currency_msg': currencyMessage,
        'crypto': userWalletCryptoBalance,
        'crypto_msg': cryptoMessage,
        'buyEstimatedPrice': buyEstimatedFee,
        'sellEstimatedPrice': sellEstimatedFee,
        'buyPay': buyPay,
        'sellPay': sellPay,
        'fees': cryptoTakerFee.taker_fee,
        'cryptoFiat': getCryptoPriceData.quote.USD.price,
        "currencyFiat": getCurrencyPriceData.quote.USD.price
    };
    return userWalletBalance;
}

module.exports = {
    getUserWalletBalance
}