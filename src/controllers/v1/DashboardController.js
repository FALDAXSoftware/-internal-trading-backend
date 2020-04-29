const { raw } = require('objection');
var express = require('express');
var app = express();
var moment = require('moment');
var i18n = require("i18n");

var { AppController } = require('./AppController');
const constants = require('../../config/constants');
var Helper = require("../../helpers/helpers");
var UserModel = require("../../models/UsersModel");
var WalletModel = require("../../models/Wallet");
var TradeHistoryModel = require("../../models/TradeHistory");
var CurrencyConversionModel = require("../../models/CurrencyConversion");
var CoinsModel = require("../../models/Coins");
var ActivityModel = require("../../models/Activity");
var TempCoinMArketCapModel = require("../../models/TempCoinMarketCap");
const request = require('request');
var BuyAdd = require("../../helpers/buy/add-buy-order");
var socketHelper = require("../../helpers/sockets/emit-trades");
var SellAdd = require("../../helpers/sell/add-sell-order");
var TradeController = require("../../controllers/v1/TradeController");
var Currency = require("../../helpers/currency");
var CurrencyConversionModel = require("../../models/CurrencyConversion");
var PairsModel = require("../../models/Pairs");
var BuyBookModel = require("../../models/BuyBook");
var SellBookModel = require("../../models/SellBook");
var CoinsModel = require("../../models/Coins");
var cancelOldOrder = require("../../helpers/pending/cancel-pending-data")

class DashboardController extends AppController {

    constructor() {
        super();
    }

    async getPortfolioData(req, res) {
        // return new Promise(async (resolve, reject) => {
        try {
            var user_id = await Helper.getUserId(req.headers);
            console.log("user_id", user_id)
            var total = 0;
            var diffrenceValue = 0;
            var user_data = await UserModel
                .query()
                .first()
                .select()
                .where('id', user_id)
                .andWhere('deleted_at', null)
                .andWhere('is_active', true)
                .orderBy('id', 'DESC');

            console.log("user_data", user_data)

            var currency = user_data.fiat;
            var yesterday = moment().subtract(1, 'days');
            var today = moment();
            var portfolioData = [];
            var average_price;

            var coinBalance = await WalletModel
                .query()
                .select('coin_name', 'balance', 'coin', 'coin_code')
                .fullOuterJoin('coins', 'wallets.coin_id', 'coins.id')
                .where('user_id', user_id)
                .andWhere('coins.is_fiat', false)
                .andWhere('wallets.deleted_at', null);

            console.log("coinBalance", coinBalance)

            for (var i = 0; i < coinBalance.length; i++) {
                var total_price = 0;

                var percentChange = 0.0;
                var currentPrice = 0.0;
                var previousPrice = 0.0;

                var currentPriceFiat = await TempCoinMArketCapModel
                    .query()
                    .select()
                    .where('deleted_at', null)
                    .andWhere('coin', coinBalance[i].coin)
                    .andWhere("created_at", "<=", today)
                    .andWhere("created_at", ">=", yesterday)
                    .orderBy('id', 'DESC');

                console.log(currentPriceFiat)

                if (currentPriceFiat.length == 0) {
                    currentPrice = 0;
                } else {
                    currentPrice = currentPriceFiat[0].price;
                }

                average_price = currentPrice

                if (currentPriceFiat.length == 0) {
                    previousPrice = 0;
                } else {
                    previousPrice = currentPriceFiat[currentPriceFiat.length - 1].price;
                }


                var diffrence = currentPrice - previousPrice;
                percentChange = (diffrence / currentPrice) * 100;

                if (percentChange) {
                    percentChange = percentChange;
                } else {
                    percentChange = 0;
                }
                // var percentchange = 0.0
                var priceFiat = currentPriceFiat
                if (priceFiat == undefined) {
                    priceFiat = 0;
                    // percentchange = 0;
                } else {
                    // percentchange = priceFiat.quote.USD.percent_change_24h;
                    priceFiat = priceFiat.price;
                }

                total = total + percentChange;
                diffrenceValue = diffrenceValue + diffrence;
                var portfolio_data = {
                    "name": coinBalance[i].name,
                    "average_price": average_price,
                    "percentchange": percentChange,
                    "Amount": coinBalance[i].balance,
                    'symbol': coinBalance[i].coin_code,
                    "fiatPrice": priceFiat,
                    "name": coinBalance[i].coin_name
                }

                console.log("portfolio_data", portfolio_data)

                portfolioData.push(portfolio_data);

            }
            console.log("portfolioData", portfolioData)
            var changeValue = user_data.diffrence_fiat - diffrenceValue;
            var totalFiat = user_data.total_value - total;
            // resolve(portfolioData)
            var response = {
                'portfolioData': portfolioData,
                'diffrence': changeValue,
                'total': totalFiat,
                "fiat": user_data.fiat
            };
            return res
                .status(200)
                .json({
                    "status": constants.SUCCESS_CODE,
                    "message": i18n.__("portfolio data").message,
                    "data": response
                });

        } catch (error) {
            console.log(error);
        }
        // })
    }

