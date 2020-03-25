module.exports = function () {
	var get_decrypt_data = require("../services/getDecryptData");
	console.log("SECRED", process.env.JWT_TOKEN_SECRET);
	return get_decrypt_data(process.env.JWT_TOKEN_SECRET);
};