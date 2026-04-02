# 🚨 IMPORTANT: Set Your Groq API Key!

Before you can play the game, you need to add your Groq API key.

## Quick Setup (2 minutes)

1. **Get a free Groq API key**:
   - Visit: https://console.groq.com
   - Sign up/login (Google/GitHub login works)
   - Go to "API Keys" section
   - Click "Create API Key"
   - Copy the key (starts with `gsk_...`)

2. **Add it to your .env file**:
   - Open the `.env` file in the root directory
   - Replace `your_groq_api_key_here` with your actual key:
   ```
   VITE_GROQ_API_KEY=gsk_your_actual_key_here
   ```
   - Save the file

3. **Restart the dev server**:
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

4. **Open the game**:
   - Navigate to http://localhost:5173
   - You should see the opening sequence!

## Troubleshooting

### "The dungeon master has gone silent"
- Your API key is missing or invalid
- Check the `.env` file has the correct format
- Make sure you restarted the dev server after editing `.env`

### Still not working?
- Open browser DevTools (F12)
- Check the Console tab for error messages
- Look for "401 Unauthorized" → invalid API key
- Look for "CORS" error → try in a different browser

## What You'll See

Once configured correctly:
1. ✅ Typewriter opening sequence
2. ✅ Atmospheric dungeon scene with animated torches
3. ✅ 4 NPCs displayed with disposition indicators
4. ✅ HP bar (100/100), Gold (15g)
5. ✅ Text input: "What do you do?"
6. ✅ AI narration streaming word-by-word when you submit actions

## Test Actions

Try these to see the AI in action:
- "Talk to the merchant"
- "Ask the merchant about Crow"
- "Bribe the left guard with 10 gold"
- "Attack the right guard"

Each action will stream a unique AI-generated narration!

---

**Need Help?** Check GAME_README.md for full documentation.
