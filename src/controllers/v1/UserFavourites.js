const { raw } = require('objection');
var express = require('express');
var app = express();
var moment = require('moment');
var i18n = require("i18n");

var { AppController } = require('./AppController');
const constants = require('../../config/constants');
var Helper = require("../../helpers/helpers");
var UserFavouriteModel = require("../../models/UserFavourites");
var TradeHistoryModel = require("../../models/TradeHistory");
var UsersModel = require("../../models/UsersModel");
var KYCModel = require("../../models/KYC");

var Currency = require("../../helpers/currency");
var { map, sortBy } = require('lodash');

// Redis
const redis = require("redis");
const axios = require("axios");
const port_redis = 6379;
const { promisify } = require("util");

const asyncRedis = require("async-redis");
const client = asyncRedis.createClient({
    port: process.env.REDIS_PORT,               // replace with your port
    host: process.env.REDIS_HOST,        // replace with your hostanme or IP address
    password: process.env.REDIS_PASSWORD   // replace with your password
});

class UserFavourites extends AppController {

    constructor() {
        super();
    }

    async getFavouritesData(req, res) {
        // return new Promise(async (resolve, reject) => {
        try {
            var socket_headers = req.headers;
            // console.log(JSON.stringify(socket_headers))
            var symbol = req.query.symbol;

            var value = await client.get(`card_graph-${symbol}`);
            // console.log("value", value);
            if (value == null) {
                let { crypto, currency } = await Currency.get_currencies(symbol);
                var cardData = [];
                var yesterday = moment()
                    .subtract(1, 'days')
                    .format('YYYY-MM-DD HH:mm:ss.SSS');
                var today = moment().format('YYYY-MM-DD HH:mm:ss.SSS');

                var total_price = 0;
                var average_price = 0;
                var flag = true;

                var price = await TradeHistoryModel
                    .query()
                    .select("created_at", "fill_price", "quantity")
                    .where('settle_currency', crypto)
                    .andWhere('currency', currency)
                    .andWhere('created_at', '<=', today)
                    .andWhere('created_at', '>=', yesterday)
                    .orderBy('created_at', 'ASC');

                if (price.length == 0) {
                    average_price = 0;
                } else {
                    map(price, p => {
                        total_price = total_price + (p.fill_price / p.quantity);
                    });
                    average_price = total_price / (price.length);
                }

                var current_price = 0.0
                if (price.length == 0) {
                    current_price = 0;
                } else {
                    current_price = price[price.length - 1]['fill_price'];
                }

                var previous_price = 0.0
                if (price.length == 0) {
                    previous_price = 0;
                } else {
                    previous_price = price[0]['fill_price'];
                }

                var diffrence = current_price - previous_price;
                var percentchange = (diffrence * 100 / previous_price);

                if (percentchange == NaN || percentchange == "-Infinity") {
                    percentchange = 0;
                } else {
                    percentchange = percentchange;
                }

                if (diffrence <= 0) {
                    flag = false;
                } else {
                    flag = true;
                }

                var card_data = {
                    "pair_from": crypto,
                    "pair_to": currency,
                    "average_price": average_price,
                    "diffrence": diffrence,
                    "percentchange": percentchange,
                    "flag": flag,
                    "tradeChartDetails": price
                    // "socket_id": socket_id
                }

                cardData.push(card_data);


                var value = {
                    "status": constants.SUCCESS_CODE,
                    "message": "Favourites List",
                    "data": cardData
                }

                value = JSON.stringify(value)

                client.setex(`card_graph-${symbol}`, 1800, JSON.stringify(value))
            }
            return res
                .status(200)
                .json(JSON.parse(value));
        } catch (error) {
            // console.log("err", (error));
            return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
        }
        // })
    }

