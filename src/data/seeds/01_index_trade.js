exports.seed = function (knex) {
    // Inserts seed entries

    return knex.schema
        .raw(`CREATE INDEX created_atrequested ON public.trade_history USING btree (created_at, requested_user_id);`)
        .raw(`CREATE INDEX deletedcreated ON public.trade_history USING btree (deleted_at, created_at);`)
        .raw(`CREATE INDEX highinfosocketindex ON public.trade_history USING btree (symbol) INCLUDE (created_at, deleted_at);`)
        .raw(`CREATE INDEX idsymbolindex ON public.trade_history USING btree (deleted_at, symbol, created_at);`)
        .raw(`CREATE INDEX indexcreateduser ON public.trade_history USING hash (user_id);`)
        .raw(`CREATE INDEX indexdeletedcreatedsymbol ON public.trade_history USING btree (deleted_at, created_at, symbol);`)
        .raw(`CREATE INDEX indextradecreateddeletedsymbol ON public.trade_history USING btree (deleted_at, symbol, created_at);`)
        .raw(`CREATE INDEX indextradecreatedid ON public.trade_history USING btree (created_at, settle_currency, currency);`)
        .raw(`CREATE INDEX indextradehistory ON public.trade_history USING btree (id, created_at, currency, settle_currency, side, order_type, symbol, requested_user_id, user_id, placed_by);`)
        .raw(`CREATE INDEX indextradehistorycreatedsymbol ON public.trade_history USING btree (symbol, created_at, deleted_at);`)
        .raw(`CREATE INDEX indextradehistorycreateduserindex ON public.trade_history USING btree (created_at, user_id);`)
        .raw(`CREATE INDEX indextradehistoryid ON public.trade_history USING btree (id);`)
        .raw(`CREATE INDEX indextradehistoryrequested ON public.trade_history USING btree (created_at, requested_user_id);`)
        .raw(`CREATE INDEX indextradesettlehistory ON public.trade_history USING btree (created_at, settle_currency, currency);`)
};