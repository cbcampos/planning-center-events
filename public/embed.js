// --- Router Logic ---
function getParams() {
    return new URLSearchParams(window.location.search);
}

function goBack(e) {
    if (e) e.preventDefault();
    // Remove params to go back to list
    const url = new URL(window.location);
    url.searchParams.delete('event_instance_id');
    window.history.pushState({}, '', url);
    render();
}

function viewEvent(id) {
    // Add param to URL
    const url = new URL(window.location);
    url.searchParams.set('event_instance_id', id);
    window.history.pushState({}, '', url);
    render();
}

// Handle back/forward browser buttons
window.onpopstate = render;

// --- Helper for API URL ---
function getApiUrl() {
    if (window.PCO_EVENTS_API_BASE) {
        return window.PCO_EVENTS_API_BASE;
    }
    return '/.netlify/functions/planning-center-events';
}

// --- Main Render Switch ---
function render() {
    const params = getParams();
    const eventId = params.get('event_instance_id');

    if (eventId) {
        showDetail(eventId);
    } else {
        showList();
    }
}

let allEvents = []; // Store fetched events for filtering

// --- List View Logic ---
async function showList() {
    document.getElementById('events-container').style.display = 'flex';
    document.getElementById('detail-container').style.display = 'none';

    // Show filter on list view
    const header = document.getElementById('list-header');
    if (header) header.style.visibility = 'visible';

    const container = document.getElementById('events-container');

    // If we already have events, just re-render (allows back button to keep state)
    if (allEvents.length > 0) {
        renderEvents(allEvents);
        filterEvents();
        return;
    }

    container.innerHTML = '<div class="loading">Loading events...</div>';

    const API_ENDPOINT = getApiUrl() + '?limit=20';

    try {
        const response = await fetch(API_ENDPOINT);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        if (!data.events || data.events.length === 0) {
            container.innerHTML = '<div class="loading">No upcoming events found.</div>';
            return;
        }

        allEvents = data.events; // Store globally
        populateFilters(allEvents);
        renderEvents(allEvents); // Initial render

    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = `<div class="loading">Unable to load events.</div>`;
    }
}

function populateFilters(events) {
    const filterSelect = document.getElementById('category-filter');

    // Collect tags and their groups
    // Map: GroupName -> Set(TagNames)
    const groups = {};
    const noGroupTags = new Set();

    events.forEach(event => {
        if (event.tags) {
            event.tags.forEach(tag => {
                if (tag.group) {
                    if (!groups[tag.group]) groups[tag.group] = new Set();
                    groups[tag.group].add(tag.name);
                } else {
                    noGroupTags.add(tag.name);
                }
            });
        }
    });

    // Clear existing options except first two
    while (filterSelect.options.length > 2) {
        filterSelect.remove(2);
    }

    // Add Grouped Tags
    Object.keys(groups).sort().forEach(groupName => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = groupName;

        Array.from(groups[groupName]).sort().forEach(tagName => {
            const option = document.createElement('option');
            option.value = tagName;
            option.textContent = tagName;
            optgroup.appendChild(option);
        });

        filterSelect.appendChild(optgroup);
    });

    // Add Un-grouped Tags
    if (noGroupTags.size > 0) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = "Other";
        Array.from(noGroupTags).sort().forEach(tagName => {
            const option = document.createElement('option');
            option.value = tagName;
            option.textContent = tagName;
            optgroup.appendChild(option);
        });
        filterSelect.appendChild(optgroup);
    }

    // Add event listener
    filterSelect.onchange = filterEvents;
}

function filterEvents() {
    const selectedCategory = document.getElementById('category-filter').value;
    const container = document.getElementById('events-container');

    let filtered = allEvents;

    if (selectedCategory !== 'all' && selectedCategory !== 'Choose a category') {
        filtered = allEvents.filter(event =>
            event.tags && event.tags.some(tag => tag.name === selectedCategory)
        );
    }

    renderEvents(filtered);
}

function renderEvents(events) {
    const container = document.getElementById('events-container');
    container.innerHTML = '';

    if (events.length === 0) {
        container.innerHTML = '<div class="loading">No events match this filter.</div>';
        return;
    }

    events.forEach(event => {
        const startDate = new Date(event.start_time);

        const month = startDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const day = startDate.getDate();
        const startTime = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        let timeString = startTime;
        if (event.end_time) {
            const endTime = new Date(event.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            timeString += ` - ${endTime}`;
        }

        const location = event.location ? ` • &nbsp; ${event.location}` : '';

        // Render tags
        const tagsHtml = event.tags && event.tags.length > 0
            ? `<div class="event-tags">${event.tags.map(t => `• ${t.name}`).join(' ')}</div>`
            : '';

        const card = document.createElement('div');
        card.className = 'event-row';

        card.innerHTML = `
        <div class="event-date-box">
            <span class="date-month">${month}</span>
            <span class="date-day">${day}</span>
        </div>
        
        <div class="event-content">
            ${tagsHtml}
            <h2 class="event-title">${event.title}</h2>
            <div class="event-meta">
                ${timeString}
                <span class="event-meta-location">${location}</span>
            </div>
        </div>

        <div class="event-action">
            <button onclick="viewEvent('${event.id}')" class="btn-details">View Details</button>
        </div>
    `;
        container.appendChild(card);
    });
}

// --- Detail View Logic ---
async function showDetail(id) {
    // Hide list container
    document.getElementById('events-container').style.display = 'none';

    // Show detail container
    document.getElementById('detail-container').style.display = 'block';

    // Hide filter on detail view
    const header = document.getElementById('list-header');
    if (header) header.style.visibility = 'hidden';

    const content = document.getElementById('detail-content');
    content.innerHTML = '<div class="loading">Loading details...</div>';

    const API_ENDPOINT = getApiUrl() + `?id=${id}`;

    try {
        const response = await fetch(API_ENDPOINT);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        const event = data.events[0];

        if (!event) {
            content.innerHTML = '<div class="loading">Event not found.</div>';
            return;
        }

        const startDate = new Date(event.start_time);
        // Full Date: Wednesday, January 14, 2026
        const fullDate = startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        const startTime = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        let timeString = startTime;
        if (event.end_time) {
            const endTime = new Date(event.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            timeString += ` - ${endTime}`;
        }

        // If we have a registration URL, show Register button.
        const registerBtn = event.registration_url
            ? `<a href="${event.registration_url}" target="_blank" class="btn-register">Register</a>`
            : (event.church_center_url ? `<a href="${event.church_center_url}" target="_blank" class="btn-register">View on Church Center</a>` : '');

        // Image HTML
        const imageHtml = event.image_url
            ? `<img src="${event.image_url}" alt="${event.title}" class="detail-image" />`
            : '';

        content.innerHTML = `
            <div class="detail-grid">
                <div class="detail-sidebar">
                    <h2 class="detail-title">${event.title}</h2>
                    
                    <div class="detail-date-time">
                        <div>${fullDate}</div>
                        <div>${timeString}</div>
                    </div>

                    ${event.location ? `<div class="detail-location">${event.location}</div>` : ''}
                </div>

                <div class="detail-main">
                    ${imageHtml}
                    
                    <div class="detail-description">
                        ${event.description || event.summary || ''}
                    </div>
                    
                    ${registerBtn}
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Error:', error);
        content.innerHTML = `<div class="loading">Unable to load event details.</div>`;
    }
}

document.addEventListener('DOMContentLoaded', render);