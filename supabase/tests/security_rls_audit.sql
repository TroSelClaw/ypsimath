-- TASK-073 security audit helpers
-- Run with: supabase db test --local --file supabase/tests/security_rls_audit.sql

-- 1) RLS must be enabled on all public tables
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- 2) Inspect policies quickly
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3) user-uploads bucket path policy should exist and include auth.uid()
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and (qual ilike '%user-uploads%' or with_check ilike '%user-uploads%')
order by policyname;
