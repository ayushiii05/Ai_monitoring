import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: './.env' }); // Make sure it reads from backend/.env or root .env
// We'll just read from process.env directly assuming it's loaded, but let's be safe
dotenv.config({ path: '../.env' }); 

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Seeding mock data into Supabase...");

  // 1. Insert mock properties
  const { data: properties, error: propError } = await supabase.from('properties').insert([
    {
      address: "123 Fake Street",
      suburb_name: "Sydney",
      state_code: "NSW",
      postcode: "2000",
      property_type: "house",
      bedrooms: 4,
      bathrooms: 2,
      garages: 2,
      price: "$1,200,000",
      price_numeric: 1200000,
      agent_name: "Test Agent",
      source: "Allhomes Mock",
      status: "for_sale"
    },
    {
      address: "456 Test Ave",
      suburb_name: "Melbourne",
      state_code: "VIC",
      postcode: "3000",
      property_type: "apartment",
      bedrooms: 2,
      bathrooms: 1,
      garages: 1,
      price: "$600,000",
      price_numeric: 600000,
      agent_name: "Test Agent 2",
      source: "Allhomes Mock",
      status: "for_sale"
    }
  ]).select();

  if (propError) {
    console.error("Error inserting properties:", propError);
    // If it fails because properties table schema is different, we'll see the error
    return;
  }

  console.log(`Inserted ${properties.length} properties.`);

  // 2. Insert monitoring_config
  for (const property of properties) {
    await supabase.from('monitoring_config').insert({
      listing_id: property.id,
      monitoring_enabled: true,
      monitoring_frequency: 'daily',
      last_sync_status: 'success'
    });
  }
  console.log("Inserted monitoring configs.");

  // 3. Insert mock events
  const { data: events, error: eventError } = await supabase.from('market_events').insert([
    {
      listing_id: properties[0].id,
      event_type: "PRICE_CHANGED",
      old_value: "1300000",
      new_value: "1200000",
      source: "Allhomes Mock"
    },
    {
      listing_id: properties[1].id,
      event_type: "STATUS_CHANGED",
      old_value: "for_sale",
      new_value: "under_offer",
      source: "Allhomes Mock"
    }
  ]).select();

  if (!eventError && events) {
    console.log(`Inserted ${events.length} market events.`);
    
    // 4. Insert mock alerts
    await supabase.from('market_alerts').insert([
      {
        listing_id: properties[0].id,
        event_id: events[0].id,
        alert_type: "PRICE_REDUCTION",
        severity: "HIGH",
        title: "Major Price Drop Detected",
        message: "Price dropped by $100,000 to $1,200,000",
        notification_status: "UNREAD"
      },
      {
        listing_id: properties[1].id,
        event_id: events[1].id,
        alert_type: "STATUS_CHANGED",
        severity: "MEDIUM",
        title: "Property Under Offer",
        message: "Status changed to under offer.",
        notification_status: "UNREAD"
      }
    ]);
    console.log("Inserted market alerts.");
  } else {
    console.log("Failed to insert events:", eventError);
  }

  console.log("✅ Seeding complete! Check your dashboard.");
}

seed();
