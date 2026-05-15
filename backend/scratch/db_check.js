const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('DB ERROR:', error);
  } else if (data && data.length > 0) {
    console.log('COLUMNS:', Object.keys(data[0]));
  } else {
    console.log('No workers found to check schema.');
  }
}

check();
