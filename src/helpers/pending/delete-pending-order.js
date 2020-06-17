var PendingBookModel = require("../../models/PendingBook");

var deletePendingOrder = async (id) => {
    var now = new Date();

    // console.log("id", id)

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