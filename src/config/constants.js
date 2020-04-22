module.exports = {
	"SUCCESS_CODE": 200,
	"ACCEPTED_CODE": 202,
	"NO_RECORD": 204,

	"UNAUTHORIZED_CODE": 401,
	"FORBIDDEN_CODE": 403,
	"BAD_REQUEST_CODE": 400,

	"SERVER_ERROR_CODE": 500,
	"LIMIT_PER_PAGE": 10,

	"TRADE_BUY_BOOK_EVENT": "buy-book-data",
	"TRADE_SELL_BOOK_EVENT": "sell-book-data",
	"TRADE_TRADE_HISTORY_EVENT": "trade-history-data",
	"TRADE_CARD_EVENT": "card-data",
	"TRADE_DEPTH_CHART_EVENT": "depth-chart-data",
	"TRADE_INSTRUMENT_EVENT": "instrument-data",
	"TRADE_USERS_COMPLETED_ORDERS_EVENT": "users-completed-orders-data",
	"TRADE_USERS_PENDING_ORDERS_EVENT": "users-pending-orders-data",
	"TRADE_USERS_CANCELLED_ORDERS_EVENT": "users-cancelled-orders-data",
	"MARKET_VALUE_EVENT": "market_value",
	"USER_FAVOURITES_CARD_DATA_EVENT": "users-favourites-card-data",
	"USER_PORTFOLIO_DATA_EVENT": "users-portfolio-data",
	"USER_ACTIVITY_DATA_EVENT": "users-activity-data",
	"TRADE_USERS_COMPLETED_ORDERS_EVENT_FLAG": "users-completed-flag",
	"TRADE_GET_USERS_ALL_TRADE_DATA": "users-all-trade-data",
	"TRADE_USER_WALLET_BALANCE": "user-wallet-balance",
	"USER_LOGOUT":"user-logout",

	"SECRET_KEY": process.env.SECRET_KEY,
	"SECRET_IV": process.env.SECRET_IV

};