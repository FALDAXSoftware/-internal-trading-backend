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
var Fees = require("../../models/Fees");

var getUserWalletBalance = async (user_id, currency, crypto) => {
    var userWalletBalance;
    var coinId = await CoinsModel
        .query()
        .first()
        .select()
        .where('coin', currency)
        .andWhere('deleted_at', null);

    var coinWalletSql = `SELECT coins.coin, coins.is_active , wallets.balance, coins.id,
                            wallets.placed_balance, wallets.receive_address
                            FROM coins
                            LEFT JOIN wallets
                            ON coins.id = wallets.coin_id
                            WHERE coins.deleted_at IS NULL AND wallets.user_id = ${user_id}
                            AND wallets.deleted_at IS NULL
                            AND (coins.coin = '${currency}' OR coins.coin = '${crypto}');`

    var walletStatusBalance = await WalletsModel.knex().raw(coinWalletSql);

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

    let conversionSQL = `SELECT currency_conversion.quote, currency_conversion.symbol, currency_conversion.coin_id
                            FROM currency_conversion
                            WHERE currency_conversion.deleted_at IS NULL`

    let conversionData = await CurrencyConversionModel.knex().raw(conversionSQL)

    let userTradeHistorySum = {}
    if (user_id != process.env.TRADEDESK_USER_ID) {
        let userTradesum = await TradeHistoryModel.knex().raw(`SELECT (a1.sum+a2.sum) as total, a1.sum as user_sum, a2.sum as requested_sum , a1.user_coin ,a2.requested_coin
                                                                    FROM(SELECT user_coin, sum(quantity) FROM trade_history
                                                                    WHERE user_id = ${user_id} AND created_at >= '${yesterday}' AND created_at <= '${now}' GROUP BY user_coin) a1
                                                                    FULL JOIN (SELECT requested_coin, sum(quantity) FROM trade_history
                                                                    WHERE requested_user_id = ${user_id} AND created_at >= '${yesterday}' AND created_at <= '${now}' GROUP BY requested_coin) as a2
                                                                    ON a1.user_coin = a2.requested_coin`)

        for (let index = 0; index < userTradesum.rows.length; index++) {
            const element = userTradesum.rows[index];
            userTradeHistorySum[element.user_coin ? element.user_coin : element.requested_coin] = element.total ? element.total : (element.user_sum ? element.user_sum : element.requested_sum)
        }
    }

    let userTotalUSDSum = 0
    for (let index = 0; index < conversionData.rows.length; index++) {
        const element = conversionData.rows[index];
        if (user_id != process.env.TRADEDESK_USER_ID) {
            if (userTradeHistorySum[element.symbol]) {
                userTotalUSDSum += (userTradeHistorySum[element.symbol] * element.quote.USD.price)
            }
        } else {
            userTotalUSDSum = 0.0
        }
    }

    var totalCurrencyAmount = userTotalUSDSum;

    var currencyMakerFee = await Fees
        .query()
        .first()
        .select('maker_fee', 'taker_fee')
        .where('deleted_at', null)
        .andWhere('min_trade_volume', '<=', parseFloat(totalCurrencyAmount))
        .andWhere('max_trade_volume', '>=', parseFloat(totalCurrencyAmount));
    var takerFee = currencyMakerFee.taker_fee

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
    var buyEstimatedFee = sellBookValue - (sellBookValue * (takerFee / 100));
    var sellEstimatedFee = buyBookValue - (buyBookValue * (takerFee / 100));

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
        'fees': takerFee,
        'cryptoFiat': cryptoUsdValue,
        "currencyFiat": currencyUsdValue
    };
    return userWalletBalance;
}

module.exports = {
    getUserWalletBalance
}