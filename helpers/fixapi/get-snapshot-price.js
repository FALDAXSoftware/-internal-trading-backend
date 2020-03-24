const request = require('request');
var MarketSnapshotPriceModel = require("../../models/MarketSnapshotPrices");

var priceValue = async (symbol, side, order_quantity, flag, type_of) => {
    var md_entry_type = (side == "Buy" ? 1 : 0)
    request({
        url: process.env.JST_MARKET_URL + '/Market/GetQuoteSnapshot?symbol=' + symbol + '&mdEntyType=' + md_entry_type,
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        json: true
    }, async function (err, httpResponse, body) {
        try {
            if (err) {
                return (err);
            }
            if (body.error) {
                return (body);
            }
            let object_data = {
                symbol: body.Symbol,
                target_sub_id: body.TargetSubID,
                md_req_id: body.MDReqID,
                product: body.Product,
                maturity_date: body.MaturityDate,
                md_entries: { MDEntries: body.MDEntries },
                limit_price: 0.0,
                type_of: (type_of == "create_order" ? "order" : "check")
            };

            await MarketSnapshotPriceModel
                .query()
                .insert({
                    ...object_data
                })

            var ask_price = bid_size = limit_price = 0.0;

            var response_data = [{
                coin: body.Symbol,
                ask_price: 0.0,
                ask_size: 0.0,
                bid_price: 0.0,
                bid_size: 0.0,
            }]
            var total = 0.0;
            var MDEntries = body.MDEntries;

            var total_sell = 0.0;
            var calculate_quantity = 0.0;

            if (MDEntries.length > 0) {
                var last_price = 0;
                for (var i = 0; i < MDEntries.length; i++) {
                    if (side == "Buy") {
                        if (MDEntries[i].MDEntryType == 1 || MDEntries[i].MDEntryType == "1") {
                            if (flag == 1 || flag == "1") { // BTC Editable

                                if (i == 0) {
                                    calculate_quantity = parseFloat(order_quantity) / MDEntries[i].MDEntryPx;
                                }

                                total_sell = calculate_quantity - parseFloat(MDEntries[i].MDEntrySize);
                                total += parseFloat(MDEntries[i].MDEntrySize);
                                if (total > calculate_quantity) {
                                    // if( parseFloat(MDEntries[i].MDEntrySize) > parseFloat(order_quantity) ){
                                    response_data[0].ask_price = MDEntries[i].MDEntryPx;
                                    response_data[0].limit_price = MDEntries[i].MDEntryPx;
                                    break;
                                }
                                last_price = MDEntries[i].MDEntryPx;

                                response_data[0].ask_price = last_price;
                                response_data[0].limit_price = last_price;

                            } else {
                                total += parseFloat(MDEntries[i].MDEntrySize);
                                // if( parseFloat(MDEntries[i].MDEntrySize) > parseFloat(order_quantity) ){
                                if (total > parseFloat(order_quantity)) {
                                    response_data[0].ask_price = MDEntries[i].MDEntryPx;
                                    response_data[0].limit_price = MDEntries[i].MDEntryPx;
                                    break;
                                }
                                last_price = MDEntries[i].MDEntryPx;
                                response_data[0].ask_price = last_price;
                                response_data[0].limit_price = last_price;

                            }

                        }
                    }
                    if (side == "Sell") {
                        if (MDEntries[i].MDEntryType == 0 || MDEntries[i].MDEntryType == "0") {
                            if (flag == 2 || flag == "2") { // BTC Editable
                                if (i == 0) {
                                    calculate_quantity = parseFloat(order_quantity) / MDEntries[i].MDEntryPx;
                                }
                                total_sell = calculate_quantity - parseFloat(MDEntries[i].MDEntrySize);
                                total += parseFloat(MDEntries[i].MDEntrySize);
                                if (total > calculate_quantity) {
                                    // if( parseFloat(MDEntries[i].MDEntrySize) > parseFloat(order_quantity) ){
                                    response_data[0].bid_price = MDEntries[i].MDEntryPx;
                                    response_data[0].limit_price = MDEntries[i].MDEntryPx;
                                    break;
                                }
                                last_price = MDEntries[i].MDEntryPx;
                                response_data[0].bid_price = last_price;
                                response_data[0].limit_price = last_price;

                            } else {
                                total += parseFloat(MDEntries[i].MDEntrySize);
                                // if( parseFloat(MDEntries[i].MDEntrySize) > parseFloat(order_quantity) ){
                                if (total > parseFloat(order_quantity)) {
                                    response_data[0].bid_price = MDEntries[i].MDEntryPx;
                                    response_data[0].limit_price = MDEntries[i].MDEntryPx;
                                    break;
                                }
                                last_price = MDEntries[i].MDEntryPx;
                                response_data[0].bid_price = last_price;
                                response_data[0].limit_price = last_price;

                            }
                        }
                    }
                }
            }

        } catch (error) {
            return error
        }
    })
}

module.exports = {
    priceValue
}