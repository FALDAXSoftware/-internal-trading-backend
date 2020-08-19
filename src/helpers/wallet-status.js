var walletStatus = async (limitBuyOrder, wallet) => {
    if (limitBuyOrder.limit_price * limitBuyOrder.quantity <= wallet.placed_balance || limitBuyOrder.user_id == process.env.TRADEDESK_USER_ID) {
        return true;
    } else {
        return false;
    }
}

module.exports = {
    walletStatus
}