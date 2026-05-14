const { getSupabaseAdmin } = require('../config/supabase');
const supabase = getSupabaseAdmin();

async function run() {
  let { data: workerData, error: workerErr } = await supabase.auth.admin.createUser({
    email: 'worker_test2@example.com',
    password: 'password123',
    email_confirm: true
  });
  if (workerErr) {
    console.log("Worker error:", workerErr.message);
  } else {
    console.log("TEST_WORKER_UID=" + workerData.user.id);
  }

  let { data: customerData, error: customerErr } = await supabase.auth.admin.createUser({
    email: 'customer_test2@example.com',
    password: 'password123',
    email_confirm: true
  });
  if (customerErr) {
    console.log("Customer error:", customerErr.message);
  } else {
    console.log("TEST_CUSTOMER_UID=" + customerData.user.id);
  }
}
run();
