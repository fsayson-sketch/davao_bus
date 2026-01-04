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

    drawRoute(coords, pathNames, routeColor) {
    this.clearOldLayers(); // Important: Clears previous route lines and markers
    this.currentPath = L.polyline(coords, { color: routeColor || '#007bff', weight: 6 }).addTo(this.map);
    
    pathNames.forEach((name, index) => {
        let color = (index === 0) ? '#28a745' : (index === pathNames.length - 1) ? '#dc3545' : '#007bff';
        const m = L.circleMarker(coords[index], {
            radius: (index === 0 || index === pathNames.length - 1) ? 8 : 5,
            color: color, fillColor: 'white', fillOpacity: 1
        }).addTo(this.map).bindTooltip(name);
        this.markers.push(m);
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