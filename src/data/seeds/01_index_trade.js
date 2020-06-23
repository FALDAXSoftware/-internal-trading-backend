exports.seed = function (knex) {
    // Inserts seed entries

    return knex.schema
        .raw(`CREATE INDEX IF NOT EXISTS  created_atrequested ON public.trade_history USING btree (created_at, requested_user_id);`)
        .raw(`CREATE INDEX IF NOT EXISTS  deletedcreated ON public.trade_history USING btree (deleted_at, created_at);`)
        .raw(`CREATE INDEX IF NOT EXISTS  highinfosocketindex ON public.trade_history USING btree (symbol) INCLUDE (created_at, deleted_at);`)
        .raw(`CREATE INDEX IF NOT EXISTS  idsymbolindex ON public.trade_history USING btree (deleted_at, symbol, created_at);`)
        .raw(`CREATE INDEX IF NOT EXISTS  indexcreateduser ON public.trade_history USING hash (user_id);`)
        .raw(`CREATE INDEX IF NOT EXISTS  indexdeletedcreatedsymbol ON public.trade_history USING btree (deleted_at, created_at, symbol);`)
        .raw(`CREATE INDEX IF NOT EXISTS  indextradecreateddeletedsymbol ON public.trade_history USING btree (deleted_at, symbol, created_at);`)
        .raw(`CREATE INDEX IF NOT EXISTS  indextradecreatedid ON public.trade_history USING btree (created_at, settle_currency, currency);`)
        .raw(`CREATE INDEX IF NOT EXISTS  indextradehistory ON public.trade_history USING btree (id, created_at, currency, settle_currency, side, order_type, symbol, requested_user_id, user_id, placed_by);`)
        .raw(`CREATE INDEX IF NOT EXISTS  indextradehistorycreatedsymbol ON public.trade_history USING btree (symbol, created_at, deleted_at);`)
        .raw(`CREATE INDEX IF NOT EXISTS  indextradehistorycreateduserindex ON public.trade_history USING btree (created_at, user_id);`)
        .raw(`CREATE INDEX IF NOT EXISTS  indextradehistoryid ON public.trade_history USING btree (id);`)
        .raw(`CREATE INDEX IF NOT EXISTS  indextradehistoryrequested ON public.trade_history USING btree (created_at, requested_user_id);`)
        .raw(`CREATE INDEX IF NOT EXISTS  indextradesettlehistory ON public.trade_history USING btree (created_at, settle_currency, currency);`)
};