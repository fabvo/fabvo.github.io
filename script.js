// Karte initialisieren
var map = L.map('map').setView([54.5260, 15.2551], 4);

// OpenStreetMap Layer hinzufügen
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// GeoJSON Daten laden
fetch('data/europe.geojson')
    .then(response => response.json())
    .then(geojsonData => {
        L.geoJson(geojsonData, {
            onEachFeature: function (feature, layer) {
                // Land wird beim Klick ausgegeben
                layer.on('click', function() {
                    console.log('Land angeklickt:', feature.properties.name);  // Hier wird der Name des Landes ausgegeben
                    displayCountryData(feature.properties.name);  // Funktion zur Datenanzeige aufrufen
                });
            }
        }).addTo(map);
    });

// Lärmdaten laden
let noiseData = {};
fetch('data/noise_data.json')
    .then(response => response.json())
    .then(data => {
        noiseData = data;
    });

// Funktion zur Ausgabe der Summe
function getCountrySum(countryName) {
    let country = noiseData.find(c => c.country === countryName);
    return country ? country.exposure_sum : '--';
}

// Daten bei Länderauswahl anzeigen
function displayCountryData(countryName) {
    let country = noiseData.find(c => c.country === countryName);
    document.getElementById('country-name').innerText = countryName;
    document.getElementById('noise-range').addEventListener('change', function() {
        let range = this.value;
        document.getElementById('noise-data').innerText = `Prozent: ${country[range]}%`;
        // Auswirkungen anzeigen (Beispiel)
        let impact = country[range] > 30 ? "Hohes Risiko für gesundheitliche Schäden" : "Relativ geringes Risiko";
        document.getElementById('noise-impact').innerText = `Auswirkung: ${impact}`;
    });
}
