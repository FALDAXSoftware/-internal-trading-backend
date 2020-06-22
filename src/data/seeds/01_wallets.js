exports.seed = function (knex) {
  // Inserts seed entries

  return knex.schema
    .raw(`CREATE INDEX IF NOT EXISTS indexwallets ON public.wallets USING btree (deleted_at, receive_address)`)
};