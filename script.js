// Set boundaries for Europe and map settings
const bounds = [
    [35.0, -30.0],  // Northwest corner
    [72.0, 45.0]    // Southeast corner
];

const map = L.map('map').setView([54.5, 10.0], 4); // Focus on Europe

// Set map constraints
map.setMaxBounds(bounds);
map.setMinZoom(4); 
map.setMaxZoom(10); 

// Add tile layer (light theme)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
}).addTo(map);

let selectedCountry = null;  
let noiseData = {}; 

// Default country style
function defaultStyle(feature) {
    return {
        fillColor: '#3388ff',  // Default color
        weight: 1,          
        opacity: 1,
        color: 'white',        
        fillOpacity: 0.6    
    };
}

// Highlight style for selected country
function highlightStyle() {
    return {
        fillColor: '#ff7800',  // Highlight color
    };
}

// Fetch and render GeoJSON data (country boundaries)
fetch('data/europe.geojson')
    .then(response => response.json())
    .then(geojsonData => {
        let geojsonLayer = L.geoJson(geojsonData, {
            style: defaultStyle,  
            onEachFeature: function (feature, layer) {
                
                // Tooltip with country name
                layer.bindTooltip(feature.properties.name, { permanent: false, direction: 'auto' });

                // Hover effect
                layer.on('mouseover', function () {
                    layer.setStyle({
                        weight: 2,
                        color: '#666',
                        fillOpacity: 0.9
                    });
                });

                // Reset style on mouseout
                layer.on('mouseout', function () {
                    if (selectedCountry !== layer) {
                        geojsonLayer.resetStyle(layer);  
                    }
                });

                // Click event for country selection
                layer.on('click', function () {
                    if (selectedCountry) {
                        geojsonLayer.resetStyle(selectedCountry); // Reset previously selected country
                    }
                    selectedCountry = layer;  
                    layer.setStyle(highlightStyle());  // Apply highlight style

                    // Display country data
                    displayCountryData(feature.properties.name);
                });
            }
        }).addTo(map);
    })
    .catch(error => console.error('Error loading geojson:', error));

// Fetch noise data
fetch('data/noise_data.json')
    .then(response => response.json())
    .then(data => {
        noiseData = data;
    })
    .catch(error => console.error('Error loading noise data:', error));

// Chart.js (v2.9.4) setup with shorter animation duration
let ctx = document.getElementById('noiseChart').getContext('2d');
let noiseChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
        datasets: [{
            data: [0, 100],  // Initial data with noise and the rest
            backgroundColor: ['#36a2eb', '#e0e0e0'],  // Color for noise level and rest
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        cutoutPercentage: 70,  // Cutout in the middle
        tooltips: {
            enabled: false  // Disable tooltips
        },
        animation: {
            duration: 500,  // Shorter animation duration (500ms)
            onComplete: function() {
                let ctx = noiseChart.ctx;
                ctx.font = '30px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                let centerX = (noiseChart.chartArea.left + noiseChart.chartArea.right) / 2;
                let centerY = (noiseChart.chartArea.top + noiseChart.chartArea.bottom) / 2;
                
                let percent = noiseChart.data.datasets[0].data[0];
                ctx.fillText(`${percent}%`, centerX, centerY);  // Draw percentage text in the middle
            }
        }
    }
});


// Function to update the doughnut chart and percentage inside
function updateChart(percent) {
    noiseChart.data.datasets[0].data = [percent, 100 - percent];  // Update the noise percentage and the rest
    noiseChart.update();  // Trigger chart update
}

// Display country data and update chart
function displayCountryData(countryName) {
    let country = noiseData.find(c => c.country === countryName);
    if (country) {
        document.getElementById('country-name').innerText = countryName;

        const noiseRangeSelect = document.getElementById('noise-range');
        noiseRangeSelect.selectedIndex = 0;

        // Event listener for noise range dropdown
        noiseRangeSelect.addEventListener('change', function() {
            let range = this.value;
            if (country[range] !== undefined) {
                let percent = country[range];  // Get noise level percentage
                // document.getElementById('noise-data').innerText = `Prozent: ${percent}%`;

                // Update chart with noise percentage
                updateChart(percent);

                // Update impact based on noise level
                let impact = percent > 30 ? "Hohes Risiko für gesundheitliche Schäden" : "Relativ geringes Risiko";
                // document.getElementById('noise-impact').innerText = `Auswirkung: ${impact}`;
            } else {
                document.getElementById('noise-data').innerText = 'Prozent: --';
                document.getElementById('noise-impact').innerText = 'Auswirkung: --';
                updateChart(0);  // Reset chart
            }
        });
    } else {
        // Reset sidebar if no data is available
        document.getElementById('country-name').innerText = 'Wählen Sie ein Land';
        document.getElementById('noise-data').innerText = 'Prozent: --';
        document.getElementById('noise-impact').innerText = 'Auswirkung: --';
        updateChart(0);  // Reset chart
    }
}