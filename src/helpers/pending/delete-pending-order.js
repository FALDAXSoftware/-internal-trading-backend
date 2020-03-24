var PendingBookModel = require("../../models/PendingBook");

var deletePendingOrder = async (id) => {
    var now = Date.now();

    await PendingBookModel
        .query()
        .where('deleted_at', null)
        .andWhere('id', id)
        .patch({
            deleted_at: now
        });
}

module.exports = {
    deletePendingOrder
}