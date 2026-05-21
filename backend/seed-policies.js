const knex = require('knex');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: './dev.sqlite3'
  },
  useNullAsDefault: true
});

async function seedPolicies() {
  try {
    const sampleEmail = 'demo.user@insuranceadvisor.local';
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const nextYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Create sample user if not exists
    let user = await db('users').where({ email: sampleEmail }).first();

    if (!user) {
      const userId = uuidv4();
      const passwordHash = await bcrypt.hash('DemoUser@123', 10);

      await db('users').insert({
        user_id: userId,
        email: sampleEmail,
        password_hash: passwordHash,
        mfa_enabled: false,
        mfa_secret: null,
        profile: JSON.stringify({
          firstName: 'Demo',
          lastName: 'User',
          phone: '+91-9876543210',
          age: 32,
          familySize: 3,
          annualIncome: 1200000,
          hasVehicle: true,
          vehicleValue: 850000,
          ownsHome: true,
          homeValue: 7500000
        }),
        preferences: JSON.stringify({
          preferredPolicyTypes: ['HEALTH', 'AUTO', 'HOME', 'LIFE'],
          communication: 'email'
        }),
        email_verified: true,
        email_verification_token: null,
        email_verified_at: now.toISOString(),
        is_active: true,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      });

      user = await db('users').where({ email: sampleEmail }).first();
      console.log(`✅ Created sample user: ${sampleEmail}`);
      console.log(`   user_id: ${user.user_id}`);
      console.log(`   password: DemoUser@123`);
    } else {
      console.log(`ℹ️ Sample user already exists: ${sampleEmail}`);
      console.log(`   user_id: ${user.user_id}`);
    }

    // Remove existing seeded demo policies for this user
    await db('policies')
      .where({ user_id: user.user_id })
      .whereIn('policy_number', [
        'POL-DEMO-001',
        'POL-DEMO-002',
        'POL-DEMO-003'
      ])
      .delete();

    const policies = [
      {
        policy_id: uuidv4(),
        user_id: user.user_id,
        type: 'HEALTH',
        policy_number: 'POL-DEMO-001',
        provider_id: uuidv4(),
        premium: 14500,
        coverage: JSON.stringify({
          planName: 'Health Secure Silver',
          sumInsured: 500000,
          deductible: 5000,
          hospitalization: true,
          cashlessHospitals: 6500
        }),
        status: 'ACTIVE',
        start_date: today,
        end_date: nextYear,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      },
      {
        policy_id: uuidv4(),
        user_id: user.user_id,
        type: 'AUTO',
        policy_number: 'POL-DEMO-002',
        provider_id: uuidv4(),
        premium: 18500,
        coverage: JSON.stringify({
          vehicleType: 'SUV',
          vehicleValue: 850000,
          ownDamage: true,
          thirdParty: true,
          zeroDepreciation: true
        }),
        status: 'ACTIVE',
        start_date: today,
        end_date: nextYear,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      },
      {
        policy_id: uuidv4(),
        user_id: user.user_id,
        type: 'LIFE',
        policy_number: 'POL-DEMO-003',
        provider_id: uuidv4(),
        premium: 11800,
        coverage: JSON.stringify({
          planName: 'Term Life Basic',
          sumAssured: 5000000,
          accidentalDeathBenefit: true,
          criticalIllnessRider: false,
          policyTermYears: 25
        }),
        status: 'ACTIVE',
        start_date: today,
        end_date: '2049-05-21',
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }
    ];

    await db('policies').insert(policies);

    console.log(`✅ Inserted ${policies.length} sample policies for ${sampleEmail}`);
    console.log('✅ Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding sample user and policies:', error);
    process.exit(1);
  }
}

seedPolicies();

// Made with Bob
