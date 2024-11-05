import { ANTHROPIC_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';

export async function POST({ request }) {
  try {
    const { description } = await request.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
      },
      body: JSON.stringify({
        model: 'claude-3.5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Given this drill description, create a diagram instruction using only available elements (players, quaffles, bludgers, cones, hoops). 
          There are two teams, red and blue. There is one quaffle, and three bludgers. Chasers and keepers use the quaffle, beaters use bludgers. Return valid JSON matching this format:
          {
            "elements": [
              { "type": "player", "position": { "x": 100, "y": 100 }, "team": "red", "role": "chaser" },
              { "type": "quaffle", "position": { "x": 200, "y": 200 } }
            ],
            "annotations": [
              { "type": "text", "position": { "x": 150, "y": 150 }, "content": "Start here" }
            ]
          }

          Description: ${description}`
        }]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate diagram');
    }

    const data = await response.json();
    const generatedInstructions = JSON.parse(data.content[0].text);

    return json(generatedInstructions);
  } catch (error) {
    console.error('Error generating diagram:', error);
    return json({ error: 'Failed to generate diagram' }, { status: 500 });
  }
}