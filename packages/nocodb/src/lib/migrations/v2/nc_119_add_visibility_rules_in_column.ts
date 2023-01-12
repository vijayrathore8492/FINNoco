import { Knex } from 'knex';
import { MetaTable } from '../../utils/globals';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(MetaTable.COLUMNS, (table) => {
    table.text('visibility_rules').defaultTo('[]');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(MetaTable.COLUMNS, (table) => {
    table.dropColumn('visibility_rules');
  });
}
