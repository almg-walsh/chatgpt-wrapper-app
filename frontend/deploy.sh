#!/bin/bash

# Build the project
npm run build

# Go to the build directory
cd dist

# Create a .nojekyll file to bypass GitHub Pages' Jekyll processing
touch .nojekyll

# Initialize a new git repository
git init
git checkout -B main

# Add all files
git add .

# Commit
git commit -m "Deploy to GitHub Pages"

# Force push to the gh-pages branch using HTTPS instead of SSH
git push -f https://github.com/almg-walsh/chatgpt-wrapper-app.git main:gh-pages

# Clean up
cd ..