var latestPrice = require("./get-latest-price");

var offerObject = async (req_body, faldax_fee_value, flag) => {
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

    var final_faldax_fees = faldax_fee_value
    var final_faldax_fees_actual = faldax_fee_value; // Actual Faldax Fees
    var faldax_fees_offer = 0.0;
    var object = {};
}

module.exports = {
    offerObject
}