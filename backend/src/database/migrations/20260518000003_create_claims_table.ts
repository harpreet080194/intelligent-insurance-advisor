import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create claims table
  await knex.schema.createTable('claims', (table) => {
    table.uuid('claim_id').primary();
    table.string('claim_number', 50).notNullable().unique();
    table.uuid('user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');
    table.uuid('policy_id').notNullable().references('policy_id').inTable('policies').onDelete('CASCADE');
    table.string('type', 50).notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.string('status', 20).notNullable().defaultTo('SUBMITTED');
    table.json('documents').defaultTo('[]');
    table.text('notes').nullable();
    table.text('rejection_reason').nullable();
    table.uuid('reviewed_by').nullable().references('user_id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('reviewed_at').nullable();
    table.timestamp('approved_at').nullable();
    table.timestamp('paid_at').nullable();

    // Indexes
    table.index('user_id');
    table.index('policy_id');
    table.index('status');
    table.index('claim_number');
    table.index('created_at');
    table.index(['user_id', 'status']);
  });

  // Create claim state transitions audit table
  await knex.schema.createTable('claim_state_transitions', (table) => {
    table.increments('id').primary();
    table.uuid('claim_id').notNullable().references('claim_id').inTable('claims').onDelete('CASCADE');
    table.string('from_state', 20).nullable();
    table.string('to_state', 20).notNullable();
    table.text('reason').nullable();
    table.uuid('changed_by').nullable().references('user_id').inTable('users');
    table.timestamp('changed_at').defaultTo(knex.fn.now());

    // Indexes
    table.index('claim_id');
    table.index('changed_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('claim_state_transitions');
  await knex.schema.dropTableIfExists('claims');
}

// Made with Bob
