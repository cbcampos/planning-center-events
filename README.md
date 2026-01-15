# Planning Center Events Service for Netlify

This project deploys a secure, serverless Netlify Function that authenticates with the Planning Center Online (PCO) API and serves a public JSON endpoint of your upcoming calendar events.

It includes a demo HTML page showing how to embed these events on any website (Squarespace, Webflow, WordPress, etc.).

## Features
- **Secure**: PCO credentials (`EXPO_PUBLIC_PCO_APPLICATION_ID`, `EXPO_PUBLIC_PCO_SECRET`) are stored in Netlify environment variables, never exposed to the browser.
- **Fast**: Runs as a serverless function.
- **CORS Enabled**: Can be called from any domain.
- **Reusable**: One endpoint for all your websites.

## Setup & Deployment

1.  **Deploy to Netlify**:
    - Push this repository to your GitHub account.
    - Log in to Netlify and create a "New site from Git".
    - Choose this repository.
    - Netlify will detect the `netlify.toml` automatically.

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
