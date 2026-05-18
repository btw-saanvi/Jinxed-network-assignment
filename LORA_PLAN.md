## Custom LoRA Style Training Plan

### Overview
This feature enables users to fine-tune Flux AI models on their own custom subjects or unique art styles by training LoRAs (Low-Rank Adaptations). From the user's perspective, they navigate to a new "Train LoRA" section, upload 10-20 high-quality images of a specific subject, assign a unique trigger word, and start the training process. Once completed, the custom LoRA becomes available in a selector on the main Generate page, allowing users to effortlessly generate images that match their specific trained aesthetic.

### Training Pipeline
- **Data Requirements**: Users upload a minimum of 10 (maximum 30) images in JPEG/PNG format. The client side compresses these images into a single `.zip` file archive.
- **Service Handler**: Training is orchestrated via the fal.ai LoRA fast trainer API (`fal-ai/flux-lora-fast-training`). The zip file is temporarily uploaded to a Fal storage endpoint to begin the training sequence.
- **Cost & Time Estimates**: Fast LoRA training for Flux takes roughly 10-15 minutes per run. Depending on the step configurations, the estimated infrastructure cost is approximately $1.50 to $2.00 per completed training job.

### Storage Architecture
- **Schema Addition**: A new `loras` table will be introduced to the Supabase schema:
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key mapped to auth)
  - `name` (text, friendly display name)
  - `weight_url` (text, direct URL to the Safetensors file)
  - `trigger_word` (text, prompt trigger keyword)
  - `created_at` (timestamp)
  - `status` (text: 'pending', 'training', 'done', 'failed')
- **Weight Storage**: After Fal completes the training, the resulting `.safetensors` model weights are fetched and persisted permanently within a dedicated Supabase Storage bucket (`lora-weights`), protecting against Fal's temporary data purges.
- **Inference Integration**: During generation, if a LoRA is selected, its `weight_url` is retrieved from the `loras` table and passed inside the `loras` array parameter within the `fal.subscribe()` request body:
  `loras: [{ path: weight_url, scale: 1.0 }]`

### UI Changes Needed
- **LoRA Upload/Train Flow**: A new `/loras/train` route featuring a drag-and-drop file uploader for the image dataset, a text input for the `trigger_word`, and a real-time progress indicator polling the DB for status changes.
- **Generate Page Selector**: An optional "Select LoRA" dropdown component integrated into the Generate form, populated by fetching the user's completed LoRAs.
- **Per-Card Indicators**: The `GenerationCard` component on the gallery page will be updated to display a subtle badge (e.g., `lora: my-custom-style`) whenever a LoRA was utilized in the generation settings.

### Limitations & Risks
- **Training Cost Control**: Unrestricted access could lead to massive API cost spikes. Mitigation involves implementing a Stripe paywall or credit system restricting users to a set number of training runs.
- **Storage Limits**: Since `.safetensors` files range from 50MB to 500MB, a strict cap on active LoRAs per account (e.g., 3 max) must be enforced to remain within Supabase storage bounds.
- **Style Drift**: LoRAs trained on inconsistent or low-resolution datasets can experience style degradation or visual "burn-in". To counter this, the platform will enforce dataset validation rules and default the inference LoRA scale to `0.85` to maintain visual fidelity.
