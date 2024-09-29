const bounds = [
    [35.0, -30.0],  
    [72.0, 45.0]    
];

const map = L.map('map').setView([54.5, 10.0], 4); 

map.setMaxBounds(bounds);
map.setMinZoom(4); 
map.setMaxZoom(10); 

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
}).addTo(map);


let selectedCountry = null;  
let noiseData = {}; 

function defaultStyle(feature) {
    return {
        fillColor: '#3388ff',  
        weight: 1,          
        opacity: 1,
        color: 'white',        
        fillOpacity: 0.6    
    };
}

function highlightStyle() {
    return {
        fillColor: '#ff7800',  
    };
}

fetch('data/europe.geojson')
    .then(response => response.json())
    .then(geojsonData => {
        let geojsonLayer = L.geoJson(geojsonData, {
            style: defaultStyle,  
            onEachFeature: function (feature, layer) {
                
                layer.bindTooltip(feature.properties.name, { permanent: false, direction: 'auto' });

                layer.on('mouseover', function () {
                    layer.setStyle({
                        weight: 2,
                        color: '#666',
                        fillOpacity: 0.9
                    });
                });

                layer.on('mouseout', function () {
                    if (selectedCountry !== layer) {
                        geojsonLayer.resetStyle(layer);  
                    }
                });

                layer.on('click', function () {
                    if (selectedCountry) {
                        geojsonLayer.resetStyle(selectedCountry);
                    }
                    selectedCountry = layer;  
                    layer.setStyle(highlightStyle());  

                    displayCountryData(feature.properties.name);
                });
            }
        }).addTo(map);
    })
    .catch(error => console.error('Error loading geojson:', error));

fetch('data/noise_data.json')
    .then(response => response.json())
    .then(data => {
        noiseData = data;
    })
    .catch(error => console.error('Error loading noise data:', error));

function displayCountryData(countryName) {
    let country = noiseData.find(c => c.country === countryName);
    if (country) {
        document.getElementById('country-name').innerText = countryName;

        const noiseRangeSelect = document.getElementById('noise-range');
        noiseRangeSelect.selectedIndex = 0;

        document.getElementById('noise-data').innerText = 'Prozent: --';
        document.getElementById('noise-impact').innerText = 'Auswirkung: --';

        noiseRangeSelect.addEventListener('change', function() {
            let range = this.value;
            if (country[range] !== undefined) {
                document.getElementById('noise-data').innerText = `Prozent: ${country[range]}%`;
                let impact = country[range] > 30 ? "Hohes Risiko für gesundheitliche Schäden" : "Relativ geringes Risiko";
                document.getElementById('noise-impact').innerText = `Auswirkung: ${impact}`;
            } else {
                document.getElementById('noise-data').innerText = 'Prozent: --';
                document.getElementById('noise-impact').innerText = 'Auswirkung: --';
            }
        });
    }
}
