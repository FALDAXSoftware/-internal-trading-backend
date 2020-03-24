var Currency = require("../currency");
var getLatestPrice = require("../fixapi/get-latest-price");
var AdminSettingModel = require("../../models/AdminSetting");

var priceObject = async (value_object) => {
    try {
        var req_body = value_object;
        var get_faldax_fee;
        var get_network_fees;
        var feesCurrency;
        var usd_value = req_body.usd_value;
        var flag = req_body.flag;
        var priceValue = 0;
        var totalValue;
        var faldax_fee_value;
        var usd_price;
        var price_value_usd = 0;
        var original_value = 0;
        var faldax_fees_actual = 0;

        let { crypto, currency } = await Currency.get_currencies(symbol);

        var returnData;

        if (req_body.original_pair == req_body.order_pair) {
            if (flag == 1) {
                var qty = req_body.OrderQty;
                var totalValue = 0;
                var priceValue = 0;
                if (usd_value) {
                    var price_value = await getLatestPrice.latestPrice(currency + 'USD', (req_body.Side == 1 ? "Buy" : "Sell"))
                    console.log("price_value", price_value);
                    if (req_body.Side == 1) {
                        price_value_usd = (1 / price_value[0].ask_price);
                    }
                    price_value_usd = price_value_usd * usd_value;
                    req_body.OrderQty = price_value_usd;
                }
                var faldax_fee = await AdminSettingModel
                    .query()
                    .first()
                    .select()
                    .where('deleted_at', null)
                    .andWhere('slug', 'faldax_fee')
                    .orderBy('id', 'DESC')


            } else if (flag == 2) {

            }
        } else if (req_body.original_pair != req_body.order_pair) {
            if (flag == 1) {

            } else if (flag == 2) {

            }
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    priceObject
}