import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// Insert with event type PRICE_UPDATE
async function test() {
  const { error } = await supabase.from('events').insert([
    {
      property_id: 1,
      event_type: 'PRICE_UPDATE',
      payload: { trend: 'reduced' }
    }
  ]);
  console.log(error);
}
test();
