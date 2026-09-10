import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Seeding events data for Market Overview...");

  const { data: props, error: fetchErr } = await supabase.from('properties').select('id').limit(4);
  if (fetchErr) {
    console.error("Error fetching properties:", fetchErr);
    return;
  }

  const { data: events, error: evErr } = await supabase.from('events').insert([
    {
      property_id: props?.[0]?.id || 1,
      event_type: 'PRICE_CHANGED',
      payload: { trend: 'reduced', old_value: '500000', new_value: '480000' }
    },
    {
      property_id: props?.[1]?.id || 2,
      event_type: 'PRICE_CHANGED',
      payload: { trend: 'reduced', old_value: '600000', new_value: '580000' }
    },
    {
      property_id: props?.[2]?.id || 3,
      event_type: 'PRICE_CHANGED',
      payload: { trend: 'increased', old_value: '700000', new_value: '720000' }
    }
  ]);
  
  if (evErr) {
    console.error("Error inserting events:", evErr);
  } else {
    console.log("Inserted 3 PRICE_CHANGED events into 'events' table.");
  }

  console.log("Done!");
}

run();
