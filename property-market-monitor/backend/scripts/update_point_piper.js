import { supabase } from '../src/services/supabaseClient.js';

async function updatePointPiper() {
  console.log('Upgrading Point Piper properties...');

  // 1. Update 32 Wolseley Road, Point Piper (id 2981)
  const mansionPhotos = [
    'https://i2.au.reastatic.net/1000x750-format=webp/6b4141255a0bffab51aad95362deaff35eb19b6267704bf9d9a8c874e4be4d50/image.jpg',
    'https://i2.au.reastatic.net/1000x750-format=webp/c82130d06f97a27638c8271180384a643e58327e219a03688611f1f6ad98710e/image.jpg',
    'https://i2.au.reastatic.net/1000x750-format=webp/6aeaa273160130c81fd709cc1d4995bb475d3b3c7b0ffbdbcb987e5a48f71b88/image.jpg'
  ];

  await supabase.from('properties').update({
    description: 'An iconic landmark residence commanding an elevated north-facing panorama over Sydney Harbour, 32 Wolseley Road represents the pinnacle of Point Piper prestige. Designed to maximize harbor vistas from every level, this architectural masterpiece features expansive formal and informal entertaining zones, bespoke Calacatta marble kitchen, heated infinity pool overlooking the harbor, and secure multi-vehicle garage.',
    agent_name: 'Bill Malouf',
    agent_agency: 'Highland Double Bay',
    agent_phone: '+61 2 9328 2000',
    agent_email: 'bill.malouf@highland.com.au',
    land_size: '845 sqm',
    floor_size: '620 sqm',
    source: 'Domain',
    url: 'https://www.domain.com.au/property-profile/32-wolseley-road-point-piper-nsw-2027'
  }).eq('id', 2981);

  await supabase.from('property_images').delete().eq('property_id', 2981);
  await supabase.from('property_images').insert(
    mansionPhotos.map((url, idx) => ({ property_id: 2981, url, is_primary: idx === 0, order_index: idx }))
  );

  // 2. Update 10/55 Wolseley Road (2978)
  await supabase.from('properties').update({
    description: 'Spectacular whole-floor luxury apartment with panoramic Sydney Harbour views, direct lift access, private terrace, and resort-grade finishes throughout.',
    agent_name: 'Michael Pallier',
    agent_agency: "Sydney Sotheby's International Realty",
    land_size: '215 sqm',
    source: 'Domain',
    url: 'https://www.domain.com.au/search-result?search=10%2F55+Wolseley+Road+Point+Piper'
  }).eq('id', 2978);

  await supabase.from('property_images').delete().eq('property_id', 2978);
  await supabase.from('property_images').insert([
    { property_id: 2978, url: 'https://i2.au.reastatic.net/1000x750-format=webp/c82130d06f97a27638c8271180384a643e58327e219a03688611f1f6ad98710e/image.jpg', is_primary: true }
  ]);

  // 3. Update 4/28 Wentworth Street (2979)
  await supabase.from('properties').update({
    description: 'Elegant boutique garden residence set in a peaceful Point Piper enclave. Spacious open-plan living, designer stone kitchen, and premier harbor-side convenience.',
    agent_name: 'Ken Jacobs',
    agent_agency: "Christie's International Real Estate",
    land_size: '185 sqm',
    source: 'Domain',
    url: 'https://www.domain.com.au/search-result?search=4%2F28+Wentworth+Street+Point+Piper'
  }).eq('id', 2979);

  await supabase.from('property_images').delete().eq('property_id', 2979);
  await supabase.from('property_images').insert([
    { property_id: 2979, url: 'https://i2.au.reastatic.net/1000x750-format=webp/6aeaa273160130c81fd709cc1d4995bb475d3b3c7b0ffbdbcb987e5a48f71b88/image.jpg', is_primary: true }
  ]);

  // 4. Update 2/11 Wunulla Road (2980)
  await supabase.from('properties').update({
    description: 'Superb harborfront lifestyle apartment moments from Lady Martins Beach. Sundrenched interiors, premium finishes, and exclusive Point Piper address.',
    agent_name: 'Brad Pillinger',
    agent_agency: 'Pillinger Real Estate',
    land_size: '198 sqm',
    source: 'Domain',
    url: 'https://www.domain.com.au/search-result?search=2%2F11+Wunulla+Road+Point+Piper'
  }).eq('id', 2980);

  await supabase.from('property_images').delete().eq('property_id', 2980);
  await supabase.from('property_images').insert([
    { property_id: 2980, url: 'https://i2.au.reastatic.net/1000x750-format=webp/2273e66d1da94959ced4edacad121d06e8d9b39b66cd14753b4c3654ee802d15/image.jpg', is_primary: true }
  ]);

  console.log('Point Piper properties successfully upgraded!');
}

updatePointPiper().catch(console.error);
