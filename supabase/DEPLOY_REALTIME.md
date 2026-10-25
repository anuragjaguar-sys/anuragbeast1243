# Enable FIRE54 cross-device sync

1. In the Supabase dashboard, open the project used by `NEXT_PUBLIC_SUPABASE_URL`.
2. Open **SQL Editor** and run `migrations/202610190001_realtime_and_rls.sql`.
3. In **Database → Replication**, confirm `profiles` and `user_sync_data` appear under the `supabase_realtime` publication.
4. Test with two signed-in browsers: edit a portfolio item on one, then confirm the other updates without a reload. Repeat with a profile edit and a deletion.

The migration enables Row Level Security and grants authenticated users access only when `auth.uid()` matches the row's `user_id`.
