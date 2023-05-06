// Store our API endpoint as queryUrl and tectonicplatesUrl
var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
var tectonicplatesUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"

// Perform a GET request to the query URL
d3.json(queryUrl).then(function (data) {
    // Console log the data retrieved 
    console.log(data);
    // Once we get a response, send the data.features object to the createFeatures function.
    createFeatures(data.features);
});

// Function to determine marker color by depth
/*function chooseColor(depth){
  if (depth < 10) return "#00FF00";
  else if (depth < 30) return "greenyellow";
  else if (depth < 50) return "yellow";
  else if (depth < 70) return "orange";
  else if (depth < 90) return "orangered";
  else return "#FF0000";
}
// This was slightly easier to write coding wise.
*/
function chooseColor(depth){
    // Create colors object to compare depth values to
    const colors = {
        '#00FF00': depth <= 10,
        'greenyellow': depth > 10 && depth <= 30,
        'yellow': depth > 30 && depth <= 50,
        'orange': depth > 50 && depth <= 70,
        'orangered': depth > 70 && depth <= 90
    }
    // An object search performs slightly better to draw times of the if statement function.
    return Object.keys(colors).find(key => colors[key] == true) ?? "#FF0000" // ?? acts as an else statement to create a default string for our last color.
}

function createFeatures(earthquakeData) {

  // Define a function that we want to run once for each feature in the features array.
  // Give each feature a popup that describes the place and time of the earthquake.
  function onEachFeature(feature, layer) {
    layer.bindPopup(`<h3>Location: ${feature.properties.place}</h3><hr><p>Date: ${new Date(feature.properties.time)}</p><p>Magnitude: ${feature.properties.mag}</p><p>Depth: ${feature.geometry.coordinates[2]}</p>`);
  }

  // Create a GeoJSON layer that contains the features array on the earthquakeData object.
  // Run the onEachFeature function once for each piece of data in the array.
  var earthquakes = L.geoJSON(earthquakeData, {
    onEachFeature: onEachFeature,

    // Point to layer used to alter markers
    pointToLayer: function(feature, latlng) {

      // Determine the style of markers based on properties
      var markers = {
        radius: feature.properties.mag * 20000,
        fillColor: chooseColor(feature.geometry.coordinates[2]),
        fillOpacity: 0.7,
        color: "black",
        weight: 0.5
      }
      return L.circle(latlng,markers);
    }
  });

  // Send our earthquakes layer to the createMap function/
  createMap(earthquakes);
}

function createMap(earthquakes) {

  // Create tile layers
  var street = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

  
  var topo = new L.StamenTileLayer("terrain");

  var outdoors = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}', {
	maxZoom: 20,
	attribution: 'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>'
});

  var gray = new L.StamenTileLayer("toner-lite");

  var watercolor = new L.StamenTileLayer("watercolor");

  // Create layer for tectonic plates
  tectonicPlates = new L.layerGroup();

    // Perform a GET request to the tectonicplatesURL
    d3.json(tectonicplatesUrl).then(function (plates) {

        // Console log the data retrieved 
        console.log(plates);
        L.geoJSON(plates, {
            color: "orange",
            weight: 2
        }).addTo(tectonicPlates);
    });

    // Create a baseMaps object.
    var baseMaps = {
        "OpenStreet": street,
        "Topo": topo,
        "Outdoors": outdoors,
        "Grayscale": gray,
        "Watercolor": watercolor
    };

    // Create an overlay object to hold our overlay.
    var overlayMaps = {
        "Earthquakes": earthquakes,
        "Tectonic Plates": tectonicPlates
    };
    
    // Create our map, giving it the satellite map and earthquakes layers to display on load.
  var myMap = L.map("map", {
    center: [
      37.09, -95.71
    ],
    zoom: 5,
    layers: [street, earthquakes, tectonicPlates]
  });

// Add legend
var legend = L.control({position: "bottomright"});
legend.onAdd = function() {
  var div = L.DomUtil.create("div", "info legend"),
  depth = [-10, 10, 30, 50, 70, 90];

  div.innerHTML += "<h3 style='text-align: center'>Depth</h3>"

  for (var i = 0; i < depth.length; i++) {
    div.innerHTML +=
    '<i style="background:' + chooseColor(depth[i] + 1) + '"></i> ' + depth[i] + (depth[i + 1] ? '&ndash;' + depth[i + 1] + '<br>' : '+');
  }
  return div;
};
legend.addTo(myMap)

  // Create a layer control.
  // Pass it our baseMaps and overlayMaps.
  // Add the layer control to the map.
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);
};