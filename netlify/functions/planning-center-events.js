// Load environment variables for local development
require('dotenv').config();
const axios = require('axios');

// Simple in-memory cache
// Note: In serverless functions, this persists only as long as the container is warm.
// This is not a guaranteed persistent cache, but effective for high-traffic bursts.
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 Minutes

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

  // --- Cache Check ---
  // Create a unique key based on the query parameters (limit, id, etc.)
  const cacheKey = JSON.stringify(event.queryStringParameters || {});

  if (cache.has(cacheKey)) {
    const cachedItem = cache.get(cacheKey);
    const isExpired = (Date.now() - cachedItem.timestamp) > CACHE_TTL;

    if (!isExpired) {
      // console.log('Serving from cache:', cacheKey); // Optional debug
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          events: cachedItem.data,
          _cached: true, // Internal flag useful for debugging
          _cached_at: new Date(cachedItem.timestamp).toISOString()
        })
      };
    } else {
      cache.delete(cacheKey); // Cleanup expired
    }
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

    // --- 3. Fetch Data ---
    // We need both events and tag groups to provide the hierarchy.
    // Fetch in parallel.

    // Prepare Event Request
    let eventPromise;
    if (singleId) {
      eventPromise = axios.get(`https://api.planningcenteronline.com/calendar/v2/event_instances/${singleId}`, {
        auth: { username: appId, password: secret },
        params: { 'include': 'event,event.tags' }
      });
    } else {
      eventPromise = axios.get('https://api.planningcenteronline.com/calendar/v2/event_instances', {
        auth: { username: appId, password: secret },
        params: {
          'where[starts_at][gte]': now,
          'order': 'starts_at',
          'per_page': limit,
          'include': 'event,event.tags'
        }
      });
    }

    // Prepare Tag Group Request (Fetch all to build map)
    const groupPromise = axios.get('https://api.planningcenteronline.com/calendar/v2/tag_groups?include=tags', {
      auth: { username: appId, password: secret }
    });

    const [eventResponse, groupResponse] = await Promise.all([eventPromise, groupPromise]);

    // --- 4. Process Tag Groups ---
    const tagToGroupMap = {};
    const groups = groupResponse.data.data || [];
    groups.forEach(group => {
      const groupName = group.attributes.name;
      // The group relationships contains the tags
      if (group.relationships && group.relationships.tags && group.relationships.tags.data) {
        group.relationships.tags.data.forEach(tagRef => {
          tagToGroupMap[tagRef.id] = groupName;
        });
      }
    });

    // --- 5. Process Events ---
    const instances = Array.isArray(eventResponse.data.data) ? eventResponse.data.data : [eventResponse.data.data];
    const included = eventResponse.data.included || [];

    // Create maps for easy lookup
    const eventsMap = {};
    const tagsMap = {};

    included.forEach(item => {
      if (item.type === 'Event') {
        eventsMap[item.id] = item;
      } else if (item.type === 'Tag') {
        tagsMap[item.id] = item.attributes;
      }
    });

    // Transform the data
    const formattedEvents = instances.map(instance => {
      const eventDetails = eventsMap[instance.relationships.event.data.id] || {};
      const attributes = instance.attributes;

      // Resolve tags
      const tagIds = eventDetails.relationships && eventDetails.relationships.tags && eventDetails.relationships.tags.data
        ? eventDetails.relationships.tags.data.map(t => t.id)
        : [];

      const tags = tagIds.map(id => {
        const tagAttr = tagsMap[id];
        if (!tagAttr) return null;
        return {
          name: tagAttr.name,
          color: tagAttr.color,
          group: tagToGroupMap[id] || null // Add Group Name
        };
      }).filter(t => t);

      return {
        id: instance.id,
        title: attributes.name || 'Untitled Event', // Instance name usually overrides event name
        start_time: attributes.published_starts_at || attributes.starts_at, // Prefer published time
        end_time: attributes.published_ends_at || attributes.ends_at,
        location: attributes.location,
        description: eventDetails.attributes ? eventDetails.attributes.summary : '',
        image_url: eventDetails.attributes ? eventDetails.attributes.image_url : null,
        registration_url: eventDetails.attributes ? eventDetails.attributes.registration_url : null,
        church_center_url: attributes.church_center_url,
        tags: tags
      };
    });

    // --- Set Cache ---
    cache.set(cacheKey, {
      data: formattedEvents,
      timestamp: Date.now()
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
