const fs = require('fs');
const file = 'c:/Users/swift/Desktop/projet-pfe-main/louage-app/app/(passenger)/home.tsx';
let code = fs.readFileSync(file, 'utf8');

const mapHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { margin: 0; padding: 0; font-family: sans-serif; }
        #map { height: 100vh; width: 100vw; }
        .city-label { font-size: 14px; font-weight: bold; background: white; padding: 4px 8px; border-radius: 4px; border: 2px solid #EA580C; white-space: nowrap; color: #431407; text-align: center; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map('map').setView([33.8869, 9.5375], 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        var cities = [
            { name: "Tunis", lat: 36.8065, lng: 10.1815 },
            { name: "Sousse", lat: 35.8256, lng: 10.6369 },
            { name: "Sfax", lat: 34.7406, lng: 10.7603 },
            { name: "Bizerte", lat: 37.2744, lng: 9.8739 },
            { name: "Nabeul", lat: 36.4561, lng: 10.7376 },
            { name: "Kairouan", lat: 35.6781, lng: 10.0963 },
            { name: "Gabès", lat: 33.8815, lng: 10.0982 },
            { name: "Gafsa", lat: 34.425, lng: 8.7842 },
            { name: "Monastir", lat: 35.778, lng: 10.8262 },
            { name: "Mahdia", lat: 35.5047, lng: 11.0622 },
            { name: "Médenine", lat: 33.3549, lng: 10.5055 },
            { name: "Tozeur", lat: 33.9197, lng: 8.1335 },
            { name: "Béja", lat: 36.7256, lng: 9.1817 },
            { name: "Jendouba", lat: 36.5011, lng: 8.7802 },
            { name: "Le Kef", lat: 36.1826, lng: 8.7148 },
            { name: "Siliana", lat: 36.0818, lng: 9.3708 },
            { name: "Kasserine", lat: 35.1676, lng: 8.8365 },
            { name: "Sidi Bouzid", lat: 35.0382, lng: 9.4849 },
            { name: "Kébili", lat: 33.7044, lng: 8.969 },
            { name: "Tataouine", lat: 32.9297, lng: 10.4518 }
        ];

        cities.forEach(function(city) {
            var marker = L.marker([city.lat, city.lng]).addTo(map);
            marker.bindTooltip(city.name, { permanent: true, direction: "top", className: "city-label", offset: [0, -10] });
            marker.on('click', function() {
                var message = JSON.stringify({ type: 'CITY_SELECTED', city: city.name });
                if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                    window.ReactNativeWebView.postMessage(message);
                } else if (window.parent && window.parent.postMessage) {
                    window.parent.postMessage(message, '*');
                }
            });
        });
    </script>
</body>
</html>
`;

code = code.replace(
  "import { useState } from 'react';",
  "import { useState, useEffect, createElement } from 'react';\nimport { WebView } from 'react-native-webview';\nimport { Ionicons } from '@expo/vector-icons';\n\nconst mapHtml = `" + mapHtml + "`;"
);

code = code.replace(
  "import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';",
  "import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, Platform } from 'react-native';"
);

const stateInjection = `
  const [mapVisible, setMapVisible] = useState(false);
  const [mapTarget, setMapTarget] = useState<'depart' | 'arrivee' | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleWebMessage = (event: MessageEvent) => {
        try {
          if (typeof event.data === 'string') {
            const data = JSON.parse(event.data);
            if (data.type === 'CITY_SELECTED') {
              if (mapTarget === 'depart') {
                setDepart(data.city);
                if (errors.depart) setErrors({ ...errors, depart: '' });
              } else if (mapTarget === 'arrivee') {
                setArrivee(data.city);
                if (errors.arrivee) setErrors({ ...errors, arrivee: '' });
              }
              setMapVisible(false);
            }
          }
        } catch (e) {
          // ignore
        }
      };
      window.addEventListener('message', handleWebMessage);
      return () => window.removeEventListener('message', handleWebMessage);
    }
  }, [mapTarget, errors]);

  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'CITY_SELECTED') {
        if (mapTarget === 'depart') {
          setDepart(data.city);
          if (errors.depart) setErrors({ ...errors, depart: '' });
        } else if (mapTarget === 'arrivee') {
          setArrivee(data.city);
          if (errors.arrivee) setErrors({ ...errors, arrivee: '' });
        }
        setMapVisible(false);
      }
    } catch (e) {}
  };
