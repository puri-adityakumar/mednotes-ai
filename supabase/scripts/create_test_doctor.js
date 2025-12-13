/**
 * Script to create a test doctor for development/testing
 * 
 * Usage:
 * 1. Set environment variables:
 *    - SUPABASE_URL (your Supabase project URL)
 *    - SUPABASE_SERVICE_ROLE_KEY (your service role key from Supabase Dashboard > Settings > API)
 * 
 * 2. Run: node supabase/scripts/create_test_doctor.js
 * 
 * Or use: npx tsx supabase/scripts/create_test_doctor.js
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing environment variables');
  console.log('\nPlease set:');
  console.log('  - SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
  console.log('  - SUPABASE_SERVICE_ROLE_KEY');
  console.log('\nYou can find these in Supabase Dashboard > Settings > API');
  process.exit(1);
}

const testDoctor = {
  email: 'doctor@test.com',
  password: 'test123456',
  first_name: 'John',
  last_name: 'Smith',
  specialization: 'General Practitioner',
  doctor_id: 'DR001',
  phone: '+1-555-0123',
};

async function createTestDoctor() {
  try {
    console.log('🚀 Creating test doctor...\n');

    // Step 1: Create auth user
    console.log('1. Creating auth user...');
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({
        email: testDoctor.email,
        password: testDoctor.password,
        email_confirm: true,
        user_metadata: {
          first_name: testDoctor.first_name,
          last_name: testDoctor.last_name,
          role: 'doctor',
        },
      }),
    });

    if (!authResponse.ok) {
      const error = await authResponse.json();
      if (error.message?.includes('already registered')) {
        console.log('⚠️  User already exists, updating profile...');
        // Get existing user
        const getUserResponse = await fetch(
          `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(testDoctor.email)}`,
          {
            headers: {
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'apikey': SUPABASE_SERVICE_ROLE_KEY,
            },
          }
        );
        const users = await getUserResponse.json();
        if (users.users && users.users.length > 0) {
          var userId = users.users[0].id;
        } else {
          throw new Error('User exists but could not retrieve ID');
        }
      } else {
        throw new Error(`Failed to create user: ${JSON.stringify(error)}`);
      }
    } else {
      const userData = await authResponse.json();
      var userId = userData.id;
      console.log('✅ Auth user created:', userId);
    }

    // Step 2: Update profile with doctor details
    console.log('\n2. Updating doctor profile...');
    const profileResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          first_name: testDoctor.first_name,
          last_name: testDoctor.last_name,
          role: 'doctor',
          specialization: testDoctor.specialization,
          doctor_id: testDoctor.doctor_id,
          phone: testDoctor.phone,
        }),
      }
    );

    if (!profileResponse.ok) {
      const error = await profileResponse.text();
      throw new Error(`Failed to update profile: ${error}`);
    }

    const profile = await profileResponse.json();
    console.log('✅ Doctor profile updated');

    // Success
    console.log('\n✨ Test doctor created successfully!\n');
    console.log('Credentials:');
    console.log(`  Email: ${testDoctor.email}`);
    console.log(`  Password: ${testDoctor.password}`);
    console.log(`  Name: ${testDoctor.first_name} ${testDoctor.last_name}`);
    console.log(`  Specialization: ${testDoctor.specialization}`);
    console.log(`  Doctor ID: ${testDoctor.doctor_id}\n`);
    console.log('You can now use these credentials to login as a doctor.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

createTestDoctor();

