var PendingOrderExecutionModel = require("../../models/PendingOrdersExecutuions");
var socketHelper = require("../sockets/emit-trades");

var cancelData = async (id) => {
    try {
        var getPendingData = await PendingOrderExecutionModel
            .query()
            .select()
            .where("id", id)
            .andWhere("is_cancel", false)
            .andWhere("is_executed", false)
            .andWhere("deleted_at", null)
            .orderBy("id", "DESC");

        // console.log("getPendingData", getPendingData)

        if (getPendingData.length > 0) {
            if (getPendingData[0].is_under_execution == false) {
                // console.lo
                if (getPendingData[0].order_type == "Market") {
                    return (8);
                }
                // console.log("id", id)
                var updateSql = `UPDATE pending_orders_execution
                                SET is_cancel = true
                                WHERE id = ${id} AND deleted_at IS NULL AND is_cancel = false
                                RETURNING *`
                var deletePending = await PendingOrderExecutionModel.knex().raw(updateSql);
                deletePending = deletePending.rows;
                // console.log("deletePending", deletePending)
                if (deletePending) {
                    var userId = [];
                    userId.push(deletePending[0].user_id)
                    let emit_socket = await socketHelper.emitTrades(deletePending[0].settle_currency, deletePending[0].currency, userId);
                    return (4)
                }
            } else {
                return (7);
            }
        } else {
            return (6);
        }
    } catch (err) {
        console.log(err);
    }
    // .andWhere("is_under_execution", false)
}

module.exports = {
    cancelData
}