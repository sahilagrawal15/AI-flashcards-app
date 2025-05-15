#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Fixing unescaped quotes for Vercel deployment${NC}"

# Find and replace ' with &apos; in JSX content
find ./src -type f -name "*.tsx" -exec sed -i '' "s/'/&apos;/g" {} \;

echo -e "${YELLOW}Quote replacement complete. This is a simple fix that might need manual review.${NC}"
echo "Some legitimate quotes in strings might have been replaced."
echo "Verify your components still display text correctly."

echo -e "${GREEN}You can now try deploying to Vercel again.${NC}" 