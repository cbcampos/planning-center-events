require('dotenv').config();
const axios = require('axios');

async function inspectTagGroups() {
    const appId = process.env.EXPO_PUBLIC_PCO_APPLICATION_ID || process.env.PC_APP_ID;
    const secret = process.env.EXPO_PUBLIC_PCO_SECRET || process.env.PC_SECRET;

    if (!appId || !secret) {
        console.error('Missing credentials');
        return;
    }

    try {
        console.log('Fetching Tag Groups...');
        const response = await axios.get('https://api.planningcenteronline.com/calendar/v2/tag_groups?include=tags', {
            auth: { username: appId, password: secret }
        });

        const groups = response.data.data;
        const includedTags = response.data.included || [];

        console.log(`Found ${groups.length} Tag Groups.`);
        console.log(`Found ${includedTags.length} Included Tags.`);

        // Build Map
        const tagMap = {};

        // 1. Map Group ID to Group Name
        const groupMap = {};
        groups.forEach(g => {
            groupMap[g.id] = g.attributes.name;
            console.log(`Group: ${g.attributes.name} (ID: ${g.id})`);
            console.log(JSON.stringify(g.relationships, null, 2));
        });

        // 2. Map Tag ID to Group Name (via 'relationships.tag_group.data.id' in included tags?)
        // Let's inspect an included tag to see if it links back to group
        if (includedTags.length > 0) {
            console.log('\n--- Included Tag Example ---');
            console.log(JSON.stringify(includedTags[0], null, 2));
        }

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

inspectTagGroups();
