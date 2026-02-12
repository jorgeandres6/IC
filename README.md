<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1JdgE_REfRJHCWJH43WO7prIu724XsRwB

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy on Vercel

1. Push this repository to GitHub (or GitLab/Bitbucket).
2. Create a new Vercel project and import the repo.
3. Configure environment variables:
   - `GEMINI_API_KEY` (same value you use locally)
4. Build settings (auto-detected, but listed here for clarity):
   - Build Command: `npm run build`
   - Output Directory: `dist`

The app includes a Vercel rewrite to serve `index.html` for all routes.
# IC
