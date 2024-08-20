import { json } from '@sveltejs/kit';

   const API_BASE_URL = 'http://127.0.0.1:5000';

   export async function POST({ request }) {
       const drill = await request.json();
       console.log('Request body:', JSON.stringify(drill, null, 2));
       console.log('Sending request to Flask server...');
       try {
           console.log(`Sending POST request to ${API_BASE_URL}/api/drills`);
           const response = await fetch(`${API_BASE_URL}/api/drills`, {
               method: 'POST',
               headers: {
                   'Content-Type': 'application/json'
               },
               body: JSON.stringify(drill)
           });
           console.log('Response received from Flask server.');
           console.log('Response status:', response.status);
           console.log('Response headers:', JSON.stringify(Object.fromEntries(response.headers), null, 2));
           
           if (response.ok) {
               const data = await response.json();
               console.log('Response body:', JSON.stringify(data, null, 2));
               return json(data);
           } else {
               const errorText = await response.text();
               console.log('Error response body:', errorText);
               try {
                   const errorData = JSON.parse(errorText);
                   console.log('Parsed error data:', errorData);
                   return json({ error: 'Failed to create drill', details: errorData }, { status: response.status });
               } catch (parseError) {
                   console.log('Failed to parse error response as JSON');
                   return json({ error: 'Failed to create drill', rawError: errorText }, { status: response.status });
               }
           }
       } catch (error) {
           console.error('Error occurred while sending request:', error);
           return json({ error: 'An error occurred while sending the request', details: error.toString() }, { status: 500 });
       }
   }

export async function GET() {
    const response = await fetch(`${API_BASE_URL}/api/drills`);

    if (response.ok) {
        const data = await response.json();
        return json(data);
    } else {
        return json({ error: 'Failed to retrieve drills' }, { status: response.status });
    }
}
