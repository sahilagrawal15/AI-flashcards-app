#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Preparing AI Flashcards App for Vercel Deployment${NC}"
echo ""

# Create .env.local file for local development
if [ ! -f .env.local ]; then
  echo -e "${YELLOW}Creating a sample .env.local file${NC}"
  cat > .env.local << EOL
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenRouter API Key (server-side only, not exposed to client)
OPENROUTER_API_KEY=your_openrouter_api_key_here
EOL
  echo "Created .env.local file. Please edit it with your actual values."
else
  echo -e "${YELLOW}.env.local file already exists.${NC}"
fi

# Check if git is initialized
if [ ! -d .git ]; then
  echo -e "${YELLOW}Initializing Git repository${NC}"
  git init
  echo "Git repository initialized."
else
  echo "Git repository already exists."
fi

# Check if .gitignore exists
if [ ! -f .gitignore ]; then
  echo -e "${YELLOW}Creating .gitignore file${NC}"
  cat > .gitignore << EOL
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
EOL
  echo "Created .gitignore file."
else
  echo ".gitignore file already exists."
fi

echo ""
echo -e "${GREEN}Next steps for Vercel deployment:${NC}"
echo "1. Commit your changes to Git:"
echo "   git add ."
echo "   git commit -m \"Prepare for Vercel deployment\""
echo ""
echo "2. Push to GitHub:"
echo "   git remote add origin https://github.com/yourusername/ai-flashcards-app.git"
echo "   git push -u origin main"
echo ""
echo "3. Deploy to Vercel from the GitHub repository"
echo ""
echo "4. Add these environment variables in your Vercel project settings:"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - OPENROUTER_API_KEY"
echo ""
echo -e "${GREEN}Your app is now ready for deployment on Vercel!${NC}" 