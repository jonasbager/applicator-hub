#!/bin/bash

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cat > .env << EOL
# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Clerk
CLERK_SECRET_KEY=your-clerk-secret-key

# Migration
TEMP_PASSWORD=TemporaryPassword123!
EOL
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Create dist directory
echo "Creating dist directory..."
mkdir -p dist

# Build TypeScript
echo "Building TypeScript..."
npm run typecheck

echo "Setup complete! Next steps:"
echo "1. Add your Supabase and Clerk credentials to .env"
echo "2. Run 'npm run migrate' to start the migration"
echo "3. Check the logs for any errors"
