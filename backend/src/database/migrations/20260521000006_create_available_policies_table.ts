import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('available_policies', (table) => {
    table.uuid('policy_template_id').primary();
    table.string('name', 255).notNullable();
    table.enum('type', ['HEALTH', 'AUTO', 'HOME', 'LIFE']).notNullable();
    table.text('description').notNullable();
    table.decimal('base_premium', 10, 2).notNullable();
    table.json('coverage_details').notNullable();
    table.json('features').notNullable();
    table.json('eligibility_criteria').notNullable();
    table.integer('min_age').nullable();
    table.integer('max_age').nullable();
    table.decimal('min_sum_insured', 12, 2).nullable();
    table.decimal('max_sum_insured', 12, 2).nullable();
    table.integer('policy_term_years').nullable();
    table.string('provider_name', 255).notNullable();
    table.boolean('is_active').defaultTo(true);
    table.integer('popularity_score').defaultTo(0);
    table.timestamps(true, true);
    
    table.index(['type']);
    table.index(['is_active']);
    table.index(['popularity_score']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('available_policies');
}

// Made with Bob