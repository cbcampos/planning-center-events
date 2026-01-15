// Load environment variables for local development
require('dotenv').config();
const axios = require('axios');

exports.handler = async function (event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Support both variable naming conventions just in case, prioritizing the user's recent specific ones
  const appId = process.env.EXPO_PUBLIC_PCO_APPLICATION_ID || process.env.PC_APP_ID;
  const secret = process.env.EXPO_PUBLIC_PCO_SECRET || process.env.PC_SECRET;

  if (!appId || !secret) {
    console.error('Missing Planning Center credentials');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server configuration error: Missing credentials' })
    };
  }

  try {
    // Get parameters from query string
    const limit = event.queryStringParameters.limit || 10;
    const singleId = event.queryStringParameters.id;

    // Calculate 'now' in the format PCO expects
    const now = new Date().toISOString();

    let response;

    if (singleId) {
      // Fetch single instance
      response = await axios.get(`https://api.planningcenteronline.com/calendar/v2/event_instances/${singleId}`, {
        auth: { username: appId, password: secret },
        params: { 'include': 'event' }
      });
    } else {
      // Fetch list
      response = await axios.get('https://api.planningcenteronline.com/calendar/v2/event_instances', {
        auth: { username: appId, password: secret },
        params: {
          'where[starts_at][gte]': now,
          'order': 'starts_at',
          'per_page': limit,
          'include': 'event'
        }
      });
    }

    // Handle both single object (data) and array (data[]) responses
    const instances = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
    const included = response.data.included || [];

    // Create a map of events for easy lookup
    const eventsMap = {};
    included.forEach(item => {
      if (item.type === 'Event') {
        eventsMap[item.id] = item;
      }
    });

    // Transform the data
    const formattedEvents = instances.map(instance => {
      const eventDetails = eventsMap[instance.relationships.event.data.id] || {};
      const attributes = instance.attributes;

      return {
        id: instance.id,
        title: attributes.name || 'Untitled Event', // Instance name usually overrides event name
        start_time: attributes.published_starts_at || attributes.starts_at, // Prefer published time
        end_time: attributes.published_ends_at || attributes.ends_at,
        location: attributes.location,
        description: eventDetails.attributes ? eventDetails.attributes.summary : '',
        image_url: eventDetails.attributes ? eventDetails.attributes.image_url : null,
        registration_url: eventDetails.attributes ? eventDetails.attributes.registration_url : null,
        church_center_url: attributes.church_center_url
      };
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ events: formattedEvents })
    };

  } catch (error) {
    console.error('Error fetching from Planning Center:', error.response ? error.response.data : error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch events' })
    };
  }
};
