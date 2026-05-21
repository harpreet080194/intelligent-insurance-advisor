const knex = require('knex');
const { v4: uuidv4 } = require('uuid');

const db = knex({
  client: 'sqlite3',
  connection: { filename: './dev.sqlite3' },
  useNullAsDefault: true
});

// Policy templates data
const healthPolicies = [
  { name: 'Health Shield Basic', premium: 8500, sumInsured: 300000, minAge: 18, maxAge: 65, popularity: 85 },
  { name: 'Family Health Protector', premium: 18500, sumInsured: 500000, minAge: 18, maxAge: 65, popularity: 92 },
  { name: 'Super Health Plus', premium: 32000, sumInsured: 1000000, minAge: 18, maxAge: 75, popularity: 78 },
  { name: 'Senior Citizen Care', premium: 24500, sumInsured: 500000, minAge: 60, maxAge: 80, popularity: 88 },
  { name: 'Critical Illness Shield', premium: 15000, sumInsured: 1000000, minAge: 18, maxAge: 65, popularity: 75 },
  { name: 'Diabetes Care Plan', premium: 19500, sumInsured: 500000, minAge: 25, maxAge: 70, popularity: 70 },
  { name: 'Maternity & Newborn Care', premium: 22000, sumInsured: 300000, minAge: 21, maxAge: 45, popularity: 82 },
  { name: 'Health Secure Gold', premium: 12500, sumInsured: 500000, minAge: 18, maxAge: 60, popularity: 90 },
  { name: 'Young Professional Health', premium: 6500, sumInsured: 300000, minAge: 18, maxAge: 35, popularity: 86 },
  { name: 'Top-Up Health Booster', premium: 5500, sumInsured: 1000000, minAge: 18, maxAge: 65, popularity: 72 },
  { name: 'Accident Care Plus', premium: 3500, sumInsured: 500000, minAge: 18, maxAge: 70, popularity: 68 },
  { name: 'Corona Kavach', premium: 2500, sumInsured: 200000, minAge: 18, maxAge: 65, popularity: 65 },
  { name: 'Multi-Year Health Saver', premium: 22000, sumInsured: 500000, minAge: 18, maxAge: 65, popularity: 80 }
];

const autoPolicies = [
  { name: 'Comprehensive Car Insurance', premium: 18500, vehicleValue: 800000, popularity: 91 },
  { name: 'Third Party Car Insurance', premium: 2200, vehicleValue: 0, popularity: 70 },
  { name: 'Two Wheeler Comprehensive', premium: 3500, vehicleValue: 100000, popularity: 88 },
  { name: 'Zero Depreciation Car Cover', premium: 4500, vehicleValue: 0, popularity: 85 },
  { name: 'Engine Protection Cover', premium: 2800, vehicleValue: 0, popularity: 76 },
  { name: 'Return to Invoice Cover', premium: 3200, vehicleValue: 0, popularity: 82 },
  { name: 'Roadside Assistance Plus', premium: 1500, vehicleValue: 0, popularity: 79 },
  { name: 'Electric Vehicle Insurance', premium: 12500, vehicleValue: 1200000, popularity: 83 },
  { name: 'Commercial Vehicle Insurance', premium: 25000, vehicleValue: 2000000, popularity: 72 },
  { name: 'Multi-Year Auto Insurance', premium: 48000, vehicleValue: 800000, popularity: 78 }
];

const homePolicies = [
  { name: 'Home Shield Comprehensive', premium: 15000, propertyValue: 5000000, popularity: 89 },
  { name: 'Contents Only Insurance', premium: 5500, propertyValue: 500000, popularity: 81 },
  { name: 'Fire and Allied Perils', premium: 3500, propertyValue: 3000000, popularity: 73 },
  { name: 'Earthquake Protection Plan', premium: 8500, propertyValue: 3000000, popularity: 70 },
  { name: 'Flood Insurance Cover', premium: 7500, propertyValue: 4000000, popularity: 75 },
  { name: 'Burglary and Theft Cover', premium: 4500, propertyValue: 1000000, popularity: 77 },
  { name: 'Tenant Home Insurance', premium: 3800, propertyValue: 300000, popularity: 80 },
  { name: 'Luxury Home Protection', premium: 35000, propertyValue: 15000000, popularity: 68 },
  { name: 'Home Appliance Protection', premium: 2500, propertyValue: 300000, popularity: 72 },
  { name: 'Home Renovation Insurance', premium: 6500, propertyValue: 2000000, popularity: 65 }
];

