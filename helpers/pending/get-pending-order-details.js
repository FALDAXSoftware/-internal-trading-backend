var PendingOrderModel = require("../../models/PendingBook");

var getPendingOrderDetails = async (id) => {

    var pendingOrderDetails = await PendingOrderModel
        .query()
        .select()
        .where('deleted_at', null)
        .orderBy('id', 'DESC');

    return pendingOrderDetails;
}

module.exports = {
    getPendingOrderDetails
}