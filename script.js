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
                        color: '#ff7800',
                        fillOpacity: 0.8
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

                ctx.font = '16px Arial';
                ctx.fillText("Anteil der Bevölkerung", centerX, centerY - 30); 
            }
        }
    }
});

function updateSliderLabel(value) {
    const sliderValueLabel = document.getElementById('slider-value');  
    let description = `${value} - ${parseInt(value) + 4} dB`;
    let noiseExample = '';

    switch (parseInt(value)) {
        case 55:
            description = '55-59 dB';
            noiseExample = 'Leise Gespräche, Hintergrundmusik';
            break;
        case 60:
            description = '60-64 dB';
            noiseExample = 'Normale Gespräche, Bürogeräusche';
            break;
        case 65:
            description = '65-69 dB';
            noiseExample = 'Verkehrslärm, laute Gespräche';
            break;
        case 70:
            description = '70-74 dB';
            noiseExample = 'Laute Straße, Staubsauger';
            break;
        case 75:
            description = '> 75 dB';
            noiseExample = 'Flugzeugstart, sehr laute Geräusche';
            break;
    }

    sliderValueLabel.innerText = description;
    document.getElementById('noise-example').innerText = `Beispiele: ${noiseExample}`;
}

function displayCountryData(countryName) {
    let country = noiseData.find(c => c.country === countryName);
    if (country) {
        document.getElementById('country-name').innerText = countryName;

        const noiseRangeSlider = document.getElementById('noise-range-slider');
        updateSliderLabel(noiseRangeSlider.value);  

        let rangeValue = noiseRangeSlider.value;
        let range = `exposure_${rangeValue}_${parseInt(rangeValue) + 4}`;
        if (rangeValue == 75) {
            range = 'exposure_greater_75';
        }

        if (country[range] !== undefined) {
            let percent = country[range];
            updateChart(percent, rangeValue);  
        } else {
            updateChart(0, rangeValue);  
        }

        noiseRangeSlider.addEventListener('input', function() {
            rangeValue = noiseRangeSlider.value;
            range = `exposure_${rangeValue}_${parseInt(rangeValue) + 4}`;
            if (rangeValue == 75) {
                range = 'exposure_greater_75';
            }

            updateSliderLabel(rangeValue);  

            if (country[range] !== undefined) {
                let percent = country[range];
                updateChart(percent, rangeValue);  
            } else {
                updateChart(0, rangeValue);  
            }
        });
    } else {
        document.getElementById('country-name').innerText = 'Wählen Sie ein Land';
        updateChart(0, noiseRangeSlider.value);  
    }
}

function highlightStyle() {
    return {
        fillColor: '#ff7800', 
        weight: 1, 
        color: '#ff7800', 
        fillOpacity: 1 
    };
}

function defaultStyle(feature) {
    return {
        fillColor: '#3388ff', 
        weight: 1,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.6
    };
}

function updateChart(percent, value) {
    let chartColor;

    switch (parseInt(value)) {
        case 55:
            chartColor = '#4CAF50';  
            break;
        case 60:
            chartColor = '#FFEB3B';  
            break;
        case 65:
            chartColor = '#FF9800';  
            break;
        case 70:
            chartColor = '#FF5722';  
            break;
        case 75:
            chartColor = '#F44336'; 
            break;
    }

    noiseChart.data.datasets[0].backgroundColor = [chartColor, '#e0e0e0'];
    noiseChart.data.datasets[0].data = [percent, 100 - percent];
    noiseChart.update();  
}