    async getFavourites(user_id, socket_id) {
        return new Promise(async (resolve, reject) => {
            try {
                var cardData = [];
                var getFavourites = await UserFavouriteModel
                    .query()
                    .select()
                    .where('user_id', user_id)
                    .andWhere('deleted_at', null)
                    .orderBy('id', 'DESC');

                var yesterday = moment()
                    .subtract(1, 'days')
                    .format('YYYY-MM-DD HH:mm:ss.SSS');
                var today = moment().format('YYYY-MM-DD HH:mm:ss.SSS');

                var promises = map(getFavourites, async data => {
                    var total_price = 0;
                    var average_price = 0;
                    var flag = true;

                    var price = await TradeHistoryModel
                        .query()
                        .select()
                        .where('settle_currency', data.pair_to)
                        .andWhere('currency', data.pair_from)
                        .andWhere('created_at', '>=', yesterday)
                        .orderBy('id', 'DESC')

                    if (price.length == 0) {
                        average_price = 0;
                    } else {
                        map(price, p => {
                            total_price = total_price + (p.fill_price / p.quantity);
                        });
                        average_price = total_price / (price.length);
                    }

                    var current_price = await TradeHistoryModel
                        .query()
                        .first()
                        .where('settle_currency', data.pair_to)
                        .andWhere('currency', data.pair_from)
                        .andWhere('created_at', '<=', today)
                        .andWhere('created_at', '>=', yesterday)
                        .orderBy('id', 'DESC')

                    if (current_price == undefined) {
                        current_price = 0;
                    } else {
                        current_price = current_price.fill_price;
                    }

                    var previous_price = await TradeHistoryModel
                        .query()
                        .first()
                        .where('settle_currency', data.pair_to)
                        .andWhere('currency', data.pair_from)
                        .andWhere('created_at', '<=', today)
                        .andWhere('created_at', '>=', yesterday)
                        .orderBy('id', 'ASC')

                    if (previous_price == undefined) {
                        previous_price = 0;
                    } else {
                        previous_price = previous_price.fill_price;
                    }

                    var diffrence = current_price - previous_price;
                    var percentchange = (diffrence * 100 / previous_price);

                    if (percentchange == NaN || percentchange == "-Infinity") {
                        percentchange = 0;
                    } else {
                        percentchange = percentchange;
                    }

                    if (diffrence <= 0) {
                        flag = false;
                    } else {
                        flag = true;
                    }

                    var tradeorderdetails = await TradeHistoryModel
                        .query()
                        .where('settle_currency', data.pair_to)
                        .andWhere('currency', data.pair_from)
                        .andWhere('created_at', '<=', today)
                        .andWhere('created_at', '>=', yesterday)
                        .orderBy('created_at', 'ASC')

                    var card_data = {
                        "pair_from": data.pair_from,
                        "pair_to": data.pair_to,
                        "average_price": average_price,
                        "diffrence": diffrence,
                        "percentchange": percentchange,
                        "flag": flag,
                        "tradeChartDetails": tradeorderdetails,
                        "socket_id": socket_id
                    }

                    cardData.push(card_data);
                    return cardData;
                })

                await Promise.all(promises);
                resolve({
                    "status": constants.SUCCESS_CODE,
                    "message": "Favourites List",
                    "data": cardData
                });
            } catch (error) {
                // console.log("err", JSON.stringify(error));
                // return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
            }
        })
    }

    async addFavouritesData(req, res) {
        try {
            // var data = req.body;
            var pair_from = req.body.pair_from;
            var pair_to = req.body.pair_to;
            // var priority = req.body.priority;
            // var socket_id = req.body.socket_id;
            var user_id = req.body.user_id;
            var status = req.body.status;

            if (status == 1) {
                var userData = await UserFavouriteModel
                    .query()
                    .select()
                    .where('user_id', user_id)
                    .andWhere('pair_from', pair_from)
                    .andWhere('pair_to', pair_to)
                    .andWhere('deleted_at', null)
                    .orderBy('id', 'DESC');

                if (userData == undefined) {
                    var userAddFavourites = await UserFavouriteModel
                        .query()
                        .insert({
                            'user_id': user_id,
                            "pair_from": pair_from,
                            "pair_to": pair_to,
                            "created_at": moment(),
                            "deleted_at": null
                        })
                    return Helper.jsonFormat(res, constants.SUCCESS_CODE, i18n.__("pair added success").message, []);
                } else {
                    return Helper.jsonFormat(res, constants.ACCEPTED_CODE, i18n.__("pair already exist").message, []);
                }
            } else if (status == 2) {
                var userData = await UserFavouriteModel
                    .query()
                    .select()
                    .where('user_id', user_id)
                    .andWhere('pair_from', pair_from)
                    .andWhere('pair_to', pair_to)
                    .andWhere('deleted_at', null)
                    .orderBy('id', 'DESC');

                if (userData != undefined) {
                    var userUpdate = await UserFavouriteModel
                        .query()
                        .where('user_id', user_id)
                        .andWhere('pair_from', pair_from)
                        .andWhere('pair_to', pair_to)
                        .andWhere('deleted_at', null)
                        .patch({
                            'deleted_at': moment()
                        });
                }
            }


        } catch (error) {
            // console.log(JSON.stringify(error))
            return Helper.jsonFormat(res, constants.SERVER_ERROR_CODE, i18n.__("server error").message, []);
        }
    }

    async updateUserTier(req, res) {
        var getUser = await UsersModel
            .query()
            .select("id", "account_tier")
            .where("deleted_at", null)
            .andWhere("is_active", true)
            .orderBy("id", "DESC");

        if (getUser != undefined) {
            for (let index = 0; index < getUser.length; index++) {
                const element = getUser[index];
                var getValueKYC = await KYCModel
                    .query()
                    .first()
                    .select("user_id", "direct_response", "webhook_response")
                    .where("user_id", element.id)
                    .andWhere("deleted_at", null)
                    .orderBy("id", "DESC")

                if (getValueKYC.length != undefined && getValueKYC.direct_response == "ACCEPT" && getValueKYC.webhook_response == "ACCEPT") {
                    var updateUserTier = await UsersModel
                        .query()
                        .where("deleted_at", null)
                        .andWhere("is_active", true)
                        .andWhere("id", element.id)
                        .patch({
                            account_tier: 1
                        })
                } else {
                    var updateUserTier = await UsersModel
                        .query()
                        .where("deleted_at", null)
                        .andWhere("is_active", true)
                        .andWhere("id", element.id)
                        .patch({
                            account_tier: 0
                        })
                }
            }
        }
    }

