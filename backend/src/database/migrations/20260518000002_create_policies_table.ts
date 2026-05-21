import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('policies', (table) => {
    table.uuid('policy_id').primary();
    table.uuid('user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');
    table.string('policy_number', 50).notNullable().unique();
    table.string('type', 20).notNullable();
    table.string('status', 20).notNullable().defaultTo('ACTIVE');
    table.uuid('provider_id').notNullable();
    table.decimal('premium', 10, 2).notNullable();
    table.json('coverage').notNullable();
    table.date('start_date').notNullable();
    table.date('end_date').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexes
    table.index('user_id');
    table.index('status');
    table.index('type');
    table.index('policy_number');
    table.index(['user_id', 'status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('policies');
}

// Made with Bob
