exports.seed = function (knex) {
  // Inserts seed entries

  return knex.schema
    .raw(
      `CREATE INDEX IF NOT EXISTS  indexactivitytable ON public.activity_table USING btree (id);`
    )
};