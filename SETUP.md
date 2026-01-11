# RefereeAI Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   
   Create a `.env.local` file in the root directory:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Then edit `.env.local` and add your API keys:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   LLM_PROVIDER=groq
   GROQ_MODEL=llama-3.1-70b-versatile
   ```

3. **Get a GROQ API Key**
   - Visit [https://console.groq.com](https://console.groq.com)
   - Sign up or log in
   - Navigate to API Keys section
   - Create a new API key
   - Copy it to your `.env.local` file

4. **Run the Development Server**
   ```bash
   npm run dev
   ```

5. **Open in Browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Variables

### Required (for GROQ)
- `GROQ_API_KEY`: Your GROQ API key

### Optional
- `LLM_PROVIDER`: Either `groq` (default) or `gemini`
- `GROQ_MODEL`: Model to use (default: `llama-3.1-70b-versatile`)
- `GEMINI_API_KEY`: Required if using Gemini provider
- `GEMINI_MODEL`: Model to use for Gemini (default: `gemini-pro`)

## Switching to Gemini (Future)

When ready to use Gemini:

1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Update `.env.local`:
   ```
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-pro
   ```

## Troubleshooting

### "GROQ_API_KEY is not configured"
- Make sure `.env.local` exists in the root directory
- Verify the API key is correctly set (no extra spaces or quotes)
- Restart the development server after changing environment variables

### API Errors
- Check that your API key is valid and has credits/quota
- Verify the model name is correct
- Check network connectivity

### Build Errors
- Run `npm install` again to ensure all dependencies are installed
- Clear `.next` folder: `rm -rf .next`
- Try `npm run build` to see detailed error messages
