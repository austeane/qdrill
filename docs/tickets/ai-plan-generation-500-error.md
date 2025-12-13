# AI Plan Generation 500 Error

## Summary
The AI plan generation feature returns a 500 server error when attempting to generate a practice plan.

## Severity
**HIGH** - Core feature completely broken in production

## Discovered
December 12, 2025 - Production testing via Playwright MCP browser automation

## Error Details
```
API Fetch Error (/api/practice-plans/generate-ai): HTTP error! Status: 500
Failed to generate plan with AI: APIError: HTTP error! Status: 500
```

## Steps to Reproduce
1. Navigate to https://www.qdrill.app/practice-plans
2. Click "Create" button
3. In the Create Practice Plan modal, click "Generate with AI"
4. Fill in the AI generation form (duration, skill level, etc.)
5. Click "Generate Plan"
6. Observe 500 error

## Root Cause Analysis

### Code Location
`src/routes/api/practice-plans/generate-ai/+server.js`

### Likely Cause
Missing environment variables in Vercel production deployment. The endpoint supports multiple AI providers:

1. **Anthropic** - Requires `ANTHROPIC_API_KEY`
2. **OpenAI** - Requires `OPENAI_API_KEY`
3. **Google Vertex** - Requires `GOOGLE_VERTEX_PROJECT`, `GOOGLE_VERTEX_LOCATION`, `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`

The code falls back through providers:
```javascript
// Falls back: Google Vertex -> Anthropic -> OpenAI
if (process.env.GOOGLE_VERTEX_PROJECT) {
  provider = 'google-vertex';
} else if (process.env.ANTHROPIC_API_KEY) {
  provider = 'anthropic';
} else if (process.env.OPENAI_API_KEY) {
  provider = 'openai';
} else {
  throw new Error('No AI provider configured');
}
```

If no API keys are configured, or if the configured key is invalid/expired, the request will fail.

## Resolution Steps

### Immediate Fix
1. Check Vercel environment variables dashboard
2. Verify at least one AI provider has valid credentials:
   - `ANTHROPIC_API_KEY` (recommended - Claude)
   - OR `OPENAI_API_KEY`
   - OR Google Vertex credentials
3. Ensure the API key has sufficient quota/credits

### Verification
1. After adding/fixing env vars, redeploy to Vercel
2. Test the AI generation flow in production
3. Confirm successful plan generation

### Long-term Improvements
1. Add better error messages that indicate which provider failed
2. Add a health check endpoint to verify AI configuration
3. Consider adding a fallback to manual creation if AI fails
4. Add Sentry error tracking to capture the specific error details

## Related Files
- `src/routes/api/practice-plans/generate-ai/+server.js` - Main endpoint
- `src/lib/components/practice-plan/AiPlanGenerator.svelte` - Frontend modal

## Notes
- The modal and form work correctly; only the API call fails
- Session was preserved after the error (no authentication issues)
