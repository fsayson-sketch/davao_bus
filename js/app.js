/**
 * Main Application Controller for Davao Bus NearMe
 */

const mapManager = new MapManager('map', [7.0650, 125.5700]);
let routeManager;

async function init() {
    try {
        // Adding cache buster forces the browser to download fresh data
        const response = await fetch('routes.json?v=' + Date.now()); 
        const data = await response.json();
        routeManager = new RouteManager(data.stations, data.all_routes);
        renderUI(data.all_routes);
    } catch (err) { 
        console.error("Initialization failed:", err); 
    }
}

function renderUI(routes) {
    const list = document.getElementById('route-list');
    const groups = [...new Set(routes.map(r => r.id.split('-')[0]))];
    list.innerHTML = ""; 

    const arrowIcon = `<svg style="width:12px;height:12px;margin:0 4px;vertical-align:middle;" viewBox="0 0 24 24"><path fill="currentColor" d="M17,11H3V9H17V5L21,10L17,15V11M7,13V17L3,12L7,7V11H21V13H7Z" /></svg>`;

    groups.forEach(groupId => {
        const am = routeManager.getRouteById(`${groupId}-AM`);
        const pm = routeManager.getRouteById(`${groupId}-PM`);
        const routeData = am || pm;
        
        if (routeData) {
            const parts = routeData.name.replace(/\(AM\)|\(PM\)/g, '').split(' to ');
            const origin = parts[0]?.trim().toUpperCase() || "";
            const destination = parts[1]?.trim().toUpperCase() || "";
            const themeColor = routeData.color || '#007bff';

            list.innerHTML += `
                <div class="route-group-box">
                    <div class="main-route-header" style="background: ${themeColor}" onclick="toggleSubCards('${groupId}')">
                        <div class="header-text-container">
                            <span class="route-number-text">ROUTE ${groupId.replace('R','')}</span>
                            <div class="area-badge">
                                <span>${origin}</span>
                                ${arrowIcon}
                                <span>${destination}</span>
                            </div>
                        </div>
                        <svg id="icon-${groupId}" class="arrow-icon" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                    </div>
                    <div class="sub-cards-container" id="container-${groupId}" style="border-left-color: ${themeColor}">
                        ${am ? renderTripCard(am, '☀️', themeColor) : ''}
                        ${pm ? renderTripCard(pm, '🌙', themeColor) : ''}
                    </div>
                </div>`;
        }
    });
}

function renderTripCard(route, emoji, color) {
    return `<div class="route-card" onclick="handleSelect('${route.id}')">
                <div>
                    <span class="route-id" style="background: ${color}">${route.id}</span>
                    <span class="route-name">${route.name}</span>
                </div>
                <div class="schedule-box">
                    <div class="time-badge">${emoji} ${emoji === '☀️' ? route.am : route.pm}</div>
                </div>
            </div>`;
}

async function handleSelect(routeId) {
    const route = routeManager.getRouteById(routeId);
    if (!route) return;

    const coords = route.path.map(name => routeManager.stations[name]).filter(c => c !== undefined);
    if (coords.length === 0) { 
        document.getElementById('nearest-info').innerText = "Station data error."; 
        return; 
    }

    document.getElementById('loader').style.display = "block";
    document.getElementById('bus-id').innerHTML = `<b>Selected:</b> ${route.id}`;
    document.getElementById('nearest-info').innerText = "Calculating road path...";

    await mapManager.drawRoute(coords, route.path, route.color);

    navigator.geolocation.getCurrentPosition(pos => {
        const nearest = routeManager.findNearestStation(pos.coords.latitude, pos.coords.longitude, route.path);
        if (nearest) {
            mapManager.updateUserLocation(pos.coords.latitude, pos.coords.longitude, nearest);
            document.getElementById('nearest-info').innerHTML = `Nearest: <b>${nearest.name}</b> (${nearest.distance.toFixed(2)} km)`;
        }
        document.getElementById('loader').style.display = "none";
    }, () => {
        document.getElementById('loader').style.display = "none";
        document.getElementById('nearest-info').innerText = "Location access denied.";
    }, { enableHighAccuracy: false, timeout: 5000 });
}

function toggleSubCards(id) {
    const container = document.getElementById('container-' + id);
    const icon = document.getElementById('icon-' + id);
    const isOpen = container.style.display === "block";
    container.style.display = isOpen ? "none" : "block";
    icon.classList.toggle("rotate-180", !isOpen);
}

// Global initialization
init();
