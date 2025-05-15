#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}AI Flashcards App - Git Commit Script${NC}"
echo "This script will help you commit all changes to git."
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
  echo -e "${YELLOW}Git repository not found. Initializing...${NC}"
  git init
  echo ""
fi

# Add all files
echo -e "${GREEN}Adding all files to git...${NC}"
git add .
echo ""

# Get commit message
echo -e "${YELLOW}Please enter a commit message:${NC}"
read -p "> " commit_message

if [ -z "$commit_message" ]; then
  commit_message="Update AI Flashcards App"
fi

# Commit changes
echo -e "${GREEN}Committing changes...${NC}"
git commit -m "$commit_message"
echo ""

# Check if remote exists
remote_exists=$(git remote -v | grep origin)

if [ -z "$remote_exists" ]; then
  echo -e "${YELLOW}No remote repository found.${NC}"
  echo -e "To add a remote repository, run:"
  echo -e "${GREEN}git remote add origin <your-repository-url>${NC}"
  echo -e "Then push your changes with:"
  echo -e "${GREEN}git push -u origin main${NC}"
else
  echo -e "${YELLOW}Would you like to push changes to remote repository? (y/n)${NC}"
  read -p "> " push_changes
  
  if [[ $push_changes == "y" || $push_changes == "Y" ]]; then
    echo -e "${GREEN}Pushing changes to remote repository...${NC}"
    git push
  fi
fi

echo ""
echo -e "${GREEN}Git operations completed!${NC}" 