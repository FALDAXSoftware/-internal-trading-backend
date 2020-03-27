var latestPrice = require("./get-latest-price");
var checkOfferStatus = require("./check-offer-code-status");

var offerObject = async (req_body, faldax_fee_value, flag) => {
    console.log("req_body, faldax_fee_value, flag", req_body, faldax_fee_value, flag)
    var currency_pair = (req_body.Symbol).split("/");
    // Get  Fiat Value of each Asset
    let calculate_offer_amount = 0;
    if (req_body.original_pair == req_body.order_pair) {
        var asset1_value = await latestPrice.latestPrice(currency_pair[0] + 'USD', "Buy");
        var asset1_usd_value = asset1_value[0].ask_price;
        var asset2_value = await latestPrice.latestPrice(currency_pair[1] + 'USD', "Buy");
        var asset2_usd_value = asset2_value[0].ask_price;
        calculate_offer_amount = asset1_usd_value;
    } else {
        var asset1_value = await latestPrice.latestPrice(currency_pair[0] + 'USD', "Sell");
        var asset1_usd_value = asset1_value[0].bid_price;
        var asset2_value = await latestPrice.latestPrice(currency_pair[1] + 'USD', "Sell");
        var asset2_usd_value = asset2_value[0].bid_price;
        calculate_offer_amount = asset2_usd_value;
    }
    console.log("calculate_offer_amount", calculate_offer_amount)

    var final_faldax_fees = faldax_fee_value
    var final_faldax_fees_actual = faldax_fee_value; // Actual Faldax Fees
    var faldax_fees_offer = 0.0;
    var object = {};

    var offer_status = await checkOfferStatus.offerCodeStatus(req_body, false)
    console.log("offer_status", offer_status)
    offer_message = offer_status.message;

    if (offer_status.status == "truefalse") {

        // final_faldax_fees = 0.0;
        var current_order_faldax_fees = parseFloat(final_faldax_fees_actual) * parseFloat(calculate_offer_amount);
        if (parseFloat(offer_status.discount_values) < parseFloat(current_order_faldax_fees)) {
            var remaining_fees_fiat = parseFloat(current_order_faldax_fees) - parseFloat(offer_status.discount_values);
            var final_faldax_fees_crypto = remaining_fees_fiat / calculate_offer_amount;
            // var priceValue;
            faldax_fees_offer = parseFloat(final_faldax_fees_actual) - parseFloat(final_faldax_fees_crypto);
            // console.log("priceValue", priceValue)
        }
        object.faldax_fees_offer = faldax_fees_offer;
        object.final_faldax_fees_actual = final_faldax_fees_actual;
        console.log("object", object)
        return object;
    } else if (offer_status.status == true) {

        // object.priceValue = priceValue;
        object.faldax_fees_offer = faldax_fees_offer;
        object.final_faldax_fees_actual = final_faldax_fees_actual;
        console.log("object", object)
        return object;
    }

}

module.exports = {
    offerObject
}