    async updatePairCache(symbol) {
        try {
            let { crypto, currency } = await Currency.get_currencies(symbol);
            var cardData = [];
            var yesterday = moment()
                .subtract(1, 'days')
                .format('YYYY-MM-DD HH:mm:ss.SSS');
            var today = moment().format('YYYY-MM-DD HH:mm:ss.SSS');

            var total_price = 0;
            var average_price = 0;
            var flag = true;

            var price = await TradeHistoryModel
                .query()
                .select("created_at", "fill_price", "quantity")
                .where('settle_currency', crypto)
                .andWhere('currency', currency)
                .andWhere('created_at', '<=', today)
                .andWhere('created_at', '>=', yesterday)
                .orderBy('created_at', 'ASC');

            if (price.length == 0) {
                average_price = 0;
            } else {
                map(price, p => {
                    total_price = total_price + (p.fill_price / p.quantity);
                });
                average_price = total_price / (price.length);
            }

            var current_price = 0.0
            if (price.length == 0) {
                current_price = 0;
            } else {
                current_price = price[price.length - 1]['fill_price'];
            }

            var previous_price = 0.0
            if (price.length == 0) {
                previous_price = 0;
            } else {
                previous_price = price[0]['fill_price'];
            }

            var diffrence = current_price - previous_price;
            var percentchange = (diffrence * 100 / previous_price);

            if (percentchange == NaN || percentchange == "-Infinity") {
                percentchange = 0;
            } else {
                percentchange = percentchange;
            }

            if (diffrence <= 0) {
                flag = false;
            } else {
                flag = true;
            }

            var card_data = {
                "pair_from": crypto,
                "pair_to": currency,
                "average_price": average_price,
                "diffrence": diffrence,
                "percentchange": percentchange,
                "flag": flag,
                "tradeChartDetails": price
                // "socket_id": socket_id
            }

            cardData.push(card_data);

            var value = {
                "status": constants.SUCCESS_CODE,
                "message": "Favourites List",
                "data": cardData
            }

            client.setex(`card_graph-${symbol}`, 1800, JSON.stringify(value))
        } catch (err) {
            // console.log(err)
        }
    }

    async updateReqPairCache(req, res) {
        try {
            var symbol = req.query.symbol;
            let { crypto, currency } = await Currency.get_currencies(symbol);
            var cardData = [];
            var yesterday = moment()
                .subtract(1, 'days')
                .format('YYYY-MM-DD HH:mm:ss.SSS');
            var today = moment().format('YYYY-MM-DD HH:mm:ss.SSS');

            var total_price = 0;
            var average_price = 0;
            var flag = true;

            var price = await TradeHistoryModel
                .query()
                .select("created_at", "fill_price", "quantity")
                .where('settle_currency', crypto)
                .andWhere('currency', currency)
                .andWhere('created_at', '<=', today)
                .andWhere('created_at', '>=', yesterday)
                .orderBy('created_at', 'ASC');

            if (price.length == 0) {
                average_price = 0;
            } else {
                map(price, p => {
                    total_price = total_price + (p.fill_price / p.quantity);
                });
                average_price = total_price / (price.length);
            }

            var current_price = 0.0
            if (price.length == 0) {
                current_price = 0;
            } else {
                current_price = price[price.length - 1]['fill_price'];
            }

            var previous_price = 0.0
            if (price.length == 0) {
                previous_price = 0;
            } else {
                previous_price = price[0]['fill_price'];
            }

            var diffrence = current_price - previous_price;
            var percentchange = (diffrence * 100 / previous_price);

            if (percentchange == NaN || percentchange == "-Infinity") {
                percentchange = 0;
            } else {
                percentchange = percentchange;
            }

            if (diffrence <= 0) {
                flag = false;
            } else {
                flag = true;
            }

            var card_data = {
                "pair_from": crypto,
                "pair_to": currency,
                "average_price": average_price,
                "diffrence": diffrence,
                "percentchange": percentchange,
                "flag": flag,
                "tradeChartDetails": price
                // "socket_id": socket_id
            }

            cardData.push(card_data);

            var value = {
                "status": constants.SUCCESS_CODE,
                "message": "Favourites List",
                "data": cardData
            }

            client.setex(`card_graph-${symbol}`, 1800, JSON.stringify(value))
            // console.log("Done")
        } catch (err) {
            // console.log(err)
        }
    }
}

module.exports = new UserFavourites();