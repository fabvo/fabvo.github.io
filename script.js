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

// L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
//     maxZoom: 19,
//     attribution: 'Dark matter'
// }).addTo(map);

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

let ctx = document.getElementById('noiseChart').getContext('2d');
let noiseChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
        datasets: [{
            data: [0, 100], 
            backgroundColor: ['#36a2eb', '#e0e0e0'],  
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        cutoutPercentage: 70,  
        tooltips: {
            enabled: false  
        },
        animation: {
            duration: 500,  
            onComplete: function() {
                let ctx = noiseChart.ctx;
                ctx.font = '30px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                let centerX = (noiseChart.chartArea.left + noiseChart.chartArea.right) / 2;
                let centerY = (noiseChart.chartArea.top + noiseChart.chartArea.bottom) / 2;
                
                let percent = noiseChart.data.datasets[0].data[0];
                ctx.fillText(`${percent}%`, centerX, centerY);  
            }
        }
    }
});


function updateChart(percent) {
    noiseChart.data.datasets[0].data = [percent, 100 - percent];  
    noiseChart.update();  
}

function displayCountryData(countryName) {
    let country = noiseData.find(c => c.country === countryName);
    if (country) {
        document.getElementById('country-name').innerText = countryName;

        const noiseRangeSelect = document.getElementById('noise-range');
        noiseRangeSelect.selectedIndex = 0;

        noiseRangeSelect.addEventListener('change', function() {
            let range = this.value;
            if (country[range] !== undefined) {
                let percent = country[range]; 
                
                updateChart(percent);

                let impact = percent > 30 ? "Hohes Risiko für gesundheitliche Schäden" : "Relativ geringes Risiko";
            } else {
                document.getElementById('noise-data').innerText = 'Prozent: --';
                document.getElementById('noise-impact').innerText = 'Auswirkung: --';
                updateChart(0);  
            }
        });
    } else {
        document.getElementById('country-name').innerText = 'Wählen Sie ein Land';
        document.getElementById('noise-data').innerText = 'Prozent: --';
        document.getElementById('noise-impact').innerText = 'Auswirkung: --';
        updateChart(0); 
    }
}