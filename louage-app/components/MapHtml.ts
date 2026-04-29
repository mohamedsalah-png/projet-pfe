import { TUNISIAN_CITIES } from '../data/cities';

export const getMapHtml = (depart: string, arrivee: string) => {
  const citiesJson = JSON.stringify(TUNISIAN_CITIES);

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Carte Tunisie</title>
    
    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <!-- Leaflet Routing Machine CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css" />
    
    <!-- Leaflet JS -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <!-- Leaflet Routing Machine JS -->
    <script src="https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.js"></script>
    
    <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        #map { height: 100vh; width: 100vw; }
        
        /* Custom Marker Style */
        .city-label { 
            font-size: 13px; 
            font-weight: bold; 
            background: white; 
            padding: 4px 10px; 
            border-radius: 20px; 
            border: 2px solid #EA580C; 
            color: #431407; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            cursor: pointer;
        }
        .city-label:hover {
            background: #EA580C;
            color: white;
            transform: scale(1.1);
        }
        
        /* Selected City Style */
        .city-label-selected {
            background: #10B981; /* Green for selected */
            border-color: #047857;
            color: white;
            z-index: 1000 !important;
        }

        /* Hide routing text container on mobile to save space */
        .leaflet-routing-container {
            display: none !important;
        }

        /* Locate Button */
        .locate-btn {
            position: absolute;
            bottom: 30px;
            right: 20px;
            z-index: 1000;
            background: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }
        .locate-btn:active {
            background: #f1f5f9;
            transform: scale(0.95);
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <button class="locate-btn" onclick="locateUser()" aria-label="Ma position">📍</button>

    <script>
        // Init Map
        var map = L.map('map', {
            zoomControl: false // Hide default zoom for cleaner UI
        }).setView([33.8869, 9.5375], 6);

        // Add Zoom Control at top right
        L.control.zoom({ position: 'topright' }).addTo(map);

        // Tile Layer (Modern Look)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors, © CARTO'
        }).addTo(map);

        var cities = ${citiesJson};
        var currentDepart = "${depart}";
        var currentArrivee = "${arrivee}";
        var markers = {};
        
        var departCoords = null;
        var arriveeCoords = null;

        // Add Markers
        cities.forEach(function(city) {
            var isSelected = (city.name.toLowerCase() === currentDepart.toLowerCase() || city.name.toLowerCase() === currentArrivee.toLowerCase());
            
            if (city.name.toLowerCase() === currentDepart.toLowerCase()) departCoords = L.latLng(city.lat, city.lng);
            if (city.name.toLowerCase() === currentArrivee.toLowerCase()) arriveeCoords = L.latLng(city.lat, city.lng);

            var className = "city-label " + (isSelected ? "city-label-selected" : "");
            
            var marker = L.marker([city.lat, city.lng], {
                icon: L.divIcon({
                    className: 'custom-div-icon',
                    html: "<div class='" + className + "'>" + city.name + "</div>",
                    iconSize: [null, null],
                    iconAnchor: [30, 15] // Adjust anchor to center
                })
            }).addTo(map);
            
            markers[city.name] = marker;

            marker.on('click', function() {
                var message = JSON.stringify({ type: 'CITY_SELECTED', city: city.name });
                if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                    window.ReactNativeWebView.postMessage(message);
                } else if (window.parent && window.parent.postMessage) {
                    window.parent.postMessage(message, '*');
                }
            });
        });

        // Add Routing if both depart and arrivee are selected
        var routingControl = null;
        if (departCoords && arriveeCoords) {
            routingControl = L.Routing.control({
                waypoints: [departCoords, arriveeCoords],
                lineOptions: {
                    styles: [{color: '#EA580C', opacity: 0.8, weight: 6}]
                },
                createMarker: function() { return null; }, // Hide default routing markers, we use our own
                addWaypoints: false,
                draggableWaypoints: false,
                fitSelectedRoutes: true,
                showAlternatives: false
            }).addTo(map);

            // Fit bounds automatically via routing control
        } else if (departCoords || arriveeCoords) {
            // Zoom to the single selected city
            var target = departCoords || arriveeCoords;
            map.flyTo(target, 10, { duration: 1.5 });
        }

        // Geolocation
        function locateUser() {
            map.locate({setView: true, maxZoom: 12});
        }
        
        map.on('locationfound', function(e) {
            L.circleMarker(e.latlng, {
                radius: 8,
                fillColor: "#3B82F6",
                color: "#fff",
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(map).bindPopup("Vous êtes ici !").openPopup();
        });
        
        map.on('locationerror', function(e) {
            alert("Impossible de vous géolocaliser. Veuillez autoriser l'accès à la position.");
        });

    </script>
</body>
</html>
  `;
};
