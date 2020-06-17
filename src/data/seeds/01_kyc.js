exports.seed = function (knex) {
  // Inserts seed entries

  return knex.schema
    .raw(`CREATE INDEX kyc_id ON public.kyc USING btree (user_id)`)
};