    async getActivityData(req, res) {
        // return new Promise(async (resolve, reject) => {
        try {
            var user_id = await Helper.getUserId(req.headers);
            var data = await ActivityModel
                .query()
                .select()
                .where("user_id", user_id)
                .andWhere('is_market', false)
                .andWhere('deleted_at', null)
                .orderBy('id', 'DESC');

            data.map((value1, i) => {
                value1.percentageChange = 100 - (((value1.quantity) / value1.fix_quantity) * 100);
            });

            return res
                .status(200)
                .json({
                    "status": constants.SUCCESS_CODE,
                    "message": i18n.__("activity data").message,
                    "data": data
                });
        } catch (error) {
            console.log(error);
            return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
        }
        // })
    }

    async updateBuyOrderBook(pair_name) {
        try {
            console.log("pair_name", pair_name)
            let pair = pair_name.split("-").join("")

            await request({
                url: `https://api.binance.com/api/v3/depth?symbol=${pair}&limit=5`,
                method: "GET",
                headers: {
                    'Content-Type': 'application/json'
                },
                json: true
            }, async function (err, httpResponse, body) {
                console.log(body);
                console.log(err);
                var bidValue = body.bids;
                var askValue = body.asks;
                console.log(bidValue)
                console.log(askValue);

                let { crypto, currency } = await Currency.get_currencies(pair_name);
                var maxValue = await PairsModel
                    .query()
                    .first()
                    .select()
                    .where("deleted_at", null)
                    .andWhere("name", pair_name)
                    .orderBy("id", 'DESC')

                console.log("maxValue", maxValue)

                var getCryptoValue = await CurrencyConversionModel
                    .query()
                    .first()
                    .select()
                    .where("deleted_at", null)
                    .andWhere("symbol", "LIKE", '%' + crypto + '%')
                    .orderBy("id", "DESC");

                console.log("getCryptoValue", getCryptoValue)

                var usdValue = getCryptoValue.quote.USD.price
                console.log("usdValue", usdValue)
                var min = (maxValue.crypto_minimum) / (usdValue);
                var max = (maxValue.crypto_maximum) / (usdValue);
                console.log("min", min, " max", max)
                for (var i = 0; i < bidValue.length; i++) {
                    var highlightedNumber = Math.random() * (max - min) + min;
                    bidValue[i][1] = highlightedNumber
                }

                // console.log(bidValue)
                // console.log(askValue);

                var now = new Date();

                var bidValue = await module.exports.shuffle(bidValue);

                for (var i = 0; i < bidValue.length; i++) {
                    // setTimeout(async () => {
                    var quantityValue = parseFloat(bidValue[i][1]).toFixed(8);
                    var priceValue = parseFloat(bidValue[i][0]).toFixed(8);
                    var buyLimitOrderData = {
                        'user_id': process.env.TRADEDESK_USER_ID,
                        'symbol': pair_name,
                        'side': 'Buy',
                        'order_type': 'Limit',
                        'created_at': now,
                        'updated_at': now,
                        'fill_price': 0.0,
                        'limit_price': priceValue,
                        'stop_price': 0.0,
                        'price': priceValue,
                        'quantity': quantityValue,
                        'fix_quantity': quantityValue,
                        'order_status': "open",
                        'currency': currency,
                        'settle_currency': crypto,
                        'maximum_time': now,
                        'is_partially_fulfilled': false,
                        'placed_by': process.env.TRADEDESK_BOT
                    };

                    buyLimitOrderData.is_partially_fulfilled = true;
                    buyLimitOrderData.is_filled = false;
                    buyLimitOrderData.added = true;
                    console.log("buyLimitOrderData", buyLimitOrderData)

                    let requestedWallets = await CoinsModel
                        .query()
                        .select()
                        .where('deleted_at', null)
                        .andWhere('is_active', true)
                        .andWhere(function () {
                            this.where("coin", currency).orWhere("coin", crypto)
                        })
                    // .andWhere('user_id', inputs.requested_user_id);
                    var crypto_coin_id = null
                    var currency_coin_id = null
                    for (let index = 0; index < requestedWallets.length; index++) {
                        const element = requestedWallets[index];
                        if (element.coin == crypto) {
                            crypto_coin_id = element
                        } else if (element.coin == currency) {
                            currency_coin_id = element
                        }
                    }


                    let responseData = await TradeController.limitBuyOrder(buyLimitOrderData.symbol,
                        buyLimitOrderData.user_id,
                        buyLimitOrderData.side,
                        buyLimitOrderData.order_type,
                        buyLimitOrderData.quantity,
                        buyLimitOrderData.limit_price,
                        null,
                        true,
                        crypto_coin_id.id,
                        currency_coin_id.id);

                    console.log("responseData", responseData)
                    await module.exports.sleep(800);
                    // }, i * 800)
                    // let emit_socket = await socketHelper.emitTrades(crypto, currency, [process.env.TRADEDESK_USER_ID])
                }

                // return res.status(200).json({ "status": "OK" })


            })
        } catch (error) {

        }
    }

