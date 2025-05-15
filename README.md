# AI Flashcards App

A spaced repetition flashcards application built with Next.js 14, Tailwind CSS, and Supabase.

## Features

- User authentication (email/password)
- Create and manage flashcard decks
- Add, edit, and delete flashcards
- AI-powered flashcard generation from your content
- Spaced repetition algorithm for efficient learning
- Study sessions to review due cards
- Responsive UI for desktop and mobile
- Dark mode support

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase
- **AI Integration**: OpenRouter API with Mixtral 8x7B
- **Language**: TypeScript
- **Containerization**: Docker

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn
- Supabase account (for backend)
- OpenRouter API key (for AI flashcard generation)
- Docker and Docker Compose (optional, for containerized setup)

### Standard Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-flashcards-app.git
   cd ai-flashcards-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Supabase:
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Enable Email Auth in Authentication settings
   - Execute the SQL commands in the `db-setup.sql` file using the Supabase SQL Editor

4. Set up your environment variables using one of these methods:
   - Run the setup script: `./setup.sh` and follow the prompts
   - Or manually create a `.env.local` file with your credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
     NEXT_PUBLIC_OPENROUTER_API_KEY=your-openrouter-api-key
     ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-flashcards-app.git
   cd ai-flashcards-app
   ```

2. Set up Supabase:
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Enable Email Auth in Authentication settings
   - Execute the SQL commands in the `db-setup.sql` file using the Supabase SQL Editor

3. Create a `.env` file in the project root with your credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_OPENROUTER_API_KEY=your-openrouter-api-key
   ```

4. Build and run the Docker container:
   ```bash
   docker-compose up -d
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

6. To stop the container:
   ```bash
   docker-compose down
   ```

## Database Setup

Execute the SQL commands in your Supabase SQL editor to set up the necessary tables and security policies. You can either:

1. Copy and execute the SQL commands from the `db-setup.sql` file in this repository
2. Or run the following SQL commands directly:

### Decks Table

```sql
create table decks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  created_at timestamp with time zone default now() not null
);

-- Set up Row Level Security
alter table decks enable row level security;
create policy "Users can create their own decks" on decks
  for insert with check (auth.uid() = user_id);
create policy "Users can view their own decks" on decks
  for select using (auth.uid() = user_id);
create policy "Users can update their own decks" on decks
  for update using (auth.uid() = user_id);
create policy "Users can delete their own decks" on decks
  for delete using (auth.uid() = user_id);
```

### Flashcards Table

```sql
create table flashcards (
  id uuid default uuid_generate_v4() primary key,
  deck_id uuid references decks(id) on delete cascade not null,
  front_text text not null,
  back_text text not null,
  interval integer default 0 not null,
  next_review timestamp with time zone default now() not null,
  created_at timestamp with time zone default now() not null
);

-- Set up Row Level Security
alter table flashcards enable row level security;
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
```

## AI Flashcard Generation

The application includes AI-powered flashcard generation using the OpenRouter API with the Mixtral 8x7B model. This feature allows users to:

1. Paste content (notes, articles, or any text) into a text area
2. Generate 5 question-answer flashcards from that content
3. Preview the generated flashcards before saving
4. Save the flashcards to their selected deck

The AI flashcard generation is available both:
- On the dashboard, where you can select any of your decks
- On individual deck pages via the "Generate with AI" button

### Setting Up AI Flashcard Generation

This application uses OpenRouter API to generate flashcards with AI. To use this feature:

1. Create an account at [OpenRouter.ai](https://openrouter.ai)
2. Generate a new API key from your dashboard
3. Add your API key to the `.env.local` or `.env` file:
   ```
   NEXT_PUBLIC_OPENROUTER_API_KEY=your_api_key_here
   ```
4. Restart your development server or Docker container

Without a valid API key, the application will display instructions for setting one up.

## Deployment Options

### Vercel Deployment

The application can be deployed on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/ai-flashcards-app)

Make sure to add all the environment variables in your Vercel project settings.

### Docker Deployment

You can deploy the containerized application on any platform that supports Docker:

1. Build the Docker image:
   ```bash
   docker build -t ai-flashcards-app .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 \
     -e NEXT_PUBLIC_SUPABASE_URL=your-supabase-url \
     -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key \
     -e NEXT_PUBLIC_OPENROUTER_API_KEY=your-openrouter-api-key \
     ai-flashcards-app
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
