var Currency = require("./currency");
var SellWalletBalanceHelper = require("../helpers/wallet/get-sell-wallet-balance");
var MakerTakerFees = require("../helpers/wallet/get-maker-taker-fees");
var WalletBalanceChecking = require("./wallet-status");
var ActivityAdd = require("../helpers/activity/add");
var PendingAdd = require("./pending/add-pending-order");

var stopSellAdd = async (symbol, user_id, side, order_type, orderQuantity, limit_price, stop_price) => {
    let { crypto, currency } = await Currency.get_currencies(symbol);
    var now = new Date();
    var limitSellOrder = ({
        'user_id': user_id,
        'symbol': symbol,
        'side': side,
        'order_type': order_type,
        'maximum_time': moment(now)
            .add(1, 'years')
            .format(),
        'fill_price': 0.0,
        'limit_price': limit_price,
        'stop_price': stop_price,
        'price': 0.0,
        'quantity': orderQuantity,
        'settle_currency': crypto,
        'order_status': "open",
        'currency': currency
    });

    let wallet = await SellWalletBalanceHelper.getSellWalletBalance(crypto, currency, user_id);

    let fees = await MakerTakerFees.getFeesValue(crypto, currency);

    var resultData = {
        ...limitSellOrder
    }
    resultData.is_market = false;
    resultData.fix_quantity = orderQuantity;
    resultData.maker_fee = fees.makerFee;
    resultData.taker_fee = fees.takerFee;

    var resultPendng = await WalletBalanceChecking.walletStatus(limitSellOrder, wallet);

    if (resultPendng == true) {
        var result = await ActivityAdd.addActivityData(limitSellOrder);

        limitSellOrder.activity_id = result.id;
        var data = await PendingAdd.addPendingBook(limitSellOrder);

        // Emit Socket Here

        return data;
    } else {
        // Insufficient Balance
        return 1;
    }
}

module.exports = {
    stopSellAdd
}