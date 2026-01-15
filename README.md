# Planning Center Events Service for Netlify

This project deploys a secure, serverless Netlify Function that authenticates with the Planning Center Online (PCO) API and serves a public JSON endpoint of your upcoming calendar events.

It includes a demo HTML page showing how to embed these events on any website (Squarespace, Webflow, WordPress, etc.).

## Features
- **Secure**: PCO credentials (`EXPO_PUBLIC_PCO_APPLICATION_ID`, `EXPO_PUBLIC_PCO_SECRET`) are stored in Netlify environment variables, never exposed to the browser.
- **Fast**: Runs as a serverless function.
- **CORS Enabled**: Can be called from any domain.
- **Reusable**: One endpoint for all your websites.

## 🚀 For Other Churches: How to Use This

You can deploy your own version of this tool for free in about 2 minutes. You don't need to be a developer.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/cbcampos/planning-center-events)

### Step 1: Click the Button
Click the **Deploy to Netlify** button above. This will:
1.  Ask you to connect your GitHub account.
2.  Clone this code into your own repository.
3.  Create a new site on Netlify for you.

### Step 2: Enter Your Credentials
During the setup (or in **Site Settings > Environment Variables** after), enter your Planning Center keys:
- `EXPO_PUBLIC_PCO_APPLICATION_ID`: Your Application ID.
- `EXPO_PUBLIC_PCO_SECRET`: Your Secret.

> **Where do I get these?**
> 1. Go to [Planning Center Developer API](https://api.planningcenteronline.com/oauth/applications).
> 2. Click "New Personal Access Token" (easiest) or "New Application".
> 3. Copy the ID and Secret immediately.

### Step 3: Embed on Your Site
Once deployed, Netlify will give you a URL (e.g., `https://your-church-events.netlify.app`).

1.  Go to your website builder (Squarespace, Webflow, etc.).
2.  Add a **Code Block**.
3.  Paste the following (updating the URL to match yours):

```html
<div id="events-container">Loading events...</div>
<div id="detail-container" class="detail-view" style="display:none;">
    <a href="#" class="back-link" onclick="goBack(event)">← Back</a>
    <div id="detail-content"></div>
</div>

<script>
    // UPDATE THIS URL to your Netlify site URL
    const BASE_URL = 'https://your-church-events.netlify.app/.netlify/functions/planning-center-events';
</script>
<script src="https://cbcampos.github.io/planning-center-events/embed.js"></script>
<link rel="stylesheet" href="https://cbcampos.github.io/planning-center-events/embed.css">
```

*(Note: We recommend hosting the JS/CSS files yourself or copying the content from `public/index.html` into your code block for full control).*

## Features

2.  **Configure Environment Variables**:
    - In your Netlify Site Dashboard, go to **Site configuration > Environment variables**.
    - Add the following variables:
        - `EXPO_PUBLIC_PCO_APPLICATION_ID`: Your Planning Center Application ID.
        - `EXPO_PUBLIC_PCO_SECRET`: Your Planning Center Secret.
    > To get these, go to [Planning Center Developer API](https://api.planningcenteronline.com/oauth/applications) and create a "Personal Access Token" or a new Application.

3.  **Visit your Site**:
    - The demo page will be at your main Netlify URL (e.g., `https://your-site-name.netlify.app`).
    - The API endpoint will be at `https://your-site-name.netlify.app/.netlify/functions/planning-center-events`.

## Usage

### API Endpoint
GET `/.netlify/functions/planning-center-events?limit=5`

**Response:**
```json
{
  "events": [
    {
      "id": "123",
      "title": "Sunday Service",
      "start_time": "2023-11-20T10:00:00Z",
      "end_time": "2023-11-20T11:30:00Z",
      "description": "Join us for worship.",
      "location": "Main Auditorium"
    }
  ]
}
```

### Embedding on Your Website (Squarespace/Webflow)

Copy the JavaScript code from `public/index.html` (inside the `<script>` tag) and place it into a "Code Block" or "Embed" element on your site. Update the `API_ENDPOINT` variable to point to your deployed Netlify URL.

## Local Development

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Install Netlify CLI (optional but recommended):
    ```bash
    npm install -g netlify-cli
    ```
3.  Run locally:
    ```bash
    netlify dev
    ```
    This will start a local server where you can test the function and the frontend.
