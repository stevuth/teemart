# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Supabase Setup

This project uses Supabase for the database and authentication. To get it running, you will need to run the SQL scripts below in your Supabase SQL Editor.

### 1. Database Tables and Functions

This script sets up the necessary tables (`profiles`, `products`, etc.) and the database functions required for the application to work correctly.

Go to the **SQL Editor** in your Supabase dashboard, click **New query**, and paste the entire content of the `src/lib/schema.sql` file. Then click **RUN**.

### 2. Storage Security (RLS) Policies

This script sets up the security rules for the `product-images` storage bucket. These policies are crucial for allowing users to upload images securely. **If you are getting "new row violates row-level security policy" errors, it is because these policies are missing or incorrect.**

Go to the **SQL Editor** in your Supabase dashboard, click **New query**, and paste the entire content of the `src/lib/storage-rls.sql` file. Then click **RUN**.
