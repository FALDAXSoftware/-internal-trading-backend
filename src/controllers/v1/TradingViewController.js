/**
 * Trading View Controller
 */

const { raw } = require('objection');
var express = require('express');
var app = express();
var moment = require('moment');
var i18n = require("i18n");

// Files Inludes
var { AppController } = require('./AppController');
var Currency = require("../../helpers/currency");
var candleData = require("../../helpers/get-candle-stick-data");

class TradingViewController extends AppController {

    constructor() {
        super();
    }

    async getConfig(req, res) {
        return res.json({
            "supports_search": true,
            "supports_group_request": false,
            "supports_marks": false,
            "supports_timescale_marks": false,
            "supports_time": true,
            "exchanges": [
                {
                    "value": "",
                    "name": "All Exchanges",
                    "desc": ""
                }
            ],
            "symbols_types": [
                {
                    "name": "All types",
                    "value": ""
                }
            ],
            "supported_resolutions": [
                "1",
                "15",
                "240",
                "D",
                "2D",
                "3D",
                "W",
                "3W",
                "M",
                "6M"
            ]
        });
    }

    async getCurrentTime(req, res) {
        res.json(moment.utc().valueOf())
    }

    async getSymbolInfo(req, res) {
        res.json({
            description: req.query.symbol,
            has_intraday: true,
            has_no_volume: false,
            minmov: 1,
            minmov2: 0,
            name: req.query.symbol,
            pointvalue: 1,
            pricescale: 100,
            // session: "0930-1630",
            supported_resolutions: [
                "1",
                "15",
                "240",
                "D",
                "2D",
                "3D",
                "W",
                "3W",
                "M",
                "6M"
            ],
            ticker: req.query.symbol,
            timezone: "Etc/UTC",
            type: "stock"
        })
    }

    async getHistoryData(req, res) {
        try {
            var { symbol, resolution, from, to } = req.query();
            // console.log("req.query()", req.query())
            var { crypto, currency } = await Currency.get_currencies(symbol);
            var resolutionInMinute = 0;

            // Covert Resolution In Day
            switch (resolution) {
                case "1":
                    resolutionInMinute = 1
                case "15":
                    resolutionInMinute = 15
                case "240":
                    resolutionInMinute = 240
                // Day
                case "D":
                    resolutionInMinute = 1440
                    break;
                case "1D":
                    resolutionInMinute = 1440
                    break;
                // 2 Day 2 Day
                case "2D":
                    resolutionInMinute = 2 * 1440
                    break;
                // 3 Day
                case "3D":
                    resolutionInMinute = 3 * 1440
                    break;
                // Week
                case "W":
                    resolutionInMinute = 7 * 1440
                    break;
                // 3 Week
                case "3W":
                    resolutionInMinute = 3 * 7 * 1440
                    break;
                // Month
                case "M":
                    resolutionInMinute = 30 * 1440
                    break;
                // 6 Month
                case "6M":
                    resolutionInMinute = 6 * 30 * 1440
                    break;
                // Minutes -> Day
                default:
                    resolutionInMinute = parseInt(resolution);
                    break;
            }
            // console.log("crypto, currency, resolutionInMinute, from, to", crypto, currency, resolutionInMinute, from, to)
            var candleStickData = await candleData.getCandleData(crypto, currency, resolutionInMinute, from, to)

            if (candleStickData.o.length > 0) {
                return res
                    .status(200)
                    .json({
                        s: "ok",
                        ...candleStickData
                    })
            } else {
                return res
                    .status(200)
                    .json({ s: "no_data" });
            }

        } catch (error) {
            console.log(JSON.stringify(error));

            return res
                .status(200)
                .json({
                    s: "error",
                    "errmsg": i18n.__("server error").message
                });
        }
    }
}

module.exports = new TradingViewController();