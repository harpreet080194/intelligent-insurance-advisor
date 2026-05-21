import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create payments table
  await knex.schema.createTable('payments', (table) => {
    table.uuid('payment_id').primary();
    table.uuid('user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');
    table.uuid('policy_id').nullable().references('policy_id').inTable('policies').onDelete('SET NULL');
    table.string('transaction_ref', 100).notNullable().unique();
    table.decimal('amount', 12, 2).notNullable();
    table.string('currency', 3).notNullable().defaultTo('INR');
    table.string('payment_method', 50).notNullable();
    table.string('stripe_payment_intent_id', 255).nullable();
    table.string('status', 20).notNullable().defaultTo('PENDING');
    table.text('description').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('user_id');
    table.index('policy_id');
    table.index('transaction_ref');
    table.index('status');
    table.index('created_at');
  });

  // Create payment_methods table
  await knex.schema.createTable('payment_methods', (table) => {
    table.uuid('payment_method_id').primary();
    table.uuid('user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');
    table.string('stripe_payment_method_id', 255).notNullable();
    table.string('type', 20).notNullable();
    table.string('last_four', 4).nullable();
    table.string('brand', 50).nullable();
    table.integer('exp_month').nullable();
    table.integer('exp_year').nullable();
    table.boolean('is_default').notNullable().defaultTo(false);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('user_id');
    table.index(['user_id', 'is_default']);
  });

  // Add stripe_customer_id to users table
  await knex.schema.alterTable('users', (table) => {
    table.string('stripe_customer_id', 255).nullable();
    table.index('stripe_customer_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('stripe_customer_id');
  });
  
  await knex.schema.dropTableIfExists('payment_methods');
  await knex.schema.dropTableIfExists('payments');
}

// Made with Bob
