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
- `FAL_KEY`: Your secret API key from your [fal.ai Dashboard](https://fal.ai/dashboard/keys).
- `NEXT_PUBLIC_FAL_KEY`: *Optional client-side proxy key for Fal.*

## Architecture Diagram

```text
+-------------------+       HTTP POST       +-------------------+
|                   |  /api/generate/route  |                   |
|   Next.js Client  | --------------------> |   Next.js Server  |
|  (Zustand State)  |                       |  (API Endpoints)  |
|                   | <-------------------- |                   |
+--------+----------+      Status/URL       +---------+---------+
         |                                            |
         | Supabase Client                            | fal-serverless
         v                                            v
+-------------------+                       +-------------------+
|                   |                       |                   |
| Supabase Postgres |                       | fal.ai GPU Cloud  |
|  (generations DB) |                       |  (Flux Dev/Schnell)|
|                   |                       |                   |
+-------------------+                       +-------------------+
```

## Future Technical Planning

Read the internal technical specification for the planned custom model training capabilities here: [LORA_PLAN.md](./LORA_PLAN.md).

## Note on Time Spent
*Approximately 4 hours were spent developing the core generation engine, real-time gallery tracking, advanced UI iteration features, and the Fabric.js interactive canvas editor.*
