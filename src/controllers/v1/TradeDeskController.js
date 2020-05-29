const { raw } = require('objection');
var express = require('express');
var app = express();
var moment = require('moment');
var i18n = require("i18n");
const logger = require("./logger");

var constants = require("../../config/constants");
var Helper = require("../../helpers/helpers");

var { AppController } = require('./AppController');
var PairsModel = require("../../models/Pairs");
var getBuyOrder = require("../../helpers/buy/get-buy-book-order");
var getSellOrder = require("../../helpers/sell/get-sell-book-order");
var Currency = require("../../helpers/currency");
var CoinModel = require("../../models/Coins");
var PairsModel = require("../../models/Pairs");

class TradeDeskController extends AppController {

    constructor() {
        super();
    }

    async getQuantityMinMaxValue(req, res) {
        try {

            await logger.info({
                "module": "Trade Desk Monitoring",
                "user_id": "user_tradedesk",
                "url": "Trade Function",
                "type": "Entry"
            }, "Entered the function")

            var getPairDetails = await PairsModel
                .query()
                .select("name", "crypto_minimum", "crypto_maximum", "id", "bot_status")
                .where("deleted_at", null)
                .andWhere("is_active", true)
                .orderBy("id", "DESC");

            await logger.info({
                "module": "Trade Desk Monitoring",
                "user_id": "user_tradedesk",
                "url": "Trade Function",
                "type": "Success"
            }, i18n.__("pair details value").message + " " + getPairDetails)

            return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("pair details value").message, getPairDetails)
        } catch (error) {
            console.log("error", JSON.stringify(error));
            await logger.info({
                "module": "Trade Desk Monitoring",
                "user_id": "user_tradedesk",
                "url": "Trade Function",
                "type": "Error"
            }, error);
            return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
        }
    }

    async updateQuantityMinMaxValue(req, res) {
        try {
            var id = PairsModel.decript_id(req.body.id)
            await logger.info({
                "module": "Trade Desk Monitoring - Update Min Max Value",
                "user_id": "user_tradedesk",
                "url": "Trade Function",
                "type": "Entry"
            }, "Entered the function " + req.body)
            var getPairDetails = await PairsModel
                .query()
                .select("name", "crypto_minimum", "crypto_maximum")
                .where("deleted_at", null)
                .andWhere("is_active", true)
                .andWhere("id", id)
                .orderBy("id", "DESC");

            if (getPairDetails.length > 0) {
                var updateSql = `UPDATE pairs 
                                    SET crypto_minimum = '${req.body.min_crypto}', crypto_maximum = '${req.body.max_crypto}', bot_status = ${Boolean(req.body.flag)} 
                                    WHERE id = ${id} AND deleted_at IS NULL AND is_active = 'true'
                                    RETURNING *`

                var updateMinMaxValue = await PairsModel.knex().raw(updateSql);
                updateMinMaxValue = updateMinMaxValue.rows;
                await logger.info({
                    "module": "Trade Desk Monitoring - Update Min Max Value",
                    "user_id": "user_tradedesk",
                    "url": "Trade Function",
                    "type": "Success"
                }, i18n.__("pair value update success").message + " " + updateMinMaxValue)
                return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("pair value update success").message, updateMinMaxValue)
            } else {
                await logger.info({
                    "module": "Trade Desk Monitoring - Update Min Max Value",
                    "user_id": "user_tradedesk",
                    "url": "Trade Function",
                    "type": "Success"
                }, i18n.__("no pair details value").message)
                return Helper.jsonFormat(res, constants.ACCEPTED_CODE, i18n.__("no pair details value").message, [])
            }
        } catch (error) {
            console.log(JSON.stringify(error))
            await logger.info({
                "module": "Trade Desk Monitoring - Update Min Max Value",
                "user_id": "user_tradedesk",
                "url": "Trade Function",
                "type": "Error"
            }, error)
            return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
        }
    }

    async getSpreadValue(req, res) {
        try {
            await logger.info({
                "module": "Trade Desk Monitoring - Get Spread Value",
                "user_id": "user_tradedesk",
                "url": "Trade Function",
                "type": "Entry"
            }, "Entered the function")
            // console.log(req.allParams())
            var spreadSql = `SELECT name, buy_value.bid_price, sell_value.ask_price
                                FROM pairs
                                LEFT JOIN (
                                    SELECT max(limit_price) as bid_price, symbol
                                        FROM buy_book
                                        WHERE deleted_at IS NULL
                                        GROUP BY symbol
                                ) as buy_value
                                ON pairs.name = buy_value.symbol
                                LEFT JOIN (
                                    SELECT min(limit_price) as ask_price, symbol
                                        FROM sell_book
                                        WHERE deleted_at IS NULL
                                        GROUP BY symbol
                                ) as sell_value
                                ON sell_value.symbol = pairs.name
                                WHERE deleted_at IS NULL`

            var spreadData = await PairsModel.knex().raw(spreadSql)
            spreadData = spreadData.rows;
            await logger.info({
                "module": "Trade Desk Monitoring - Get Spread Value",
                "user_id": "user_tradedesk",
                "url": "Trade Function",
                "type": "Success"
            }, i18n.__("spread retrieve success").message + " " + spreadData)
            return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("spread retrieve success").message, spreadData)
        } catch (error) {
            console.log("error", JSON.stringify(error));
            await logger.info({
                "module": "Trade Desk Monitoring - Get Spread Value",
                "user_id": "user_tradedesk",
                "url": "Trade Function",
                "type": "Error"
            }, error)
            return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
        }
    }

    async getWalletTradeDeskBalance(req, res) {
        try {
            await logger.info({
                "module": "Trade Desk Monitoring - Get Trade Desk USer Balance",
                "user_id": "user_tradedesk",
                "url": "Trade Function",
                "type": "Entry"
            }, "Entered the function")
            var walletSql = `SELECT coins.coin, wallets.balance, wallets.placed_balance, wallets.receive_address,
                                json(currency_conversion.quote->'USD'->'price') as fiat_value, coins.coin_code
                                FROM coins
                                LEFT JOIN wallets
                                ON wallets.coin_id = coins.id
                                LEFT JOIN currency_conversion
                                ON currency_conversion.coin_id = coins.id
                                WHERE wallets.deleted_at IS NULL AND wallets.user_id = ${process.env.TRADEDESK_USER_ID}`
            var getWalletData = await CoinModel.knex().raw(walletSql)
            getWalletData = getWalletData.rows;
            await logger.info({
                "module": "Trade Desk Monitoring - Get Trade Desk USer Balance",
                "user_id": "user_tradedesk",
                "url": "Trade Function",
                "type": "Error"
            }, i18n.__("trade desk user wallet success").message + " ", getWalletData)
            return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("trade desk user wallet success").message, getWalletData);
        } catch (error) {
            console.log("error", JSON.stringify(error));
            await logger.info({
                "module": "Trade Desk Monitoring - Get Trade Desk USer Balance",
                "user_id": "user_tradedesk",
                "url": "Trade Function",
                "type": "Error"
            }, error)
            return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
        }
    }

    // async changeBotStatus(req, res) {
    //     try {
    //         var id = PairsModel.decript_id(req.body.id)
    //     } catch (error) {
    //         console.log("error", JSON.stringify(error));
    //         await logger.info({
    //             "module": "Trade Desk Monitoring",
    //             "user_id": "user_tradedesk",
    //             "url": "Trade Function",
    //             "type": "Error"
    //         }, error);
    //         return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
    //     }
    // }
}

module.exports = new TradeDeskController();