
exports.up = function (knex) {
    // console.log("postgresql://" + (process.env.DB_USERNAME) + ":" + (process.env.DB_PASSWORD) + "@" + (process.env.DB_HOST) + "/" + (process.env.DB_DATABASE))
    // console.log("knex", knex)
    return knex.schema
        .createTableIfNotExists("account_class", tbl => {
            tbl.increments('id').primary();
            tbl.string('class_name');
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("activity_table", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
            tbl.specificType('maximum_time', 'timestamp without time zone')
            tbl.specificType('fill_price', 'double precision');
            tbl.specificType('limit_price', 'double precision');
            tbl.specificType('stop_price', 'double precision');
            tbl.specificType('price', 'double precision');
            tbl.specificType('quantity', 'double precision');
            tbl.string('user_id').notNullable();
            tbl.string('currency');
            tbl.string('settle_currency');
            tbl.boolean('working_indicator').defaultTo(false);
            tbl.specificType('order_type', 'order_type');
            tbl.specificType('order_status', 'order_status');
            tbl.specificType('time', 'timestamp without time zone');
            tbl.specificType('side', 'side');
            tbl.boolean('is_partially_fulfilled').defaultTo(false);
            tbl.specificType('fix_quantity', 'double precision');
            tbl.string('symbol');
            tbl.specificType('maker_fee', 'double precision');
            tbl.specificType('taker_fee', 'double precision');
            tbl.string('requested_user_id');
            tbl.boolean('is_market').defaultTo(false);
            tbl.boolean('is_cancel').defaultTo(false);
            tbl.string('placed_by');
        })
        .createTableIfNotExists("admin", tbl => {
            tbl.increments('id').primary();
            tbl.specificType("email", "character varying").notNullable();
            tbl.specificType("password", "character varying").notNullable();
            tbl.specificType("first_name", "character varying");
            tbl.specificType("last_name", "character varying");
            tbl.specificType("phone_number", "character varying");
            tbl.specificType("address", "character varying");
            tbl.boolean("is_twofactor").defaultTo(false);
            tbl.specificType("twofactor_secret", "character varying");
            tbl.specificType("auth_code", "character varying");
            tbl.specificType("reset_token", "character varying");
            tbl.specificType("whitelist_ip", "character varying");
            tbl.specificType('created_at', 'timestamp without time zone');
            tbl.specificType('deleted_at', 'timestamp without time zone');
            tbl.specificType('updated_at', 'timestamp without time zone');
            tbl.boolean("add_user").defaultTo(false);
            tbl.boolean("is_active").defaultTo(false);
            tbl.specificType('role_id', 'bigint')
            tbl.boolean("is_whitelist_ip");
        })
        .createTableIfNotExists("admin_permissions", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('role_id', "character varying");
            tbl.specificType('permission_id', "character varying");
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("admin_settings", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('name', "character varying");
            tbl.specificType('slug', "character varying");
            tbl.specificType('value', "character varying");
            tbl.specificType('type', "character varying");
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("announcments", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('name', "character varying");
            tbl.specificType('title', "character varying");
            tbl.specificType('slug', "character varying");
            tbl.specificType('content', "character varying");
            tbl.boolean("is_active").defaultTo(true);
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
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
        .createTableIfNotExists("batch_history", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('batch_number', "integer");
            tbl.specificType('transaction_start', "integer");
            tbl.specificType('transaction_end', "integer");
            // tbl.specificType('content', "character varying");
            tbl.boolean("is_purchased").defaultTo(false);
            tbl.boolean("is_withdrawled").defaultTo(false);
            tbl.boolean("is_manual_withdrawled").defaultTo(false)
            tbl.specificType("net_profit", "double precision").defaultTo(0);
            tbl.specificType("download_file", "character varying")
            tbl.specificType("uploaded_file", "character varying");
            tbl.boolean("is_active").defaultTo(true);
            tbl.specificType('batch_date', 'timestamp without time zone')
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("blog_comments", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('user_id', "bigint");
            tbl.specificType('blog_id', "bigint");
            tbl.specificType('comment', "character varying");
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("blogs", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('search_keywords', "character varying");
            tbl.specificType('description', "character varying");
            tbl.specificType('title', "character varying");
            tbl.specificType("cover_image", "character varying")
            tbl.specificType("tags", "character varying")
            tbl.boolean("is_featured");
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("buy_book", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
            tbl.specificType('maximum_time', 'timestamp without time zone')
            tbl.specificType('fill_price', 'double precision');
            tbl.specificType('limit_price', 'double precision');
            tbl.specificType('stop_price', 'double precision');
            tbl.specificType('price', 'double precision');
            tbl.specificType('quantity', 'double precision');
            tbl.string('user_id').notNullable();
            tbl.specificType("avg_price", "double precision");
            tbl.string('currency');
            tbl.string('settle_currency');
            tbl.boolean('working_indicator').defaultTo(false);
            tbl.specificType('order_type', 'order_type');
            tbl.specificType('order_status', 'order_status');
            tbl.specificType('time', 'timestamp without time zone');
            tbl.specificType('side', 'side');
            tbl.boolean('is_partially_fulfilled').defaultTo(false);
            tbl.specificType('fix_quantity', 'double precision');
            tbl.string('symbol');
            tbl.boolean("is_stop_limit").defaultTo(false)
            tbl.specificType('maker_fee', 'double precision');
            tbl.specificType('taker_fee', 'double precision');
            tbl.string('requested_user_id');
            tbl.specificType("activity_id", "bigint");
            tbl.string('placed_by');
            tbl.boolean("is_checkbox_selected").defaultTo(false);
        })
        .createTableIfNotExists("campaigns", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('label', "character varying");
            tbl.specificType('description', "character varying");
            tbl.specificType('no_of_transactions', "double precision");
            tbl.specificType("fees_allowed", "double precision")
            tbl.specificType("start_date", "character varying")
            tbl.specificType("end_date", "character varying");
            tbl.specificType("usage", "double precision")
            tbl.boolean("is_active").defaultTo(true);
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("campaigns_offers", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('code', "character varying");
            tbl.specificType('campaign_id', "bigint");
            tbl.specificType('user_id', "bigint");
            tbl.specificType("description", "character varying")
            tbl.specificType("no_of_transactions", "bigint")
            tbl.specificType("fees_allowed", "character varying");
            tbl.specificType("usage", "double precision")
            tbl.boolean("is_default_values").defaultTo(true);
            tbl.boolean("is_active").defaultTo(true)
            tbl.specificType("start_date", "character varying");
            tbl.specificType("end_date", "character varying");
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("coins", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('coin_icon', "character varying");
            tbl.specificType('coin_name', "character varying");
            tbl.specificType('min_thresold', "double precision").defaultTo(0);
            tbl.specificType("jst_min_coin_limit", "double precision").defaultTo(0)
            tbl.specificType("coin_precision", "double precision");
            tbl.specificType("coin_code", "character varying");
            tbl.specificType("coin", "character varying");
            tbl.specificType("min_limit", "double precision").defaultTo(0);
            tbl.specificType("max_limit", "double precision").defaultTo(0);
            tbl.specificType("deposit_method", "character varying");
            tbl.specificType("kraken_coin_name", "character varying");
            tbl.boolean("iserc").defaultTo(false);
            tbl.boolean("is_address_created_signup").defaultTo(false);
            tbl.boolean("is_simplex_supported").defaultTo(false);
            tbl.boolean("is_jst_supported").defaultTo(false);
            tbl.specificType("hot_send_wallet_address", "character varying")
            tbl.specificType("hot_receive_wallet_address", "character varying");
            tbl.specificType("warm_wallet_address", "character varying");
            tbl.specificType("custody_wallet_address", "character varying");
            tbl.boolean("is_active").defaultTo(true);
            tbl.specificType("wallet_address", "character varying")
            tbl.boolean("is_fiat").defaultTo(false);
            tbl.specificType("type", "integer").defaultTo(1);
            tbl.specificType("access_token_value", "character varying");
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("countries", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('name', "character varying");
            tbl.specificType('legality', "integer").defaultTo(1);
            tbl.specificType('color', "character varying");
            tbl.boolean("is_active").defaultTo(false);
            tbl.specificType("sortname", "character varying")
            tbl.specificType("phonecode", "character varying");
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("currency_conversion", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('coin_id', "bigint");
            tbl.specificType('symbol', "character varying");
            tbl.specificType('quote', "json");
            tbl.specificType("coin_name", "character varying")
            tbl.specificType("original_value", "json");
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("email_template", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('name', "character varying");
            tbl.specificType('content', "character varying");
            tbl.specificType('slug', "character varying");
            tbl.specificType("note", "character varying")
            tbl.specificType("all_content", "json").defaultTo('{}');
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("email_template12", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('name', "character varying");
            tbl.specificType('content', "character varying");
            tbl.specificType('slug', "character varying");
            tbl.specificType("note", "character varying")
            tbl.specificType("all_content", "json").defaultTo('{}');
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("fees", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('trade_volume', "character varying");
            tbl.specificType('maker_fee', "double precision");
            tbl.specificType('taker_fee', "double precision");
            tbl.specificType("referral_amt", "double precision");
            tbl.specificType("min_trade_volume", "double precision");
            tbl.specificType("max_trade_volume", "double precision");
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("ip_whitelist", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('ip', "character varying");
            tbl.specificType('user_id', "bigint");
            tbl.specificType('user_type', "integer");
            tbl.specificType("days", "integer");
            tbl.specificType("expire_time", "character varying");
            tbl.boolean("is_permanent").defaultTo();
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("job_applications", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('first_name', "character varying");
            tbl.specificType('last_name', "character varying");
            tbl.specificType('email', "character varying");
            tbl.specificType("phone_number", "character varying");
            tbl.specificType("location", "character varying");
            tbl.specificType("linkedin_profile", "character varying");
            tbl.specificType("website_url", "character varying")
            tbl.specificType("resume", "character varying").defaultTo('');
            tbl.specificType("cover_letter", "character varying").defaultTo('');
            tbl.specificType("job_id", "integer")
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("job_category", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('category', "character varying");
            tbl.boolean('is_active').defaultTo(false);
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("jobs", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('position', "character varying");
            tbl.specificType('short_desc', "character varying");
            tbl.specificType('job_desc', "character varying");
            tbl.specificType('location', "character varying");
            tbl.specificType('category_id', "bigint");
            tbl.boolean('is_active').defaultTo(true);
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("jst_pair", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('original_pair', "character varying");
            tbl.specificType('order_pair', "character varying");
            tbl.specificType('crypto', "character varying");
            tbl.specificType('currency', "character varying");
            tbl.specificType("jst_min_limit", "double precision").defaultTo(0);
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("jst_trade_history", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
            tbl.specificType('fill_price', 'double precision');
            tbl.specificType('price', 'double precision');
            tbl.string('currency');
            tbl.string('settle_currency');
            tbl.specificType('side', 'side');
            tbl.specificType('order_type', 'order_type');
            tbl.specificType('order_status', 'order_status');
            tbl.boolean("deleted")
            tbl.boolean('is_partially_fulfilled').defaultTo(false);
            tbl.specificType('fix_quantity', 'double precision');
            tbl.string('user_id').notNullable();
            tbl.string('symbol');
            tbl.boolean("is_collected");
            tbl.specificType("filled", "double precision");
            tbl.specificType("order_id", "character varying");
            tbl.specificType("execution_report", "json").defaultTo('{}');
            tbl.specificType("exec_id", "character varying");
            tbl.specificType("transact_time", "timestamp without time zone");
            tbl.specificType("settl_date", "date");
            tbl.specificType("trade_date", "date")
            tbl.specificType("settl_curr_amt", "double precision");
            tbl.specificType("leaves_qty", "double precision");
            tbl.specificType("faldax_fees", "double precision");
            tbl.specificType("faldax_fees_actual", "double precision");
            tbl.specificType("network_fees", "double precision");
            tbl.specificType('amount_after_fees_deduction', 'double precision');
            tbl.specificType("asset1_usd_value", "double precision");
            tbl.specificType('asset2_usd_value', 'double precision');
            tbl.specificType("reason", "text")
            tbl.specificType("cl_order_id", "integer");
            tbl.specificType("campaign_id", "bigint");
            tbl.specificType("campaign_offer_id", "bigint");
            tbl.specificType("offer_message", "character varying");
            tbl.specificType("offer_code", "character varying");
            tbl.boolean("offer_applied")
            tbl.specificType('limit_price', 'double precision');
            tbl.specificType("buy_currency_amount", "double precision");
            tbl.specificType("sell_currency_amount", "double precision");
            tbl.specificType("difference_faldax_commission", "double precision");
            tbl.specificType("subtotal", "double precision");
        })
        .createTableIfNotExists("kraken_users", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('user_id', "integer");
            tbl.specificType('secret', "character varying");
            tbl.specificType('key', "character varying");
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("kyc", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('user_id', "integer");
            tbl.specificType('first_name', "character varying(30)");
            tbl.specificType('last_name', "character varying(30)");
            tbl.specificType("phone_number", "character varying");
            tbl.specificType("country", "character varying(30)");
            tbl.specificType("state", "character varying");
            tbl.specificType("dob", "character varying(15)");
            tbl.specificType("address", "character varying(200)");
            tbl.specificType("address_2", "character varying");
            tbl.specificType("city", "character varying(30)");
            tbl.specificType("zip", "character varying(50)");
            tbl.specificType("front_doc", "character varying");
            tbl.specificType("back_doc", "character varying");
            tbl.specificType("ssn", "character varying");
            tbl.specificType("result", "character varying");
            tbl.specificType("user_id", "bigint");
            tbl.specificType("steps", "integer")
            tbl.specificType("direct_response", "character varying");
            tbl.specificType("webhook_response", "character varying");
            tbl.specificType("mtid", "character varying");
            tbl.specificType("comments", "character varying");
            tbl.boolean("is_approve").defaultTo(false)
            tbl.boolean("status");
            tbl.specificType("country_code", "character varying");
            tbl.specificType("id_type", "numeric");
            tbl.specificType("kyc_doc_details", "character varying");
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
        .createTableIfNotExists("login_history", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('ip', "character varying");
            tbl.specificType('device_token', "character varying");
            tbl.specificType("device_type", "integer");
            tbl.specificType('jwt_token', "character varying");
            tbl.boolean("is_logged_in").defaultTo(true);
            tbl.specificType('user_id', "bigint");
            tbl.specificType('created_at', 'timestamp without time zone');
            tbl.specificType('deleted_at', 'timestamp without time zone');
            tbl.specificType('updated_at', 'timestamp without time zone');
        })
        .createTableIfNotExists("market_snapshot_prices", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('symbol', "character varying");
            tbl.specificType('target_sub_id', "character varying");
            tbl.specificType("product", "character varying");
            tbl.specificType('md_req_id', "character varying");
            tbl.specificType('maturity_date', "character varying");
            tbl.specificType("md_entries", "json");
            tbl.specificType('type_of', "character varying");
            tbl.specificType('created_at', 'timestamp without time zone');
            tbl.specificType('deleted_at', 'timestamp without time zone');
            tbl.specificType('updated_at', 'timestamp without time zone');
        })
        .createTableIfNotExists("news", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('title', "character varying");
            tbl.specificType('search_keywords', "character varying");
            tbl.specificType("description", "text");
            tbl.specificType('cover_image', "character varying");
            tbl.specificType('posted_at', 'timestamp without time zone');
            tbl.specificType('owner', "character varying");
            tbl.specificType('link', "character varying");
            tbl.boolean("is_active").defaultTo(true)
            tbl.specificType("owner_id", "bigint")
            tbl.specificType('created_at', 'timestamp without time zone');
            tbl.specificType('deleted_at', 'timestamp without time zone');
            tbl.specificType('updated_at', 'timestamp without time zone');
        })
        .createTableIfNotExists("news_source", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('source_name', "character varying");
            tbl.specificType('slug', "character varying");
            tbl.boolean("is_active").defaultTo(true)
            tbl.specificType('created_at', 'timestamp without time zone');
            tbl.specificType('deleted_at', 'timestamp without time zone');
            tbl.specificType('updated_at', 'timestamp without time zone');
        })
        .createTableIfNotExists("notifications", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('title', "character varying");
            tbl.specificType('title_jas', "character varying");
            tbl.specificType('slug', "character varying");
            tbl.boolean("is_necessary").defaultTo(false)
            tbl.specificType('created_at', 'timestamp without time zone');
            tbl.specificType('deleted_at', 'timestamp without time zone');
            tbl.specificType('updated_at', 'timestamp without time zone');
        })
        .createTableIfNotExists("pairs", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('name', "character varying");
            tbl.specificType('coin_code1', "character varying");
            tbl.specificType('coin_code2', "character varying");
            tbl.specificType("maker_fee", "double precision");
            tbl.specificType("taker_fee", "double precision");
            tbl.boolean("is_active").defaultTo(true);
            tbl.specificType('symbol', "character varying");
            tbl.specificType('kraken_pair', "character varying");
            tbl.specificType("ask_price", "double precision");
            tbl.specificType("bid_price", "double precision");
            tbl.specificType("crypto_minimum", "double precision").defaultTo(0);
            tbl.specificType("crypto_maximum", "double precision").defaultTo(0);
            tbl.specificType("order_maximum", "double precision").defaultTo(0);
            tbl.boolean('bot_status').defaultTo(false);
            tbl.specificType("price_precision", "integer")
            tbl.specificType("quantity_precision", "integer")
            tbl.specificType('created_at', 'timestamp without time zone');
            tbl.specificType('deleted_at', 'timestamp without time zone');
            tbl.specificType('updated_at', 'timestamp without time zone');
        })
        .createTableIfNotExists("panic_history", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('ip', "character varying");
            tbl.boolean("panic_status").defaultTo(false);
            tbl.specificType('created_at', 'timestamp without time zone');
            tbl.specificType('deleted_at', 'timestamp without time zone');
            tbl.specificType('updated_at', 'timestamp without time zone');
        })
        .createTableIfNotExists("pending_book", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
            tbl.specificType('maximum_time', 'timestamp without time zone')
            tbl.specificType('fill_price', 'double precision');
            tbl.specificType('limit_price', 'double precision');
            tbl.specificType('stop_price', 'double precision');
            tbl.specificType('price', 'double precision');
            tbl.specificType('quantity', 'double precision');
            tbl.string('user_id').notNullable();
            tbl.specificType("avg_price", "double precision");
            tbl.string('currency');
            tbl.string('settle_currency');
            tbl.boolean('working_indicator').defaultTo(false);
            tbl.specificType('order_type', 'order_type');
            tbl.specificType('order_status', 'order_status');
            tbl.specificType('time', 'timestamp without time zone');
            tbl.specificType('side', 'side');
            tbl.boolean('is_partially_fulfilled').defaultTo(false);
            tbl.specificType('fix_quantity', 'double precision');
            tbl.string('symbol');
            tbl.specificType('maker_fee', 'double precision');
            tbl.specificType('taker_fee', 'double precision');
            tbl.string('requested_user_id');
            tbl.specificType("activity_id", "bigint");
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
        })
        .createTableIfNotExists("price_history", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('coin', "character varying");
            tbl.specificType('ask_price', 'double precision');
            tbl.specificType('bid_price', 'double precision');
            tbl.specificType('ask_size', 'double precision');
            tbl.specificType('bid_size', 'double precision');
            tbl.specificType("market_snapshot", "json");
            tbl.specificType("type", "integer");
            tbl.specificType('created_at', 'timestamp without time zone');
            tbl.specificType('deleted_at', 'timestamp without time zone');
            tbl.specificType('updated_at', 'timestamp without time zone');
        })
        .createTableIfNotExists("referral", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('coin_name', "character varying");
            tbl.specificType('txid', "character varying");
            tbl.specificType('amount', 'double precision');
            tbl.specificType('user_id', 'bigint');
            tbl.specificType('coin_id', 'bigint');
            tbl.specificType("referred_user_id", "bigint");
            tbl.boolean("is_collected").defaultTo(false);
            tbl.specificType('created_at', 'timestamp without time zone');
            tbl.specificType('deleted_at', 'timestamp without time zone');
            tbl.specificType('updated_at', 'timestamp without time zone');
        })
        .createTableIfNotExists("residual_transactions", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('source_address', "character varying");
            tbl.specificType('destination_address', "character varying");
            tbl.specificType('amount', 'double precision');
            tbl.specificType('user_id', 'bigint');
            tbl.specificType('transaction_type', 'character varying');
            tbl.specificType("coin_id", "bigint");
            tbl.boolean("is_executed").defaultTo(false);
            tbl.specificType('created_at', 'timestamp without time zone');
            tbl.specificType('deleted_at', 'timestamp without time zone');
            tbl.specificType('updated_at', 'timestamp without time zone');
            tbl.boolean("is_admin").defaultTo(false);
            tbl.specificType("transaction_id", "character varying");
            tbl.specificType("faldax_fee", "double precision")
            tbl.specificType("estimated_network_fees", "double precision").defaultTo(0);
            tbl.specificType("actual_network_fees", "double precision")
            tbl.specificType("actual_amount", "double precision")
            tbl.boolean("is_done").defaultTo(false);
            tbl.specificType("sender_user_balance_before", "double precision").defaultTo(0)
            tbl.specificType("receiver_user_balance_before", "double precision").defaultTo(0);
            tbl.specificType("warm_wallet_balance_before", "double precision").defaultTo(0)
            tbl.specificType("residual_amount", "double precision")
            tbl.specificType("transaction_from", "transaction_from")
        })
        .createTableIfNotExists("role_permissions", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('module_name', "character varying");
            tbl.specificType('route_name', "character varying");
            tbl.specificType('display_name', "character varying");
            tbl.specificType('main_module', "character varying");
            tbl.specificType('sub_module_name', "character varying");
            tbl.specificType('created_at', 'timestamp without time zone');
            tbl.specificType('deleted_at', 'timestamp without time zone');
            tbl.specificType('updated_at', 'timestamp without time zone');
        })
        .createTableIfNotExists("roles", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('name', "character varying");
            tbl.specificType('allowed_pairs', "text");
            tbl.specificType('created_at', 'timestamp without time zone');
            tbl.specificType('deleted_at', 'timestamp without time zone');
            tbl.specificType('updated_at', 'timestamp without time zone');
            tbl.boolean("users").defaultTo(false);
            tbl.boolean("assets").defaultTo(false);
            tbl.boolean("roles").defaultTo(false);
            tbl.boolean("is_active").defaultTo(true);
            tbl.boolean("countries").defaultTo(false);
            tbl.boolean("employee").defaultTo(false);
            tbl.boolean("pairs");
            tbl.boolean("limit_management");
            tbl.boolean("transaction_history");
            tbl.boolean("trade_history");
            tbl.boolean("withdraw_requests");
            tbl.boolean("dashboard").defaultTo(true);
            tbl.boolean("jobs");
            tbl.boolean("kyc");
            tbl.boolean("fees");
            tbl.boolean("panic_button");
            tbl.boolean("news");
            tbl.boolean("is_referral");
            tbl.boolean("add_user").defaultTo(true);
            tbl.boolean("account_class");
            tbl.boolean("email_templates");
            tbl.boolean("news_source");
            tbl.boolean("two_factor_requests").defaultTo(false);
            tbl.boolean("notifications").defaultTo(false);
            tbl.boolean("wallet_dashboard").defaultTo(false);
            tbl.boolean("batch_and_balance").defaultTo(false);
            tbl.boolean("tiers");
            tbl.boolean("simplex_token");
            tbl.boolean("network_fee");
            tbl.boolean("offers");
        })
        .createTableIfNotExists("sell_book", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
            tbl.specificType('maximum_time', 'timestamp without time zone')
            tbl.specificType('fill_price', 'double precision');
            tbl.specificType('limit_price', 'double precision');
            tbl.specificType('stop_price', 'double precision');
            tbl.specificType('price', 'double precision');
            tbl.specificType('quantity', 'double precision');
            tbl.string('user_id').notNullable();
            tbl.specificType("avg_price", "double precision");
            tbl.string('currency');
            tbl.string('settle_currency');
            tbl.boolean('working_indicator').defaultTo(false);
            tbl.specificType('order_type', 'order_type');
            tbl.specificType('order_status', 'order_status');
            tbl.specificType('time', 'timestamp without time zone');
            tbl.specificType('side', 'side');
            tbl.boolean('is_partially_fulfilled').defaultTo(false);
            tbl.specificType('fix_quantity', 'double precision');
            tbl.string('symbol');
            tbl.boolean("is_stop_limit").defaultTo(false)
            tbl.specificType('maker_fee', 'double precision');
            tbl.specificType('taker_fee', 'double precision');
            tbl.string('requested_user_id');
            tbl.specificType("activity_id", "bigint");
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
        .createTableIfNotExists("simplex_trade_history", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
            tbl.specificType("payment_id", "character varying")
            tbl.specificType("quote_id", "character varying")
            tbl.specificType('fill_price', 'double precision');
            tbl.specificType('price', 'double precision');
            tbl.specificType('quantity', 'double precision');
            tbl.specificType('user_id', "bigint").notNullable();
            tbl.string('currency');
            tbl.string('settle_currency');
            tbl.specificType('order_type', 'order_type');
            tbl.specificType('order_status', 'order_status');
            tbl.specificType('side', 'side');
            tbl.string('symbol');
            tbl.specificType("simplex_payment_status", "integer")
            tbl.specificType("trade_type", "integer")
            tbl.specificType("address", "character varying");
            tbl.boolean("is_processed").defaultTo(false)
        })
        .createTableIfNotExists("sms_template", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('slug', "character varying");
            tbl.specificType('name', "character varying");
            tbl.specificType('content', "character varying");
            tbl.specificType('note', "character varying");
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("states", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('country_id', "bigint");
            tbl.specificType('name', "character varying(100)");
            tbl.specificType('legality', "integer").defaultTo(1);
            tbl.specificType('color', "character varying");
            tbl.boolean("is_active").defaultTo(true)
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("statics", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('title', "character varying");
            tbl.specificType('content', "character varying");
            tbl.specificType('name', "character varying(50)");
            tbl.specificType('slug', "character varying");
            tbl.boolean("is_active")
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("statics", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('email', "character varying");
            tbl.boolean("is_news_feed")
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("temp_coinmarketcap", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('price', "character varying");
            tbl.specificType('market_cap', "character varying");
            tbl.specificType('percent_change_1h', "character varying");
            tbl.specificType("percent_change_24h", "character varying")
            tbl.specificType("percent_change_7d", "character varying");
            tbl.specificType('volume_24h', "character varying");
            tbl.specificType("coin", "character varying")
            tbl.specificType("coin_new", "character varying");
            tbl.specificType('last_updated', 'timestamp without time zone')
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("thresold_prices", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('symbol', "character varying");
            tbl.specificType('quote', "json");
            tbl.specificType('coin_id', "bigint");
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("tier_limit", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('daily_withdraw_crypto', "double precision");
            tbl.specificType('daily_withdraw_fiat', "double precision");
            tbl.specificType('coin_id', "bigint");
            tbl.specificType('min_withdrawl_crypto', "double precision");
            tbl.specificType('min_withdrawl_fiat', "double precision");
            tbl.specificType('tier_step', "double precision");
            tbl.specificType('monthly_withdraw_crypto', "double precision");
            tbl.specificType('monthly_withdraw_fiat', "double precision");
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
        .createTableIfNotExists("tier_request", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('tier_step', "integer");
            tbl.specificType('request_id', "bigint");
            tbl.specificType("unique_key", "character varying")
            tbl.boolean("is_approved")
            tbl.specificType('ssn', "character varying");
            tbl.specificType('private_note', "character varying");
            tbl.specificType('public_note', "text");
            tbl.specificType('updated_by', "character varying")
            tbl.specificType('type', "character varying");
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("tiers", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('tier_step', "integer");
            tbl.specificType('minimum_activity_thresold', "json");
            tbl.specificType('requirements', "json");
            tbl.specificType("requirements_two", "json")
            tbl.specificType("daily_withdraw_limit", "character varying");
            tbl.specificType("monthly_withdraw_limit", "character varying")
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("trade_history", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
            tbl.specificType('maximum_time', 'timestamp without time zone')
            tbl.specificType('fill_price', 'double precision');
            tbl.specificType('limit_price', 'double precision');
            tbl.specificType('stop_price', 'double precision');
            tbl.specificType('price', 'double precision');
            tbl.specificType('quantity', 'double precision');
            tbl.string('currency');
            tbl.specificType("average_price", "double precision");
            tbl.string('settle_currency');
            tbl.specificType('order_type', 'order_type');
            tbl.specificType('order_status', 'order_status');
            tbl.specificType('side', 'side');
            tbl.boolean("deleted")
            tbl.specificType("requested_user_id", "bigint")
            tbl.boolean('is_partially_filled');
            tbl.specificType('fix_quantity', 'double precision');
            tbl.string('symbol');
            tbl.specificType('maker_fee', 'double precision');
            tbl.specificType('taker_fee', 'double precision');
            tbl.specificType('user_id', "bigint");
            tbl.specificType("user_fee", "double precision")
            tbl.specificType("user_coin", "character varying")
            tbl.specificType("requested_fee", "double precision")
            tbl.specificType("requested_coin", "character varying")
            tbl.boolean('is_collected').defaultTo(false);
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
        .createTableIfNotExists("transaction_table", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('source_address', "character varying");
            tbl.specificType('destination_address', "character varying");
            tbl.specificType('amount', 'double precision');
            tbl.specificType('user_id', 'bigint');
            tbl.boolean("is_executed").defaultTo(false);
            tbl.specificType('transaction_type', 'character varying');
            tbl.specificType("coin_id", "bigint");
            tbl.specificType('created_at', 'timestamp without time zone');
            tbl.specificType('deleted_at', 'timestamp without time zone');
            tbl.specificType('updated_at', 'timestamp without time zone');
            tbl.boolean("is_admin").defaultTo(false);
            tbl.specificType("transaction_id", "character varying");
            tbl.specificType("faldax_fee", "double precision")
            tbl.specificType("estimated_network_fees", "double precision").defaultTo(0);
            tbl.specificType("actual_network_fees", "double precision")
            tbl.specificType("actual_amount", "double precision")
            tbl.boolean("is_done").defaultTo(false);
            tbl.specificType("sender_user_balance_before", "double precision").defaultTo(0)
            tbl.specificType("receiver_user_balance_before", "double precision").defaultTo(0);
            tbl.specificType("warm_wallet_balance_before", "double precision").defaultTo(0)
            tbl.specificType("residual_amount", "double precision")
            tbl.specificType("transaction_from", "transaction_from")
        })
        .createTableIfNotExists("user_favourites", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('pair_from', "character varying");
            tbl.specificType('pair_to', "character varying");
            tbl.specificType('user_id', "bigint");
            tbl.specificType("priority", "double precision");
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("user_limit", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('coin_id', "bigint");
            tbl.specificType('user_id', "bigint");
            tbl.specificType('min_withdrawl_crypto', "double precision");
            tbl.specificType('min_withdrawl_fiat', "double precision");
            tbl.specificType('daily_withdraw_crypto', "double precision");
            tbl.specificType('daily_withdraw_fiat', "double precision");
            tbl.specificType('monthly_withdraw_crypto', "double precision");
            tbl.specificType('monthly_withdraw_fiat', "double precision");
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("user_notifications", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('slug', "character varying");
            tbl.specificType('text', "character varying");
            tbl.specificType('email', "character varying");
            tbl.specificType('title', "character varying");
            tbl.specificType('user_id', "bigint");
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("user_thresholds", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('user_id', "bigint");
            tbl.specificType('asset', "json");
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("users", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('email', "character varying(1000)");
            tbl.specificType('password', "character varying(100)");
            tbl.specificType('phone_number', "character varying(30)");
            tbl.specificType('full_name', "character varying(10000)");
            tbl.specificType('first_name', "character varying(5000)");
            tbl.specificType('last_name', "character varying(5000)");
            tbl.specificType('country', "character varying(30)");
            tbl.specificType('street_address', "character varying(250)");
            tbl.specificType('city_town', "character varying(40)");
            tbl.specificType("profile_pic", "text")
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
            tbl.specificType("referred_id", "bigint")
            tbl.boolean("is_active").defaultTo(false);
            tbl.boolean("is_verified").defaultTo(false);
            tbl.specificType("email_verify_token", "character varying(20)")
            tbl.specificType("reset_token", "character varying");
            tbl.specificType("dob", "character varying(30")
            tbl.boolean("is_twofactor").defaultTo(false);
            tbl.specificType('twofactor_secret', "character varying(50)");
            tbl.specificType('auth_code', "character varying(50)");
            tbl.specificType('referral_code', "character varying(100)");
            tbl.specificType('zip', "character varying");
            tbl.specificType('street_address_2', "character varying");
            tbl.specificType('postal_code', "character varying");
            tbl.specificType("reset_token_expire", "bigint")
            tbl.specificType("device_token", "character varying");
            tbl.specificType("device_type", "integer").defaultTo(0);
            tbl.specificType("fiat", "character varying");
            tbl.specificType("state", "character varying");
            tbl.specificType("country_id", "character varying");
            tbl.specificType("state_id", "character varying");
            tbl.specificType("diffrence_fiat", "double precision")
            tbl.specificType("total_value", "double precision")
            tbl.specificType("percent_wallet", "double precision")
            tbl.specificType("date_format", "character varying");
            tbl.specificType("referal_percentage", "double precision").defaultTo(0)
            tbl.specificType("hubspot_id", "character varying");
            tbl.specificType("new_ip_verification_token", "character varying");
            tbl.specificType("new_ip", "character varying");
            tbl.specificType("requested_email", "character varying");
            tbl.specificType("new_email_token", "character varying");
            tbl.boolean("is_new_email_verified");
            tbl.specificType("account_tier", "integer").defaultTo(0);
            tbl.specificType("account_class", "integer").defaultTo(3);
            tbl.specificType("country_code", "character varying");
            tbl.specificType("gender", "character varying");
            tbl.specificType("middle_name", "character varying");
            tbl.specificType("deleted_by", "numeric");
            tbl.specificType("whitelist_ip", "character varying");
            tbl.boolean("security_feature").defaultTo(false);
            tbl.specificType("security_feature_expired_time", "timestamp without time zone");
            tbl.boolean("is_whitelist_ip");
            tbl.specificType("twofactor_backup_code", "character varying");
            tbl.boolean("is_terms_agreed").defaultTo(false).notNullable();
            tbl.specificType("signup_token_expiration", "timestamp without time zone");
            tbl.specificType("forgot_token_expiration", "timestamp without time zone");
            tbl.specificType("device_token_expiration", "timestamp without time zone");
            tbl.specificType("default_language", "language_lists");
            tbl.specificType("customer_id", "character varying");
            tbl.boolean("is_user_updated").defaultTo(false);
            tbl.boolean("is_tradedesk_user").defaultTo(false);
            tbl.specificType("account_verified_at", "timestamp without time zone");
            tbl.boolean("is_institutional_account").defaultTo(false).notNullable();
        })
        .createTableIfNotExists("users_campaign_history", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('user_id', "bigint");
            tbl.specificType('campaign_id', "bigint");
            tbl.specificType('campaign_offer_id', "bigint");
            tbl.specificType('code', "character varying");
            tbl.boolean("wrong_attempted").defaultTo(false)
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("users_forgot_twofactors", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('user_id', "bigint");
            tbl.specificType('reason', "text");
            tbl.specificType('status', "character varying");
            tbl.specificType('uploaded_file', "character varying");
            tbl.specificType('created_at', 'timestamp without time zone')
            tbl.specificType('deleted_at', 'timestamp without time zone')
            tbl.specificType('updated_at', 'timestamp without time zone')
        })
        .createTableIfNotExists("wallet_history", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('source_address', "character varying");
            tbl.specificType('destination_address', "character varying");
            tbl.specificType('created_at', 'timestamp without time zone');
            tbl.specificType('amount', 'double precision');
            tbl.specificType('transaction_type', 'character varying');
            tbl.specificType("coin_id", "bigint");
            tbl.specificType("transaction_id", "character varying");
            tbl.specificType('deleted_at', 'timestamp without time zone');
            tbl.specificType('updated_at', 'timestamp without time zone');
            tbl.specificType('user_id', 'bigint');
            tbl.boolean("is_executed").defaultTo(false);
            tbl.specificType("faldax_fee", "double precision")
            tbl.boolean("is_admin").defaultTo(false);
            tbl.specificType("actual_network_fees", "double precision")
            tbl.specificType("estimated_network_fees", "double precision").defaultTo(0);
            tbl.specificType("actual_amount", "double precision")
            tbl.boolean("is_done").defaultTo(false);
            tbl.specificType("residual_amount", "double precision")
            tbl.specificType("fiat_values", "json")
        })
        .createTableIfNotExists("wallets", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('wallet_id', "character varying");
            tbl.specificType("coin_id", "bigint");
            tbl.specificType('receive_address', "character varying");
            tbl.boolean("is_active").defaultTo(true);
            tbl.specificType('created_at', 'timestamp without time zone');
            tbl.specificType('deleted_at', 'timestamp without time zone');
            tbl.specificType('updated_at', 'timestamp without time zone');
            tbl.specificType('balance', 'double precision');
            tbl.specificType("placed_balance", "double precision")
            tbl.specificType('address_label', 'character varying');
            tbl.specificType("send_address", "character varying");
            tbl.specificType('user_id', 'bigint');
            tbl.boolean("is_admin").defaultTo(false);
        })
        .createTableIfNotExists("withdraw_request", tbl => {
            tbl.increments('id').primary();
            tbl.specificType('source_address', "character varying");
            tbl.specificType('destination_address', "character varying");
            tbl.specificType('amount', 'double precision');
            tbl.specificType('user_id', 'bigint');
            tbl.boolean("is_approve");
            tbl.specificType('transaction_type', 'character varying');
            tbl.specificType("coin_id", "bigint");
            tbl.specificType("fees", "double precision")
            tbl.boolean("is_executed");
            tbl.specificType('created_at', 'timestamp without time zone');
            tbl.specificType('updated_at', 'timestamp without time zone');
            tbl.specificType('deleted_at', 'timestamp without time zone');
            tbl.specificType("reason", "character varying");
            tbl.specificType("faldax_fee", "double precision")
            tbl.specificType("transaction_id", "character varying");
            tbl.specificType("network_fee", "double precision")
            tbl.specificType("actual_amount", "double precision")
            tbl.specificType("fiat_values", "json")
        })
}

exports.down = knex => knex.schema.dropTableIfExists("todo");

