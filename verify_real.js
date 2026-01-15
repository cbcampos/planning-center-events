const { handler } = require('./netlify/functions/planning-center-events');

console.log('Testing connection to Planning Center...');

const event = {
    httpMethod: 'GET',
    queryStringParameters: { limit: '2' }
};

handler(event, {})
    .then(response => {
        console.log('Status Code:', response.statusCode);

        if (response.statusCode === 200) {
            const body = JSON.parse(response.body);
            console.log(`SUCCESS: Fetched ${body.events.length} events from Planning Center.`);
            if (body.events.length > 0) {
                console.log('Sample Event:', body.events[0].title);
            } else {
                console.log('No upcoming events found (but connection worked).');
            }
        } else if (response.statusCode === 500) {
            // Parse error to see if it's credentials or something else
            const body = JSON.parse(response.body);
            if (body.error && body.error.includes('Missing credentials')) {
                console.error('FAIL: Still missing credentials. Check .env file.');
            } else {
                console.error('FAIL: PCO API Error:', body.error);
            }
        } else {
            console.log('Response:', response.body);
        }
    })
    .catch(err => {
        console.error('CRITICAL: Unexpected error:', err);
    });
