var CoinsModel = require("../models/Coins");
const { raw } = require('objection');
var AdminSettingModel = require("../models/AdminSetting");

var feesValue = async (coin, quantity = null, price = null) => {
    var value;
    console.log("coin", coin)
    if (coin == 'susu') {
        coin = 'SUSU';
    }

    var coinData = await CoinsModel
        .query()
        .first()
        .select()
        .where('deleted_at', null)
        .andWhere("is_active", true)
        .andWhere('coin', coin.toUpperCase())
        .orderBy('id', 'DESC')

    console.log("coinData", coinData)

    if (coinData != undefined) {
        if (coin == "btc" || coin == "tbtc") {
            var data = await AdminSettingModel
                .query()
                .first()
                .select()
                .where("deleted_at", null)
                .andWhere("slug", "btc_fee")
                .orderBy('id', 'DESC');
            console.log("data", data)
            value = (((quantity) / (25) * data.value));
        } else if (coin == 'bch' || coin == 'tbch') {
            var data = await AdminSettingModel
                .query()
                .first()
                .select()
                .where("deleted_at", null)
                .andWhere('slug', "bch_fees")
                .orderBy('id', 'DESC');

            value = ((data.value * quantity) / price);
        } else if (coin == 'eth' || coin == 'teth' || coinData.iserc == true) {
            var data = await AdminSettingModel
                .query()
                .first()
                .select()
                .where("deleted_at", null)
                .andWhere('slug', "eth_fees")
                .orderBy('id', 'DESC');

            value = (data.value * 21000);
        } else if (coin == 'ltc' || coin == 'tltc') {
            var data = await AdminSettingModel
                .query()
                .first()
                .select()
                .where("deleted_at", null)
                .andWhere('slug', "ltc_fees")
                .orderBy('id', 'DESC');

            value = data.value;
        } else if (coin == 'xrp' || coin == 'txrp') {
            var data = await AdminSettingModel
                .query()
                .first()
                .select()
                .where("deleted_at", null)
                .andWhere('slug', "xrp_fees")
                .orderBy('id', 'DESC');

            value = data.value
        } else if (coin == 'SUSU') {
            value = 0.01
        }
        console.log("FEES>>>>>>", value)
        return value;
    } else {
        // Coin not Found
        return false;
    }
}

module.exports = {
    feesValue
}