    async updateSellOrderBook(pair_name) {
        try {
            let pair = pair_name.split("-").join("")
            await request({
                url: `https://api.binance.com/api/v3/depth?symbol=${pair}&limit=5`,
                method: "GET",
                headers: {
                    'Content-Type': 'application/json'
                },
                json: true
            }, async function (err, httpResponse, body) {

                var askValue = body.asks;
                console.log(askValue);
                let { crypto, currency } = await Currency.get_currencies(pair_name);
                var maxValue = await PairsModel
                    .query()
                    .first()
                    .select()
                    .where("deleted_at", null)
                    .andWhere("name", pair_name)
                    .orderBy("id", 'DESC')

                console.log("maxValue", maxValue)

                var getCryptoValue = await CurrencyConversionModel
                    .query()
                    .first()
                    .select()
                    .where("deleted_at", null)
                    .andWhere("symbol", "LIKE", '%' + crypto + '%')
                    .orderBy("id", "DESC");

                console.log("getCryptoValue", getCryptoValue)

                var usdValue = getCryptoValue.quote.USD.price
                console.log("usdValue", usdValue)
                var min = (maxValue.crypto_minimum) / (usdValue);
                var max = (maxValue.crypto_maximum) / (usdValue);
                console.log("min", min, " max", max)

                for (var i = 0; i < askValue.length; i++) {
                    var highlightedNumber = Math.random() * (max - min) + min;
                    askValue[i][1] = highlightedNumber
                }

                // console.log(bidValue)
                console.log(askValue);

                var now = new Date();

                var askValue = await module.exports.shuffle(askValue);
                for (var i = 0; i < askValue.length; i++) {
                    // setTimeout(async () => {
                    var quantityValue = parseFloat(askValue[i][1]).toFixed(8);
                    var priceValue = parseFloat(askValue[i][0]).toFixed(8);
                    let { crypto, currency } = await Currency.get_currencies(pair_name);
                    var sellLimitOrderData = {
                        'user_id': process.env.TRADEDESK_USER_ID,
                        'symbol': pair_name,
                        'side': 'Sell',
                        'order_type': 'Limit',
                        'created_at': now,
                        'updated_at': now,
                        'fill_price': 0.0,
                        'limit_price': priceValue,
                        'stop_price': 0.0,
                        'price': priceValue,
                        'quantity': quantityValue,
                        'fix_quantity': quantityValue,
                        'order_status': "open",
                        'currency': currency,
                        'settle_currency': crypto,
                        'maximum_time': now,
                        'is_partially_fulfilled': false,
                        'placed_by': process.env.TRADEDESK_BOT
                    };

                    sellLimitOrderData.is_partially_fulfilled = true;
                    sellLimitOrderData.is_filled = false;
                    sellLimitOrderData.added = true;
                    let requestedWallets = await CoinsModel
                        .query()
                        .select()
                        .where('deleted_at', null)
                        .andWhere('is_active', true)
                        .andWhere(function () {
                            this.where("coin", currency).orWhere("coin", crypto)
                        })
                    // .andWhere('user_id', inputs.requested_user_id);
                    var crypto_coin_id = null
                    var currency_coin_id = null
                    for (let index = 0; index < requestedWallets.length; index++) {
                        const element = requestedWallets[index];
                        if (element.coin == crypto) {
                            crypto_coin_id = element
                        } else if (element.coin == currency) {
                            currency_coin_id = element
                        }
                    }

                    let responseData = await TradeController.limitSellOrder(sellLimitOrderData.symbol,
                        sellLimitOrderData.user_id,
                        sellLimitOrderData.side,
                        sellLimitOrderData.order_type,
                        sellLimitOrderData.quantity,
                        sellLimitOrderData.limit_price,
                        null,
                        true,
                        crypto_coin_id.id,
                        currency_coin_id.id);


                    console.log("responseData", responseData)
                    await module.exports.sleep(800);
                    // }, i * 800)
                    // let emit_socket = await socketHelper.emitTrades(crypto, currency, [process.env.TRADEDESK_USER_ID])
                }

                // return res.status(200).json({ "status": "OK" })


            })
        } catch (error) {

        }
    }


