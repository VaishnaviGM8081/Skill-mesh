const { getSupabaseAdmin } = require('../config/supabase');
const supabase = getSupabaseAdmin();

async function run() {
  const { data, error } = await supabase.from('workers').select('*');
  console.log("WORKERS:", JSON.stringify(data, null, 2));
  console.log("ERROR:", error);
}
run();
