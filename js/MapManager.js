class MapManager {
    constructor(mapId, center) {
        this.map = L.map(mapId, { zoomControl: false }).setView(center, 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
        
        this.currentPath = null;
        this.markers = [];
        this.userMarker = null;
        this.nearestHighlight = null;
    }

    clearOldLayers() {
        if (this.currentPath) this.map.removeLayer(this.currentPath);
        if (this.nearestHighlight) this.map.removeLayer(this.nearestHighlight);
        this.markers.forEach(m => this.map.removeLayer(m));
        this.markers = [];
    }

    async drawRoute(coords, pathNames, routeColor) {
        this.clearOldLayers();

        // 1. Prepare OSRM URL (Note: OSRM uses [lng,lat] format)
        const osrmCoords = coords.map(c => `${c[1]},${c[0]}`).join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${osrmCoords}?overview=full&geometries=geojson`;

        try {
            // 2. Fetch road geometry
            const response = await fetch(url);
            const data = await response.json();

            if (data.routes && data.routes.length > 0) {
                // 3. Draw the line following the roads
                const roadPath = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                this.currentPath = L.polyline(roadPath, { 
                    color: routeColor || '#007bff', 
                    weight: 6,
                    opacity: 0.8 
                }).addTo(this.map);
            } else {
                throw new Error("No road path found");
            }
        } catch (error) {
            console.warn("Routing failed, using straight lines:", error);
            // Fallback to straight lines if API is down
            this.currentPath = L.polyline(coords, { color: routeColor || '#007bff', weight: 6 }).addTo(this.map);
        }

        // 4. Draw markers for stops
        pathNames.forEach((name, index) => {
            const stationCoord = coords[index];
            if (stationCoord) {
                let color = (index === 0) ? '#28a745' : (index === pathNames.length - 1) ? '#dc3545' : '#007bff';
                const m = L.circleMarker(stationCoord, {
                    radius: (index === 0 || index === pathNames.length - 1) ? 8 : 5,
                    color: color, fillColor: 'white', fillOpacity: 1
                }).addTo(this.map).bindTooltip(name);
                this.markers.push(m);
            }
        });

        this.map.fitBounds(this.currentPath.getBounds(), { padding: [40, 40] });
    }

    updateUserLocation(lat, lng, nearest) {
        if (this.userMarker) this.map.removeLayer(this.userMarker);
        this.userMarker = L.marker([lat, lng]).addTo(this.map).bindPopup("You are here").openPopup();

        if (this.nearestHighlight) this.map.removeLayer(this.nearestHighlight);
        this.nearestHighlight = L.circleMarker(nearest.coords, {
            radius: 12, color: '#ffc107', fillColor: '#ffc107', fillOpacity: 0.4
        }).addTo(this.map).bindTooltip("Nearest: " + nearest.name).openTooltip();

        const group = new L.featureGroup([this.userMarker, this.nearestHighlight]);
        this.map.fitBounds(group.getBounds().pad(0.5));
    }
}