    shuffle(arra1) {
        var ctr = arra1.length, temp, index;

        // While there are elements in the array
        while (ctr > 0) {
            // Pick a random index
            index = Math.floor(Math.random() * ctr);
            // Decrease ctr by 1
            ctr--;
            // And swap the last element with it
            temp = arra1[ctr];
            arra1[ctr] = arra1[index];
            arra1[index] = temp;
        }
        return arra1;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async deletePendingOrder() {
        try {
            var now = moment().utc().subtract(30, 'seconds').format("YYYY-MM-DD HH:mm:ss");
            var getPendingBuyOrder = await BuyBookModel
                .query()
                .select()
                .where("deleted_at", null)
                .andWhere("created_at", "<=", now)
                .andWhere("placed_by", process.env.TRADEDESK_BOT)
                .orderBy("id", "DESC")

            console.log("getPendingBuyOrder", getPendingBuyOrder)
            console.log("getPendingBuyOrder.length", getPendingBuyOrder.length)

            for (var i = 0; i < getPendingBuyOrder.length; i++) {
                var getData = await cancelOldOrder.cancelPendingOrder(getPendingBuyOrder[i].side, getPendingBuyOrder[i].order_type, getPendingBuyOrder[i].id)
                console.log("getData", getData)
            }
        } catch (error) {
            console.log(error);
        }
    }

    async deleteSellPendingOrder() {
        try {
            var now = moment().utc().subtract(30, 'seconds').format("YYYY-MM-DD HH:mm:ss");
            var getPendingSellOrder = await SellBookModel
                .query()
                .select()
                .where("deleted_at", null)
                .andWhere("created_at", "<=", now)
                .andWhere("placed_by", process.env.TRADEDESK_BOT)
                .orderBy("id", "DESC")

            console.log("getPendingBuyOrder", getPendingSellOrder)
            console.log("getPendingSellOrder.length", getPendingSellOrder.length)

            for (var i = 0; i < getPendingSellOrder.length; i++) {
                var getData = await cancelOldOrder.cancelPendingOrder(getPendingSellOrder[i].side, getPendingSellOrder[i].order_type, getPendingSellOrder[i].id)
                console.log("getData", getData)
            }
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = new DashboardController();