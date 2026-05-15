/**
 * create_chat_table.js
 * Run this SQL in Supabase SQL Editor:
 * 
 * CREATE TABLE IF NOT EXISTS messages (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   job_id INT REFERENCES jobs(id) ON DELETE CASCADE,
 *   sender_id UUID NOT NULL, -- Supabase UID
 *   sender_type TEXT CHECK (sender_type IN ('customer', 'worker')),
 *   text TEXT NOT NULL,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
 * );
 * 
 * -- Enable Realtime
 * ALTER PUBLICATION supabase_realtime ADD TABLE messages;
 */

console.log('📝 Please run the SQL inside the comments of this file in your Supabase SQL Editor.');
