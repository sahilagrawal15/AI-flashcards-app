-- AI Flashcards App - Database Setup Script
-- Execute this script in your Supabase SQL Editor

-- Create decks table
create table if not exists decks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  created_at timestamp with time zone default now() not null
);

-- Set up Row Level Security for decks
alter table decks enable row level security;

-- Create RLS policies for decks
do $$
begin
  -- Drop existing policies if they exist
  drop policy if exists "Users can create their own decks" on decks;
  drop policy if exists "Users can view their own decks" on decks;
  drop policy if exists "Users can update their own decks" on decks;
  drop policy if exists "Users can delete their own decks" on decks;
  
  -- Create new policies
  create policy "Users can create their own decks" on decks
    for insert with check (auth.uid() = user_id);
  create policy "Users can view their own decks" on decks
    for select using (auth.uid() = user_id);
  create policy "Users can update their own decks" on decks
    for update using (auth.uid() = user_id);
  create policy "Users can delete their own decks" on decks
    for delete using (auth.uid() = user_id);
end $$;

-- Create flashcards table
create table if not exists flashcards (
  id uuid default uuid_generate_v4() primary key,
  deck_id uuid references decks(id) on delete cascade not null,
  front_text text not null,
  back_text text not null,
  interval integer default 1 not null,
  next_review timestamp with time zone default now() not null,
  created_at timestamp with time zone default now() not null
);

-- Set up Row Level Security for flashcards
alter table flashcards enable row level security;

-- Create RLS policies for flashcards
do $$
begin
  -- Drop existing policies if they exist
  drop policy if exists "Users can read their own flashcards" on flashcards;
  drop policy if exists "Users can create flashcards in their decks" on flashcards;
  drop policy if exists "Users can update their own flashcards" on flashcards;
  drop policy if exists "Users can delete their own flashcards" on flashcards;
  
  -- Create new policies
  create policy "Users can read their own flashcards" on flashcards
    for select using (
      auth.uid() = (select user_id from decks where id = flashcards.deck_id)
    );
  create policy "Users can create flashcards in their decks" on flashcards
    for insert with check (
      auth.uid() = (select user_id from decks where id = flashcards.deck_id)
    );
  create policy "Users can update their own flashcards" on flashcards
    for update using (
      auth.uid() = (select user_id from decks where id = flashcards.deck_id)
    );
  create policy "Users can delete their own flashcards" on flashcards
    for delete using (
      auth.uid() = (select user_id from decks where id = flashcards.deck_id)
    );
end $$;

-- Create indexes for better performance
create index if not exists idx_flashcards_deck_id on flashcards(deck_id);
create index if not exists idx_flashcards_next_review on flashcards(next_review);
create index if not exists idx_decks_user_id on decks(user_id);

-- Output confirmation
select 'Database setup complete!' as message; 