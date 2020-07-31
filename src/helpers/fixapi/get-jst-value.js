var CurrencyConversion = require("../currency_conversion");
var getLatestPrice = require("../fixapi/get-latest-price");
var AdminSettingModel = require("../../models/AdminSetting");
var snapshotPrice = require("./get-snapshot-price");
var feesCalculation = require("../fees-calculation");
var offerCodeStatus = require("./check-offer-code-status");
var applyOfferCode = require("./apply-offer-code");

var priceObject = async (value_object) => {
    try {
        var req_body = value_object;
        var symbol = req_body.Symbol;
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
        // console.log(symbol);
        let { crypto, currency } = await CurrencyConversion.currency_conversion(symbol);

        var returnData;

        console.log("req_body.original_pair == req_body.order_pair", req_body.original_pair == req_body.order_pair)

        if (req_body.original_pair == req_body.order_pair) {
            // console.log("flag", flag)
            if (flag == 1) {
                var qty = req_body.OrderQty;
                var totalValue = 0;
                var priceValue = 0;
                if (usd_value) {
                    var price_value = await getLatestPrice.latestPrice(currency + 'USD', (req_body.Side == 1 ? "Buy" : "Sell"))
                    // console.log("price_value", price_value);
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

                // console.log("faldax_fee", faldax_fee)

                var get_jst_price = await snapshotPrice.priceValue(req_body.Symbol, (req_body.Side == 1 ? "Buy" : "Sell"), req_body.OrderQty, flag, "check")
                // console.log("get_jst_price", get_jst_price)
                // console.log("get_jst_price[0].ask_price", get_jst_price[0].ask_price)
                // console.log("(1 / get_jst_price[0].ask_price)", (1 / get_jst_price[0].ask_price))
                if (req_body.Side == 1) {
                    priceValue = (1 / get_jst_price[0].ask_price);
                }
                // console.log("priceValue", priceValue)
                totalValue = (parseFloat(req_body.OrderQty) * parseFloat(priceValue))
                // console.log("totalValue", totalValue)
                var qty = req_body.OrderQty;
                req_body.OrderQty = totalValue;
                // console.log("req_body", req_body)
                if (req_body.Side == 1) {
                    feesCurrency = crypto;
                    // console.log("feesCurrency", feesCurrency)
                    // console.log("qty", qty)
                    get_network_fees = await feesCalculation.feesValue(feesCurrency.toLowerCase(), qty);
                    // console.log("get_network_fees", get_network_fees)
                    // console.log("req_body.OrderQty", req_body.OrderQty)
                    // console.log("faldax_fee.value", faldax_fee.value)
                    faldax_fee_value = (req_body.OrderQty * ((faldax_fee.value) / 100))
                    // console.log("faldax_fee_value", faldax_fee_value)
                    faldax_fees_actual = faldax_fee_value;
                    get_faldax_fee = (!usd_value || usd_value == null || usd_value <= 0 || isNaN(usd_value)) ? (parseFloat(req_body.OrderQty) - parseFloat(get_network_fees) - parseFloat(((req_body.OrderQty * (faldax_fee.value) / 100)))) : (parseFloat(req_body.OrderQty) - parseFloat(get_network_fees) - parseFloat(((req_body.OrderQty * (faldax_fee.value) / 100))));
                    if (!usd_value && usd_value != '') {
                        (original_value = get_faldax_fee)
                    }
                    req_body.OrderQty = get_faldax_fee;
                }
                // console.log("get_faldax_fee before", get_faldax_fee)

                if (req_body.offer_code && req_body.offer_code != '') {
                    var dataValueOne = await applyOfferCode.offerObject(req_body, faldax_fee_value, flag);
                    var faldax_feeRemainning = dataValueOne.final_faldax_fees_actual - dataValueOne.faldax_fees_offer;
                    if (faldax_feeRemainning < 0) {
                        faldax_feeRemainning = 0.0
                    }
                    // console.log(parseFloat(faldax_feeRemainning));
                    var feeValue = parseFloat(faldax_feeRemainning).toFixed(8)
                    get_faldax_fee = parseFloat(get_faldax_fee) + parseFloat(feeValue);
                    dataValue = dataValueOne.priceValue;
                    faldax_fee_value = dataValueOne.faldax_fees_offer;
                }

                if (!usd_value || usd_value == null || usd_value <= 0 || isNaN(usd_value)) {
                    usd_price = await getLatestPrice.latestPrice(currency + 'USD', (req_body.Side == 1 ? "Buy" : "Sell"));
                    // console.log("usd_price", usd_price)
                    // console.log("qty", qty)
                    usd_price = (qty * usd_price[0].ask_price)
                }
                req_body.OrderQty = qty;

                if (usd_value) {
                    get_faldax_fee = get_faldax_fee;
                }

                original_value = totalValue;
                // console.log("get_faldax_fee", get_faldax_fee)
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
                var valueUSD
                var totalValue = 0;
                var priceValue = 0;
                var price_value_usd = 0;
                console.log("usd_value", usd_value)
                if (usd_value) {
                    var price_value = await getLatestPrice.latestPrice(crypto + 'USD', (req_body.Side == 1 ? "Buy" : "Sell"));
                    console.log("price_value", price_value);
                    console.log("price_value[0].ask_price", price_value[0].ask_price);
                    console.log("(1 / price_value[0].ask_price)", (1 / price_value[0].ask_price))
                    console.log("req_body.Side == 1", req_body.Side == 1)
                    if (req_body.Side == 1) {
                        price_value_usd = (1 / price_value[0].ask_price);
                    }
                    price_value_usd = price_value_usd * usd_value;
                    console.log("price_value_usd", price_value_usd)
                    req_body.OrderQty = price_value_usd;
                    console.log("req_body.OrderQty", req_body.OrderQty)
                }
                var faldax_fee = await AdminSettingModel
                    .query()
                    .first()
                    .select()
                    .where("deleted_at", null)
                    .andWhere("slug", "faldax_fee")
                    .orderBy("id", 'DESC');
                // console.log("faldax_fee", faldax_fee);
                if (req_body.Side == 1) {
                    var qty = ((req_body.OrderQty))
                    feesCurrency = crypto;
                    // console.log("feesCurrency", feesCurrency, qty)
                    get_network_fees = await feesCalculation.feesValue(feesCurrency.toLowerCase(), qty);
                    console.log("get_network_fees", get_network_fees)
                    faldax_fee_value = (req_body.OrderQty * ((faldax_fee.value) / 100))
                    faldax_fees_actual = faldax_fee_value;
                    get_faldax_fee = (!usd_value || usd_value == null || usd_value <= 0 || isNaN(usd_value)) ? (parseFloat(req_body.OrderQty) + parseFloat(get_network_fees) + parseFloat(((req_body.OrderQty * (faldax_fee.value) / 100)))) : (parseFloat(price_value_usd) + parseFloat(get_network_fees) + parseFloat(((price_value_usd * (faldax_fee.value) / 100))));
                    original_value = get_faldax_fee
                    req_body.OrderQty = get_faldax_fee;
                }
                console.log(req_body)
                var dataValueOne = 0;
                if (req_body.offer_code && req_body.offer_code != '') {
                    dataValueOne = await applyOfferCode.offerObject(req_body, faldax_fee_value, flag)
                    // console.log("dataValueOne", dataValueOne)
                    faldax_fee_value = dataValueOne.faldax_fees_offer;
                    req_body.OrderQty = parseFloat(req_body.OrderQty) - parseFloat(dataValueOne.final_faldax_fees_actual);
                }

                var get_jst_price = await snapshotPrice.priceValue(req_body.Symbol, (req_body.Side == 1 ? "Buy" : "Sell"), req_body.OrderQty, flag, "check");
                console.log("get_jst_price", get_jst_price)
                if (req_body.Side == 1) {
                    priceValue = (get_jst_price[0].ask_price);
                }

                totalValue = priceValue * req_body.OrderQty;
                console.log("priceValue", priceValue)
                console.log("totalValue", totalValue)

                console.log(!usd_value || usd_value == null || usd_value <= 0 || isNaN(usd_value))

                if (!usd_value || usd_value == null || usd_value <= 0 || isNaN(usd_value)) {
                    totalValue = (req_body.OrderQty * priceValue);
                    // console.log("crypto", crypto);
                    usd_price = await getLatestPrice.latestPrice(crypto + 'USD', (req_body.Side == 1 ? "Buy" : "Sell"));
                    // console.log("usd_price", usd_price);
                    usd_price = (req_body.OrderQty * usd_price[0].ask_price)
                }

                console.log("get_faldax_fee", get_faldax_fee)

                get_faldax_fee = req_body.OrderQty;

                returnData = {
                    "network_fee": get_network_fees,
                    "faldax_fee": faldax_fee_value,
                    "total_value": get_faldax_fee,
                    "currency": feesCurrency,
                    "price_usd": (usd_value == null || !usd_value || usd_value == undefined || isNaN(usd_value)) ? usd_price : usd_value,
                    "currency_value": (usd_value == null || !usd_value || usd_value == undefined || isNaN(usd_value)) ? totalValue : totalValue,
                    "original_value": (usd_value == null || !usd_value || usd_value == undefined || isNaN(usd_value)) ? qty : price_value_usd,
                    "orderQuantity": get_faldax_fee,
                    "faldax_fees_actual": faldax_fees_actual
                }
                console.log("OUTGOING===", returnData)
            }
        } else if (req_body.original_pair != req_body.order_pair) {
            if (flag == 1) {
                if (usd_value) {
                    var price_value = await getLatestPrice.latestPrice(crypto + 'USD', (req_body.Side == 1 ? "Buy" : "Sell"));
                    if (req_body.Side == 2) {
                        price_value_usd = (1 / price_value[0].bid_price);
                    }
                    price_value_usd = price_value_usd * usd_value;
                    req_body.OrderQty = price_value_usd;
                }
                var get_jst_price = await snapshotPrice.priceValue(req_body.Symbol, (req_body.Side == 1 ? "Buy" : "Sell"), req_body.OrderQty, flag);
                if (req_body.Side == 2) {
                    priceValue = (get_jst_price[0].bid_price);
                }
                totalValue = (req_body.OrderQty * priceValue)
                if (req_body.Side == 2) {
                    feesCurrency = currency;
                    get_network_fees = await feesCalculation.feesValue(feesCurrency.toLowerCase(), totalValue, totalValue);
                    var faldax_fee = await AdminSettingModel
                        .query()
                        .first()
                        .select()
                        .where("deleted_at", null)
                        .andWhere("slug", "faldax_fee")
                        .orderBy("id", "DESC");

                    faldax_fee_value = (totalValue * ((faldax_fee.value) / 100))
                    faldax_fees_actual = faldax_fee_value;
                    get_faldax_fee = totalValue - get_network_fees - ((totalValue * (faldax_fee.value) / 100))
                    var dataValueOne = 0;
                    if (req_body.offer_code && req_body.offer_code != '') {
                        dataValueOne = await applyOfferCode.offerObject(req_body, faldax_fee_value, limit_price, get_faldax_fee, flag);
                        var faldax_feeRemainning = dataValueOne.final_faldax_fees_actual - dataValueOne.faldax_fees_offer;
                        get_faldax_fee = parseFloat(get_faldax_fee) + parseFloat(faldax_feeRemainning);
                        faldax_fee_value = dataValueOne.faldax_fees_offer
                    }
                    get_faldax_fee = (get_faldax_fee);
                    faldax_fee_value = faldax_fee_value;
                    original_value = totalValue;
                    if (!usd_value || usd_value == null || usd_value <= 0 || isNaN(usd_value)) {
                        usd_price = await getLatestPrice.latestPrice(crypto + 'USD', (req_body.Side == 1 ? "Buy" : "Sell"));
                        usd_price = (req_body.OrderQty * usd_price[0].bid_price)
                    }
                    returnData = {
                        "network_fee": get_network_fees,
                        "faldax_fee": faldax_fee_value,
                        "total_value": (get_faldax_fee >= 0) ? (get_faldax_fee) : (0.0),
                        "currency": feesCurrency,
                        "price_usd": (usd_value == null || !usd_value || usd_value == undefined || isNaN(usd_value)) ? usd_price : totalValue,
                        "currency_value": (usd_value == null || !usd_value || usd_value == undefined || isNaN(usd_value)) ? req_body.OrderQty : price_value_usd,
                        "original_value": original_value,
                        "orderQuantity": req_body.OrderQty,
                        "faldax_fees_actual": faldax_fees_actual
                    }
                }
            } else if (flag == 2) {
                if (usd_value) {
                    var price_value = await getLatestPrice.latestPrice(currency + 'USD', (req_body.Side == 1 ? "Buy" : "Sell"))
                    if (req_body.Side == 2) {
                        price_value_usd = (1 / price_value[0].bid_price);
                    }
                    price_value_usd = price_value_usd * usd_value;
                    req_body.OrderQty = price_value_usd;
                }
                var get_jst_price = await snapshotPrice.priceValue(req_body.Symbol, (req_body.Side == 1 ? "Buy" : "Sell"), req_body.OrderQty, flag);
                if (req_body.Side == 2) {
                    priceValue = (1 / get_jst_price[0].bid_price);
                }
                totalValue = (req_body.OrderQty * priceValue)
                if (req_body.Side == 2) {
                    feesCurrency = currency;
                    get_network_fees = await feesCalculation.feesValue(feesCurrency.toLowerCase(), req_body.OrderQty, totalValue);
                    var faldax_fee = await AdminSettingModel
                        .query()
                        .first()
                        .select()
                        .where("deleted_at", null)
                        .andWhere("slug", "faldax_fee")
                        .orderBy("id", "DESC");

                    faldax_fee_value = (!usd_value || usd_value == null || usd_value <= 0 || isNaN(usd_value)) ? parseFloat(((req_body.OrderQty * (faldax_fee.value) / 100))) : parseFloat(((price_value_usd * (faldax_fee.value) / 100)))
                    faldax_fees_actual = faldax_fee_value;
                    get_faldax_fee = (!usd_value || usd_value == null || usd_value <= 0 || isNaN(usd_value)) ? (parseFloat(req_body.OrderQty) + parseFloat(get_network_fees) + parseFloat(((req_body.OrderQty * (faldax_fee.value) / 100)))) : (parseFloat(price_value_usd) + parseFloat(get_network_fees) + parseFloat(((price_value_usd * (faldax_fee.value) / 100))));
                    if (req_body.offer_code && req_body.offer_code != '') {
                        var dataValueOne = await applyOfferCode.offerObject(req_body, faldax_fee_value, flag)
                        var faldax_feeRemainning = dataValueOne.final_faldax_fees_actual - dataValueOne.faldax_fees_offer;
                        get_faldax_fee = parseFloat(get_faldax_fee) - parseFloat(faldax_feeRemainning);
                        faldax_fee_value = dataValueOne.faldax_fees_offer
                    }
                }
                if (!usd_value || usd_value == null || usd_value <= 0 || isNaN(usd_value)) {
                    totalValue = (req_body.OrderQty * priceValue);
                    usd_price = await getLatestPrice.latestPrice(currency + 'USD', (req_body.Side == 1 ? "Buy" : "Sell"));
                    usd_price = (req_body.OrderQty * usd_price[0].bid_price)
                }
                totalValue = get_faldax_fee * (priceValue)
                original_value = totalValue;

                returnData = {
                    "network_fee": get_network_fees,
                    "faldax_fee": faldax_fee_value,
                    "total_value": get_faldax_fee,
                    "currency": feesCurrency,
                    "price_usd": (usd_value == null || !usd_value || usd_value == undefined || isNaN(usd_value)) ? usd_price : totalValue,
                    "currency_value": original_value,
                    "original_value": (usd_value == null || !usd_value || usd_value == undefined || isNaN(usd_value)) ? req_body.OrderQty : price_value_usd,
                    "orderQuantity": get_faldax_fee,
                    "faldax_fees_actual": faldax_fees_actual
                }
            }
        }

        // console.log("returnData", returnData)
        returnData.network_fee = parseFloat(returnData.network_fee).toFixed(8);
        returnData.faldax_fee = parseFloat(returnData.faldax_fee).toFixed(8);
        returnData.total_value = parseFloat(returnData.total_value).toFixed(8);
        returnData.price_usd = parseFloat(returnData.price_usd).toFixed(8);
        returnData.currency_value = parseFloat(returnData.currency_value).toFixed(8);
        returnData.original_value = parseFloat(returnData.original_value).toFixed(8);
        returnData.orderQuantity = parseFloat(returnData.orderQuantity).toFixed(8);
        returnData.limit_price = parseFloat(get_jst_price[0].limit_price).toFixed(8)
        returnData.faldax_fees_actual = parseFloat(faldax_fees_actual).toFixed(8)

        return (returnData)
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    priceObject
}