const lifePolicies = [
  { name: 'Term Life Basic', premium: 11800, sumAssured: 5000000, minAge: 18, maxAge: 65, popularity: 90 },
  { name: 'Life Protect Plus', premium: 24300, sumAssured: 10000000, minAge: 18, maxAge: 65, popularity: 87 },
  { name: 'Whole Life Insurance', premium: 45000, sumAssured: 10000000, minAge: 18, maxAge: 60, popularity: 75 },
  { name: 'Money Back Life Plan', premium: 35000, sumAssured: 5000000, minAge: 18, maxAge: 55, popularity: 78 },
  { name: 'Child Future Plan', premium: 28000, sumAssured: 3000000, minAge: 21, maxAge: 50, popularity: 85 },
  { name: 'Retirement Pension Plan', premium: 50000, sumAssured: 5000000, minAge: 30, maxAge: 60, popularity: 82 },
  { name: 'ULIP Investment Plan', premium: 40000, sumAssured: 5000000, minAge: 18, maxAge: 65, popularity: 73 },
  { name: 'Women Life Protector', premium: 18000, sumAssured: 5000000, minAge: 18, maxAge: 65, popularity: 80 },
  { name: 'Senior Life Cover', premium: 55000, sumAssured: 3000000, minAge: 60, maxAge: 75, popularity: 70 },
  { name: 'Joint Life Insurance', premium: 32000, sumAssured: 10000000, minAge: 21, maxAge: 65, popularity: 76 }
];

async function seedAvailablePolicies() {
  try {
    console.log('🌱 Seeding available policies marketplace...');
    await db('available_policies').delete();

    const policies = [];

    // Generate Health policies
    healthPolicies.forEach(p => {
      policies.push({
        policy_template_id: uuidv4(),
        name: p.name,
        type: 'HEALTH',
        description: `Comprehensive health insurance plan with ${p.sumInsured.toLocaleString('en-IN')} coverage`,
        base_premium: p.premium,
        coverage_details: JSON.stringify({ sumInsured: p.sumInsured, cashlessHospitals: 5000 }),
        features: JSON.stringify(['Cashless hospitalization', 'Pre/post hospitalization', 'No claim bonus']),
        eligibility_criteria: JSON.stringify({ minAge: p.minAge, maxAge: p.maxAge }),
        min_age: p.minAge,
        max_age: p.maxAge,
        min_sum_insured: p.sumInsured,
        max_sum_insured: p.sumInsured,
        policy_term_years: 1,
        provider_name: 'HealthFirst Insurance',
        is_active: true,
        popularity_score: p.popularity
      });
    });

    // Generate Auto policies
    autoPolicies.forEach(p => {
      policies.push({
        policy_template_id: uuidv4(),
        name: p.name,
        type: 'AUTO',
        description: `Comprehensive auto insurance with ${p.vehicleValue > 0 ? '₹' + p.vehicleValue.toLocaleString('en-IN') + ' coverage' : 'essential protection'}`,
        base_premium: p.premium,
        coverage_details: JSON.stringify({ vehicleValue: p.vehicleValue, ownDamage: true, thirdParty: true }),
        features: JSON.stringify(['Own damage cover', 'Third party liability', 'Cashless garage network']),
        eligibility_criteria: JSON.stringify({ vehicleAge: 10 }),
        min_age: 18,
        max_age: 75,
        min_sum_insured: p.vehicleValue,
        max_sum_insured: p.vehicleValue,
        policy_term_years: 1,
        provider_name: 'AutoSecure Insurance',
        is_active: true,
        popularity_score: p.popularity
      });
    });

    // Generate Home policies
    homePolicies.forEach(p => {
      policies.push({
        policy_template_id: uuidv4(),
        name: p.name,
        type: 'HOME',
        description: `Home insurance protecting property worth ₹${p.propertyValue.toLocaleString('en-IN')}`,
        base_premium: p.premium,
        coverage_details: JSON.stringify({ propertyValue: p.propertyValue, structureCover: true, contentsCover: true }),
        features: JSON.stringify(['Fire protection', 'Theft coverage', 'Natural disaster cover']),
        eligibility_criteria: JSON.stringify({ propertyType: 'Residential' }),
        min_age: 18,
        max_age: 75,
        min_sum_insured: p.propertyValue,
        max_sum_insured: p.propertyValue,
        policy_term_years: 1,
        provider_name: 'HomeSecure Insurance',
        is_active: true,
        popularity_score: p.popularity
      });
    });

    // Generate Life policies
    lifePolicies.forEach(p => {
      policies.push({
        policy_template_id: uuidv4(),
        name: p.name,
        type: 'LIFE',
        description: `Life insurance with ₹${p.sumAssured.toLocaleString('en-IN')} sum assured`,
        base_premium: p.premium,
        coverage_details: JSON.stringify({ sumAssured: p.sumAssured, policyTerm: 25 }),
        features: JSON.stringify(['Death benefit', 'Tax benefits', 'Flexible premium payment']),
        eligibility_criteria: JSON.stringify({ minAge: p.minAge, maxAge: p.maxAge }),
        min_age: p.minAge,
        max_age: p.maxAge,
        min_sum_insured: p.sumAssured,
        max_sum_insured: p.sumAssured,
        policy_term_years: 25,
        provider_name: 'LifeSecure Insurance',
        is_active: true,
        popularity_score: p.popularity
      });
    });

    await db('available_policies').insert(policies);
    console.log(`✅ Inserted ${policies.length} available policies`);
    console.log(`   - Health: ${healthPolicies.length}`);
    console.log(`   - Auto: ${autoPolicies.length}`);
    console.log(`   - Home: ${homePolicies.length}`);
    console.log(`   - Life: ${lifePolicies.length}`);
    console.log('✅ Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding available policies:', error);
    process.exit(1);
  }
}

seedAvailablePolicies();

// Made with Bob
