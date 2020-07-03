
exports.up = async function (knex) {
    // console.log("postgresql://" + (process.env.DB_USERNAME) + ":" + (process.env.DB_PASSWORD) + "@" + (process.env.DB_HOST) + "/" + (process.env.DB_DATABASE))
    // console.log("knex", knex)
    // Data types
    // await knex.raw(`DROP TYPE IF EXISTS language_lists; CREATE TYPE language_lists AS ENUM ('en', 'ja', 'es', 'uk', 'ru', 'zh')`);
    await knex.raw(`DROP TYPE IF EXISTS order_placed_by; CREATE TYPE order_placed_by AS ENUM ('user','third_party','bot','tradedesk_manual')`);
    // await knex.raw(`DROP TYPE IF EXISTS order_status; CREATE TYPE order_status AS ENUM ('open','filled','partially_filled','cancelled')`);
    // await knex.raw(`DROP TYPE IF EXISTS order_type; CREATE TYPE order_type AS ENUM ('StopLimit','Limit','Market')`);
    // await knex.raw(`DROP TYPE IF EXISTS side; CREATE TYPE side AS ENUM ('Buy','Sell')`);
    // await knex.raw(`DROP TYPE IF EXISTS transaction_from; CREATE TYPE transaction_from AS ENUM ('Warmwallet to Send','Send to Destination','Receiver to Warmwallet','Receive to Destination','Receive to Warmwallet','Residual Receive to Warmwallet','Residual Send to Warmwallet','Destination To Receive')`);
    // await knex.raw(`DROP TYPE IF EXISTS transaction_type; CREATE TYPE transaction_type AS ENUM ('send','receive','deposit','withdraw')`);

    // Tables
    return knex.schema
        .alterTable("activity_table", tbl => {
            tbl.string('placed_by');
            tbl.boolean("is_stop_limit").defaultTo(false)
        })
        .createTableIfNotExists("api_keys", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('user_id', "bigint");
            tbl.specificType('module', "json");
            tbl.specificType('api_key', "character varying");
            tbl.specificType('ip', "character varying");
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .alterTable("buy_book", tbl => {
            tbl.boolean("is_stop_limit").defaultTo(false)
            tbl.string('placed_by');
            tbl.boolean("is_checkbox_selected").defaultTo(false);
        })
        .alterTable("coins", tbl => {
            tbl.specificType("access_token_value", "character varying");
        })
        // .alterTable("currency_conversion", tbl => {
        //     tbl.specificType("coin_name", "character varying")
        //     tbl.specificType("original_value", "json");
        // })
        .createTableIfNotExists("kraken_users", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('user_id', "integer");
            tbl.specificType('secret', "character varying");
            tbl.specificType('key', "character varying");
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("layouts", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('dashboard_layout', "json");
            tbl.specificType('trade_layout', "json");
            tbl.specificType('user_id', "bigint");
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .alterTable("pairs", tbl => {
            tbl.specificType("crypto_minimum", "double precision").defaultTo(0);
            tbl.specificType("crypto_maximum", "double precision").defaultTo(0);
            tbl.specificType("order_maximum", "double precision").defaultTo(0);
            tbl.boolean('bot_status').defaultTo(false);
            tbl.specificType("price_precision", "integer")
            tbl.specificType("quantity_precision", "integer")
        })
        .alterTable("pending_book", tbl => {
            tbl.string('placed_by');
            tbl.boolean("is_stop_limit").defaultTo(false)
        })
        .createTableIfNotExists("pending_orders_execution", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
            tbl.specificType('limit_price', 'double precision');
            tbl.specificType('quantity', 'double precision');
            tbl.string('user_id').notNullable();
            tbl.specificType("avg_price", "double precision");
            tbl.string('currency');
            tbl.string('settle_currency');
            tbl.specificType('order_type', 'order_type');
            tbl.specificType('side', 'side');;
            tbl.string('symbol');
            tbl.string('placed_by');
            tbl.boolean("is_cancel").defaultTo(false);
            tbl.specificType("reason", "character varying")
            tbl.boolean("is_under_execution").defaultTo(false)
            tbl.boolean("is_executed").defaultTo(false)
        })
        // .alterTable("price_history", tbl => {
        //     tbl.specificType("market_snapshot", "json");
        //     tbl.specificType("type", "integer");

        // })
        .alterTable("roles", tbl => {
            tbl.specificType('allowed_pairs', "text");
        })
        .alterTable("tiers", tbl => {
            tbl.specificType("daily_withdraw_limit", "character varying");
            tbl.specificType("monthly_withdraw_limit", "character varying");
        })
        .alterTable("sell_book", tbl => {
            tbl.boolean("is_stop_limit").defaultTo(false)
            tbl.string('placed_by');
            tbl.boolean("is_checkbox_selected").defaultTo(false);
        })
        .createTableIfNotExists("shareable_layout", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('code', "character varying");
            tbl.specificType('layout_data', "json");
            tbl.specificType('user_id', "bigint");
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("tier_main_request", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('user_id', "bigint");
            tbl.specificType('user_status', "json");
            tbl.specificType('tier_step', "integer");
            tbl.boolean("approved")
            tbl.specificType('private_note', "text");
            tbl.specificType('public_note', "text");
            tbl.specificType('previous_tier', "integer");
            tbl.boolean("unlock_by_admin");
            tbl.specificType("updated_by", "character varying")
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .alterTable("trade_history", tbl => {
            tbl.specificType("trade_type", "integer");
            tbl.specificType("filled", "double precision");
            tbl.specificType("order_id", "character varying")
            tbl.specificType("execution_report", "json")
            tbl.specificType("payment_id", "character varying");
            tbl.specificType("quote_id", "character varying");
            tbl.specificType("simplex_payment_status", "integer")
            tbl.specificType("transaction_id", "text")
            tbl.specificType("address", "character varying");
            tbl.specificType("placed_by", "order_placed_by")
            tbl.specificType("fiat_values", "json");
            tbl.specificType("txn_group_id", "json");
            tbl.boolean("is_stop_limit").defaultTo(false);
        })
        .alterTable("users", tbl => {
            tbl.boolean("is_tradedesk_user").defaultTo(false);
            tbl.specificType("account_verified_at", "timestamp without time zone");
            tbl.boolean("is_institutional_account").defaultTo(false).notNullable();
        })
        .alterTable("wallet_history", tbl => {
            tbl.specificType("fiat_values", "json")
        })
        .alterTable("withdraw_request", tbl => {
            tbl.specificType("fiat_values", "json")
        })
}

exports.down = knex => knex.schema.dropTableIfExists("todo");

