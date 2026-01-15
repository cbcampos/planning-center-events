require('dotenv').config();
const axios = require('axios');

async function inspectEvents() {
    const appId = process.env.EXPO_PUBLIC_PCO_APPLICATION_ID || process.env.PC_APP_ID;
    const secret = process.env.EXPO_PUBLIC_PCO_SECRET || process.env.PC_SECRET;

    if (!appId || !secret) {
        console.error('Missing credentials');
        return;
    }

    try {
        const now = new Date().toISOString();
        console.log('Fetching events...');

        const response = await axios.get('https://api.planningcenteronline.com/calendar/v2/event_instances', {
            auth: { username: appId, password: secret },
            params: {
                'where[starts_at][gte]': now,
                'order': 'starts_at',
                'per_page': 1, // Just get one to see structure
                'include': 'event,event.tags' // Try to include tags
            }
        });

        console.log('--- EVENT INSTANCE ATTRIBUTES ---');
        console.log(JSON.stringify(response.data.data[0].attributes, null, 2));

        console.log('\n--- INCLUDED ITEMS ---');
        if (response.data.included && response.data.included.length > 0) {
            // Group by type to see what we got
            const types = {};
            response.data.included.forEach(item => {
                if (!types[item.type]) types[item.type] = [];
                types[item.type].push(item);
            });

            Object.keys(types).forEach(type => {
                console.log(`\nType: ${type} (Count: ${types[type].length})`);
                console.log(JSON.stringify(types[type][0], null, 2));
            });

            // Check if any event has relationships to tags
            const events = types['Event'] || [];
            if (events.length > 0) {
                console.log('\n--- Event Relationships ---');
                console.log(JSON.stringify(events[0].relationships, null, 2));
            }

        } else {
            console.log('No included items found.');
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) console.error(error.response.data);
    }
}

inspectEvents();
