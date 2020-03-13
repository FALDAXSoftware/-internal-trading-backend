var walletStatus = async (limitBuyOrder, wallet) => {
    if (limitBuyOrder.limit_price * limitBuyOrder.quantity <= wallet.placed_balance) {
        return true;
    } else {
        return false;
    }
}

module.exports = {
    walletStatus
}