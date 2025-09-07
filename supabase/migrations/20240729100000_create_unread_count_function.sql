
-- Function to get the total count of unread messages for the current user.
-- This function is secure as it uses auth.uid() to get the current user's ID.
create or replace function public.get_unread_message_count()
returns integer
language sql
security definer
stable
as $$
  select count(*)::integer
  from public.messages
  where recipient_id = auth.uid() and is_read = false;
$$;

-- Grant execution permission to the authenticated role
grant execute on function public.get_unread_message_count() to authenticated;
