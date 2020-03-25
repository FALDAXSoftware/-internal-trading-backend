var Currency = require("../currency");
var getLatestPrice = require("../fixapi/get-latest-price");
var AdminSettingModel = require("../../models/AdminSetting");
var snapshotPrice = require("./get-snapshot-price");
var feesCalculation = require("../fees-calculation");
var offerCodeStatus = require("./check-offer-code-status");
var applyOfferCode = require("./apply-offer-code");

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

                console.log("faldax_fee", faldax_fee)

                var get_jst_price = await snapshotPrice.priceValue(req_body.Symbol, (req_body.Side == 1 ? "Buy" : "Sell"), req_body.OrderQty, flag)
                if (req_body.Side == 1) {
                    priceValue = (1 / get_jst_price[0].ask_price);
                }
                totalValue = (parseFloat(req_body.OrderQty) * parseFloat(priceValue))
                var qty = req_body.OrderQty;
                req_body.OrderQty = totalValue;

                if (req_body.Side == 1) {
                    feesCurrency = crypto;
                    get_network_fees = await feesCalculation.feesValue(feesCurrency.toLowerCase(), qty);
                    console.log("req_body.OrderQty", req_body.OrderQty)
                    console.log("faldax_fee.value", faldax_fee.value)
                    faldax_fee_value = (req_body.OrderQty * ((faldax_fee.value) / 100))
                    faldax_fees_actual = faldax_fee_value;
                    get_faldax_fee = (!usd_value || usd_value == null || usd_value <= 0 || isNaN(usd_value)) ? (parseFloat(req_body.OrderQty) - parseFloat(get_network_fees) - parseFloat(((req_body.OrderQty * (faldax_fee.value) / 100)))) : (parseFloat(req_body.OrderQty) - parseFloat(get_network_fees) - parseFloat(((req_body.OrderQty * (faldax_fee.value) / 100))));
                    if (!usd_value && usd_value != '') { (original_value = get_faldax_fee) }
                    req_body.OrderQty = get_faldax_fee;
                }
                console.log("get_faldax_fee before", get_faldax_fee)

                if (req_body.offer_code && req_body.offer_code != '') {
                    var dataValueOne = await applyOfferCode.offerObject(req_body, faldax_fee_value, flag);
                    var faldax_feeRemainning = dataValueOne.final_faldax_fees_actual - dataValueOne.faldax_fees_offer;
                    if (faldax_feeRemainning < 0) {
                        faldax_feeRemainning = 0.0
                    }
                    console.log(parseFloat(faldax_feeRemainning));
                    var feeValue = parseFloat(faldax_feeRemainning).toFixed(8)
                    get_faldax_fee = parseFloat(get_faldax_fee) + parseFloat(feeValue);
                    dataValue = dataValueOne.priceValue;
                    faldax_fee_value = dataValueOne.faldax_fees_offer;
                }

                if (!usd_value || usd_value == null || usd_value <= 0 || isNaN(usd_value)) {
                    usd_price = await getLatestPrice.latestPrice(currency + 'USD', (req_body.Side == 1 ? "Buy" : "Sell"));
                    console.log("usd_price", usd_price)
                    usd_price = (qty * usd_price[0].ask_price)
                }
                req_body.OrderQty = qty;

                if (usd_value) {
                    get_faldax_fee = get_faldax_fee;
                }

                original_value = totalValue;
                console.log("get_faldax_fee", get_faldax_fee)
                returnData = {
                    "network_fee": (get_network_fees > 0) ? (get_network_fees) : (0.0),
                    "faldax_fee": (faldax_fee_value > 0) ? (faldax_fee_value) : (0.0),
                    "total_value": (get_faldax_fee > 0) ? (get_faldax_fee) : (0.0),
                    "currency": feesCurrency,
                    "price_usd": (usd_value == null || !usd_value || usd_value == undefined || isNaN(usd_value)) ? usd_price : totalValue,
                    "currency_value": (usd_value == null || !usd_value || usd_value == undefined || isNaN(usd_value)) ? req_body.OrderQty : price_value_usd,
                    "original_value": original_value,
                    "orderQuantity": original_value,
                    "faldax_fees_actual": faldax_fees_actual
                }

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