import { Knex } from 'knex';
import { MetaTable } from '../../utils/globals';

const up = async (knex: Knex) => {
  await knex(MetaTable.USERS).update({
    email: knex.raw("replace(email, '@finn.auto', '@finn.com')"),
  });
};

const down = async (knex) => {
  await knex(MetaTable.USERS).update({
    email: knex.raw("replace(email, '@finn.com', '@finn.auto')"),
  });
};

export { up, down };
