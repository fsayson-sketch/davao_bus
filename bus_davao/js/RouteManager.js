class RouteManager {
    constructor(stations, allRoutes) {
        this.stations = stations;
        this.allRoutes = allRoutes;
    }

    getRouteById(id) {
        return this.allRoutes.find(r => r.id === id);
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + 
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    }

    findNearestStation(userLat, userLng, pathNames) {
        let nearest = null;
        let minDistance = Infinity;

        pathNames.forEach(name => {
            const coords = this.stations[name];
            if (coords) {
                const dist = this.calculateDistance(userLat, userLng, coords[0], coords[1]);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearest = { name, coords, distance: dist };
                }
            }
        });
        return nearest;
    }
}