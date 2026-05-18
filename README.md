# GenStudio

GenStudio is a full-stack, responsive web application for creating stunning AI-generated imagery. It leverages fal.ai for lightning-fast inference on Flux models and Supabase for persistent, real-time generation tracking, featuring an integrated image editor and robust iteration tools.

## How to Run Locally

Follow these steps to get the application running on your local machine:

1. **Clone and Install Dependencies**
   ```bash
   git clone https://github.com/btw-saanvi/Jinxed-network-assignment.git
   cd Jinxed-network-assignment
   npm install
   ```

2. **Configure Environment Variables**
   Create a `.env.local` file in the root directory based on the provided `.env.local.example` structure.
   
3. **Setup Supabase Database**
   Execute the SQL commands found inside `/supabase/schema.sql` in your Supabase SQL Editor to construct the `generations` table.

4. **Start the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables Needed

You will need to acquire the following keys and map them inside `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`: Your project URL from the Supabase Dashboard -> Settings -> API.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your anon public key from the Supabase Dashboard -> Settings -> API.
- `HF_KEY`: Your secret API key / access token from Hugging Face.

## Architecture Diagram

```text
+-------------------+       HTTP POST       +-------------------+
|                   |  /api/generate/route  |                   |
|   Next.js Client  | --------------------> |   Next.js Server  |
|  (Zustand State)  |                       |  (API Endpoints)  |
|                   | <-------------------- |                   |
+--------+----------+      Status/URL       +---------+---------+
         |                                            |
         | Supabase Client                            | fetch() directly
         v                                            v
+-------------------+                       +-------------------+
|                   |                       |                   |
| Supabase Postgres |                       | Hugging Face Cloud|
|  (generations DB) |                       | (FLUX.1-schnell)  |
|                   |                       |                   |
+-------------------+                       +-------------------+
```

## Vercel Deployment Instructions

Deploying GenStudio to Vercel is quick and simple. Follow these steps:

1. **Fork the Repository**
   - Fork this repository to your own GitHub/GitLab account.
   
2. **Setup Supabase Database**
   - Create a free project on [Supabase](https://supabase.com).
   - Go to the **SQL Editor** in your Supabase project dashboard.
   - Click "New Query", paste the contents of `supabase/schema.sql`, and click **Run** to set up the `generations` table.

3. **Deploy on Vercel**
   - Log in to your [Vercel Dashboard](https://vercel.com).
   - Click **Add New** -> **Project** and import your forked repository.
   
4. **Configure Environment Variables**
   - In the Vercel project configuration page, add the following Environment Variables:
     - `NEXT_PUBLIC_SUPABASE_URL` (Your Supabase project URL)
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Your Supabase anon API key)
     - `HF_KEY` (Your Hugging Face API token)
   - Click **Deploy** and your app will be live in seconds!

## Future Technical Planning

Read the internal technical specification for the planned custom model training capabilities here: [LORA_PLAN.md](./LORA_PLAN.md).

## Note on Time Spent
*Approximately 4 hours were spent developing the core generation engine, real-time gallery tracking, advanced UI iteration features, and the Fabric.js interactive canvas editor.*
