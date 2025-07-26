#!/bin/bash

# ARTEMIS Deployment Script

echo "🚀 ARTEMIS Deployment Script"
echo "=========================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "Initializing Git repository..."
    git init
fi

# Add all files
echo "Adding all files to Git..."
git add .

# Commit
echo "Creating commit..."
git commit -m "Complete ARTEMIS implementation - AI-powered sales intelligence platform"

# Check if remote exists
if ! git remote | grep -q "origin"; then
    echo ""
    echo "⚠️  No remote repository found!"
    echo "Please add your GitHub repository:"
    echo ""
    echo "git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
    echo ""
    echo "Then run: git push -u origin main"
else
    echo ""
    echo "Pushing to remote repository..."
    git push origin main
fi

echo ""
echo "✅ Local deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Check DEPLOYMENT_KEYS_PRIVATE.md for all environment variables"
echo "2. Deploy backend to Render"
echo "3. Deploy frontend to Vercel"
echo "4. Update Google OAuth redirect URIs"
echo "5. Update CORS settings with production URLs"
echo ""
echo "Happy deploying! 🎉"
