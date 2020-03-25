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

class DashboardController extends AppController {

    constructor() {
        super();
    }

    async getPortfolioData(user_id) {
        return new Promise(async (resolve, reject) => {
            try {
                var user_data = await UserModel
                    .query()
                    .first()
                    .select()
                    .where('id', user_id)
                    .andWhere('deleted_at', null)
                    .andWhere('is_active', true)
                    .orderBy('id', 'DESC');

                var currency = user_data.fiat;
                var yesterday = moment().subtract(1, 'days');
                var today = moment();
                var portfolioData = [];
                var average_price;

                var coinBalance = await WalletModel
                    .query()
                    .select('coin_name', 'balance', 'coin')
                    .fullOuterJoin('coins', 'wallets.coin_id', 'coins.id')
                    .where('user_id', user_id)
                    .andWhere('coins.is_fiat', false);

                for (var i = 0; i < coinBalance.length; i++) {
                    var total_price = 0;
                    var price = await TradeHistoryModel
                        .query()
                        .select('fill_price')
                        .where('settle_currency', coinBalance[i].coin)
                        .andWhere('currency', currency)
                        .andWhere('created_at', '<=', today)
                        .andWhere('created_at', '>=', yesterday)
                        .orderBy('id', 'DESC')

                    if (price.length == 0) {
                        average_price = 0;
                    } else {
                        for (var j = 0; j < price.length; j++) {
                            total_price = total_price + price[j].fill_price;
                        }

                        average_price = total_price / (price.length);
                    }

                    var percentChange = 0.0;

                    var priceFiat = await CurrencyConversionModel
                        .query()
                        .first()
                        .select()
                        .where('deleted_at', null)
                        .andWhere('symbol', coinBalance[i].coin)
                        .orderBy('id', 'DESC');

                    if (priceFiat == undefined) {
                        priceFiat = 0;
                        percentchange = 0;
                    } else {
                        percentchange = priceFiat.quote.USD.percent_change_24h;
                        priceFiat = priceFiat.quote.USD.price;
                    }

                    var portfolio_data = {
                        "name": coinBalance[i].name,
                        "average_price": average_price,
                        "percentchange": percentchange,
                        "Amount": coinBalance[i].balance,
                        'symbol': coinBalance[i].coin_name,
                        "fiatPrice": priceFiat
                    }

                    portfolioData.push(portfolio_data);

                }
                resolve(portfolioData)

            } catch (error) {
                console.log(error);
            }
        })
    }

    async getActivityData(user_id) {
        return new Promise(async (resolve, reject) => {
            try {
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

                resolve(data);
            } catch (error) {
                console.log(error);
            }
        })
    }
}

module.exports = new DashboardController();