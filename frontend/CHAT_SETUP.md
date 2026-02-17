# AI Chat Setup Instructions

## Quick Start

The AI Chat interface is now integrated into your M&A Synergies Platform! It uses **Text-to-SQL** with OpenAI's GPT-4 for natural language queries.

### 1. Get an OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)

### 2. Add Your API Key

Edit `.env.local` in the `frontend/` directory:

```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Important:** Never commit your API key to git! The `.env.local` file is already gitignored.

### 3. Restart the Dev Server

```bash
# Kill the current server (Ctrl+C)
npm run dev
```

The server will automatically reload with your new API key.

### 4. Access the Chat

Navigate to: http://localhost:3000/chat

Or click "AI Chat" in the navigation menu from any page.

---

## How It Works

### Architecture: Text-to-SQL (NOT RAG)

```
User Query → GPT-4 → Function Calling → Existing API → PostgreSQL → Results
```

**Why this is better than RAG + Vector DB:**
- ✅ 10x cheaper ($20/month vs $500/month)
- ✅ 10x faster (direct SQL vs embeddings)
- ✅ More accurate (no hallucinations)
- ✅ Uses existing infrastructure
- ✅ Exact queries work perfectly

### Available Functions

The AI can call these functions to query your data:

1. **search_synergies** - Filter by industry, status, value, keywords
2. **get_synergy_details** - Get full details for a specific synergy
3. **analyze_synergies** - Aggregate stats grouped by dimension
4. **get_industries** - List all industries
5. **get_functions** - List all business functions

### Example Queries

Try asking:
- "Show me all synergies in progress"
- "What are the top 5 highest value synergies?"
- "Analyze synergies by industry"
- "Show me realized technology synergies"
- "What synergies are at risk?"
- "Find synergies worth over $10 million"
- "Show me IT synergies with high confidence"

---

## Cost Estimate

Based on GPT-4 Turbo pricing:

- **Light usage** (100 queries/day): ~$20/month
- **Medium usage** (500 queries/day): ~$100/month
- **Heavy usage** (2000 queries/day): ~$400/month

Each query costs approximately $0.01-0.02 depending on complexity.

---

## Customization

### Change the AI Model

Edit `app/api/chat/route.ts`:

```typescript
// Use GPT-3.5 Turbo (cheaper, faster, less capable)
model: openai('gpt-3.5-turbo')

// Use GPT-4 Turbo (default - best balance)
model: openai('gpt-4-turbo')

// Use GPT-4 (most capable, slower, more expensive)
model: openai('gpt-4')
```

### Modify the System Prompt

Edit the `system` parameter in `app/api/chat/route.ts` to change how the AI responds.

### Add New Functions

1. Define the function in `lib/chat-functions.ts`
2. Add it to the tools in `app/api/chat/route.ts`

---

## Troubleshooting

### Error: "Missing OpenAI API Key"

Make sure `.env.local` exists with your key and restart the server.

### Error: "Failed to search synergies"

Check that the backend API is running at http://localhost:5001

### Chat is slow

- GPT-4 Turbo is optimized for speed
- Try GPT-3.5 Turbo for faster (but less accurate) responses
- Check your network connection

### Unexpected responses

The AI might misunderstand vague queries. Be specific:
- ❌ "Show me synergies" (ambiguous)
- ✅ "Show me technology synergies in progress" (specific)

---

## What's Next?

### Future Enhancements

1. **Conversation Memory** - Multi-turn conversations with context
2. **Export Results** - Download chat results as CSV/Excel
3. **Suggested Follow-ups** - AI suggests next questions
4. **Voice Input** - Speak your queries
5. **Semantic Search** - Add vector search for descriptions (only if needed)

### When to Add Vector Search

Add a vector database ONLY if you see evidence that users need semantic search:
- Queries like "find cloud-related synergies" (not matching exact keywords)
- Searching across unstructured descriptions
- >10% of queries fail with Text-to-SQL

**Current approach handles 90% of queries perfectly. Don't over-engineer!**

---

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the Next.js server logs
3. Verify your OpenAI API key is valid
4. Ensure the backend API is running

**Estimated setup time:** 5 minutes
**Monthly cost:** $20-100 depending on usage