`;

code = code.replace(
  "  const [errors, setErrors] = useState<{ [key: string]: string }>({});",
  "  const [errors, setErrors] = useState<{ [key: string]: string }>({});" + stateInjection
);

const departInputOrig = `        <TextInput
          style={[styles.input, errors.depart && styles.inputError]}
          placeholder="Ville de départ"
          placeholderTextColor="#94A3B8"
          value={depart}
          onChangeText={(text) => { setDepart(text); if (errors.depart) setErrors({ ...errors, depart: '' }); }}
        />`;

const departInputNew = `        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.inputWithIcon, errors.depart && styles.inputError]}
            placeholder="Ville de départ"
            placeholderTextColor="#94A3B8"
            value={depart}
            onChangeText={(text) => { setDepart(text); if (errors.depart) setErrors({ ...errors, depart: '' }); }}
          />
          <TouchableOpacity style={styles.mapIconButton} onPress={() => { setMapTarget('depart'); setMapVisible(true); }}>
            <Ionicons name="map" size={24} color="#EA580C" />
          </TouchableOpacity>
        </View>`;

code = code.replace(departInputOrig, departInputNew);

const arriveeInputOrig = `        <TextInput
          style={[styles.input, errors.arrivee && styles.inputError]}
          placeholder="Ville d'arrivée"
          placeholderTextColor="#94A3B8"
          value={arrivee}
          onChangeText={(text) => { setArrivee(text); if (errors.arrivee) setErrors({ ...errors, arrivee: '' }); }}
        />`;

const arriveeInputNew = `        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.inputWithIcon, errors.arrivee && styles.inputError]}
            placeholder="Ville d'arrivée"
            placeholderTextColor="#94A3B8"
            value={arrivee}
            onChangeText={(text) => { setArrivee(text); if (errors.arrivee) setErrors({ ...errors, arrivee: '' }); }}
          />
          <TouchableOpacity style={styles.mapIconButton} onPress={() => { setMapTarget('arrivee'); setMapVisible(true); }}>
            <Ionicons name="map" size={24} color="#EA580C" />
          </TouchableOpacity>
        </View>`;

code = code.replace(arriveeInputOrig, arriveeInputNew);

const modalInjection = `      <Modal visible={mapVisible} animationType="slide" onRequestClose={() => setMapVisible(false)}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            Sélectionner la ville {mapTarget === 'depart' ? 'de départ' : "d'arrivée"}
          </Text>
          <TouchableOpacity onPress={() => setMapVisible(false)} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#431407" />
          </TouchableOpacity>
        </View>
        {Platform.OS === 'web' ? (
          createElement('iframe', {
            srcDoc: mapHtml,
            style: { width: '100%', height: '100%', border: 'none' },
            sandbox: 'allow-scripts allow-same-origin'
          })
        ) : (
          <WebView
            source={{ html: mapHtml }}
            onMessage={handleMapMessage}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        )}
      </Modal>
    </View>`;

code = code.replace("    </View>\n  );\n}", modalInjection + "\n  );\n}");

const stylesInjection = `
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputWithIcon: {
    flex: 1,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#431407',
  },
  mapIconButton: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: '#FED7AA',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF8F1',
    borderBottomWidth: 1,
    borderBottomColor: '#FED7AA',
    marginTop: Platform.OS === 'ios' ? 40 : 0,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#431407',
  },
  closeButton: {
    padding: 4,
  },
  webview: {
    flex: 1,
  },
`;

code = code.replace("  inputError: {", stylesInjection + "\n  inputError: {");
code = code.replace(/    marginBottom: 12,\n  \},\n  inputError:/g, "  },\n  inputError:");

fs.writeFileSync(file, code);
console.log('Patched home.tsx');
