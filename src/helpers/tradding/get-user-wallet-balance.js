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
    console.log("user_id, currency, crypto", user_id, currency, crypto)
    var userWalletBalance;
    var coinId = await CoinsModel
        .query()
        .first()
        .select()
        .where('coin', currency)
        .andWhere('deleted_at', null);

    // var currencyMessage = '';
    // var userWalletCurrencyBalance = 0.0;
    // if (coinId != undefined) {
    //     if (coinId.is_active == false || coinId.is_active == "false") {
    //         currencyMessage = "Coin is Currently inactive"
    //     } else {
    //         userWalletCurrencyBalance = await WalletsModel
    //             .query()
    //             .select()
    //             .where('coin_id', coinId.id)
    //             .andWhere('deleted_at', null)
    //             .andWhere('is_active', true)
    //             .andWhere('user_id', user_id);

    //         if (userWalletCurrencyBalance.length == 0) {
    //             currencyMessage = "Please create wallet for " + currency;
    //         }
    //     }
    // }

    // var cryptoId = await CoinsModel
    //     .query()
    //     .first()
    //     .select()
    //     .where('coin', crypto)
    //     .andWhere('deleted_at', null);

    // var cryptoMessage = '';
    // if (cryptoId != undefined) {
    //     if (cryptoId.is_active == false) {
    //         currencyMessage = "Coin is Inactive"
    //     } else {
    //         var userWalletCryptoBalance = await WalletsModel
    //             .query()
    //             .select()
    //             .where('coin_id', cryptoId.id)
    //             .andWhere('deleted_at', null)
    //             .andWhere('is_active', true)
    //             .andWhere('user_id', user_id);

    //         if (userWalletCryptoBalance.length == 0) {
    //             cryptoMessage = "Please create the wallet for " + crypto;
    //         }
    //     }
    // }

    var coinWalletSql = `SELECT coins.coin, coins.is_active , wallets.balance, coins.id,
                            wallets.placed_balance, wallets.receive_address
                            FROM coins
                            LEFT JOIN wallets
                            ON coins.id = wallets.coin_id
                            WHERE coins.deleted_at IS NULL AND wallets.user_id = ${user_id}
                            AND wallets.deleted_at IS NULL
                            AND (coins.coin = '${currency}' OR coins.coin = '${crypto}');`

    var walletStatusBalance = await WalletsModel.knex().raw(coinWalletSql);
    // walletStatusBalance = walletStatusBalance.rows;
    console.log("walletStatusBalance", walletStatusBalance)

    var currencyMessage = '';
    var userWalletCurrencyBalance = [];
    var cryptoMessage = '';
    var userWalletCryptoBalance = [];

    for (var i = 0; i < walletStatusBalance.rows.length; i++) {
        const element = walletStatusBalance.rows[i];
        if (crypto == element.coin) {
            userWalletCryptoBalance = element
        } else if (currency == element.coin) {
            userWalletCurrencyBalance = element
        }
    }

    if (userWalletCurrencyBalance.length == 0) {
        currencyMessage = "Please create wallet for " + currency;
    }

    if (userWalletCryptoBalance.length == 0) {
        cryptoMessage = "Please create the wallet for " + crypto;
    }

    var user_id = parseInt(user_id);

    var now = moment().format();
    var yesterday = moment(now)
        .subtract(1, 'months')
        .format();

    var qouteSql = `SELECT coins.coin, currency_conversion.quote
                        FROM coins
                        LEFT JOIN currency_conversion
                        ON coins.id = currency_conversion.coin_id
                        WHERE coins.deleted_at IS NULL AND coins.is_active = 'true'
                        AND currency_conversion.deleted_at IS NULL
                        AND (coins.coin = '${currency}' OR coins.coin = '${crypto}');`

    var qouteValue = await CoinsModel.knex().raw(qouteSql);
    var currencyUsdValue;
    var cryptoUsdValue
    for (let index = 0; index < qouteValue.rows.length; index++) {
        const element = qouteValue.rows[index];
        if (element.coin == crypto) {
            cryptoUsdValue = element.quote.USD.price
        } else if (element.coin == currency) {
            currencyUsdValue = element.quote.USD.price
        }
    }


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
    var totalCryptoAmount = currencyAmount[0].sum * (cryptoUsdValue);

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
        'cryptoFiat': cryptoUsdValue,
        "currencyFiat": currencyUsdValue
    };
    return userWalletBalance;
}

module.exports = {
    getUserWalletBalance
}