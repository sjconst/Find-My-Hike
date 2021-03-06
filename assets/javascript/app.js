$(document).ready(function () {

  // Global variables
  var lat, long, searchInput;

  // Title write effect
  function writeTitle() {
    var ctx = $("canvas").get(0).getContext("2d");
    var dashLen = 220;
    var dashOffset = dashLen;
    var speed = 15;
    var txt = "Find my Hike";
    var x = 30;
    var i = 0;
    var w = window.innerWidth;
    if (w < 768) {
      ctx.font = "26px 'Rock Salt', cursive";
    } else {
      ctx.font = "35px 'Rock Salt', cursive";
    }
    ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.globalAlpha = 1;
    ctx.strokeStyle = ctx.fillStyle = "#373e2a";
    (function loop() {
      ctx.clearRect(x, 0, 60, 150);
      ctx.setLineDash([dashLen - dashOffset, dashOffset - speed]); // create a long dash mask
      dashOffset -= speed;                                         // reduce dash length
      ctx.strokeText(txt[i], x, 90);                               // stroke letter

      if (dashOffset > 0) requestAnimationFrame(loop);             // animate
      else {
        ctx.fillText(txt[i], x, 90);                               // fill final letter
        dashOffset = dashLen;                                      // prep next char
        x += ctx.measureText(txt[i++]).width + ctx.lineWidth * Math.random();
        ctx.setTransform(1, 0, 0, 1, 0, 3 * Math.random());        // random y-delta
        ctx.rotate(Math.random() * 0.005);                         // random rotation
        if (i < txt.length) requestAnimationFrame(loop);
      }
    })();
  }
  writeTitle();

  // Lat and Long AJAX Request from MapQuest API 
  function getLatLong(searchInput, state) {
    return $.ajax({
      // url: `https://www.mapquestapi.com/geocoding/v1/address?key=ttL7KMim9EoyXL2nRjDSwVtMA5XImeGB&inFormat=kvp&outFormat=json&location=${searchInput}, ${state}&thumbMaps=false`,
      url: `https://maps.googleapis.com/maps/api/geocode/json?address=${searchInput},+${state}&key=AIzaSyDOY9Oyx6yzfqzGEky4rj7bUi31kovFk5k`,
      success: function (response) {
        var results = response.results[0].geometry.location;
        lat = results.lat;
        long = results.lng;
      },
      error: error => console.log(error)
    })
  }

  // Get Hiking Project API and renders out hiking buttons
  function getHikingProject(lat, long) {
    return $.ajax({
      url: `https://cors-anywhere.herokuapp.com/https://www.hikingproject.com/data/get-trails?lat=${lat}&lon=${long}&key=200585860-f4494d9d7cf44d6a85f6bfd15f2a7061`,
      success: response => {
        for (i = 0; i < response.trails.length; i++) {
          this.hikesArray = response.trails;
          var hike = response.trails[i];
          var hikeButton = $("<button>");
          hikeButton.attr("data-name", hike.name).attr("data-id", hike.id).attr("data-lat", hike.latitude).attr("data-long", hike.longitude).attr("type", "button");
          hikeButton.addClass("hiking-button").addClass("btn btn-light btn-outline-dark");
          hikeButton.text(hike.name);
          $("#results-here").append(hikeButton);
        }
      },
      error: error => console.log(error)
    })
  };

  // Get Hiking Project API and renders hike details for the card's hike information tab
  function getHikeDetails(ID) {
    return $.ajax({
      url: `https://cors-anywhere.herokuapp.com/https://www.hikingproject.com/data/get-trails-by-id?ids=${ID}&key=200585860-f4494d9d7cf44d6a85f6bfd15f2a7061`,
      success: response => {
        var trails = response.trails[0];
        $(".title-input").text(trails.name);
        $("#rating-input").text(`${trails.stars}/5`);
        if (trails.difficulty === "green") {
          $("#difficulty-input").text("easy");
        } else if (trails.difficulty === "blue") {
          $("#difficulty-input").text("intermediate");
        } else if (trails.difficulty === "black") {
          $("#difficulty-input").text("difficult");
        } else if (trails.difficulty === "greenBlue") {
          $("#difficulty-input").text("intermediate/difficult");
        } else {
          $("#difficulty-input").text("unknown");
        };
        $("#description-input").text(trails.summary + " ").append(`<a href=${trails.url} target="_blank">Click for more info.</a>`);
        $("#image-input").attr("src", trails.imgMedium);   //need to add default if no image  
        $("#distance-input").text(trails.length + " mi")
      },
      error: error => console.log(error)
    })
  };
  
  // Get Map API and render map for the card's direction tab
  var map = null;
  function getDirections(lat, long) {
    L.mapquest.key = 'OlA3XD01BeVa2IeDq2kLC4Y4Cr3IDWMw';
    map = L.mapquest.map('map', {
      center: [lat, long],
      layers: L.mapquest.tileLayer('map'),
      zoom: 13,
      zoomControl: false
    });
    L.control.zoom({
      position: 'topright'
    }).addTo(map);
    L.mapquest.directionsControl({
      directions: {
        options: {
          timeOverage: 25,
          doReverseGeocode: false,
        }
      },
      directionsLayer: {
        startMarker: {
          draggable: true,
          icon: 'marker-start',
          iconOptions: {},
        },
        endMarker: {
          draggable: true,
          icon: 'marker-end',
          iconOptions: {},
        },
        routeRibbon: {
          showTraffic: true
        },
        alternateRouteRibbon: {
          showTraffic: true
        },
        paddingTopLeft: [450, 20],
        paddingBottomRight: [20, 20],
      },
      startInput: {
        compactResults: true,
        disabled: false,
        location: {},
        placeholderText: 'Starting point or click on the map...',
        geolocation: {
          enabled: true
        }
      },
      endInput: {
        compactResults: true,
        disabled: false,
        location: {
          latLng: {
            lat: lat,
            lng: long
          }
        },
        placeholderText: 'Destination',
        geolocation: {
          enabled: false
        }
      },
      addDestinationButton: {
        enabled: true,
        maxLocations: 10,
      },
      routeTypeButtons: {
        enabled: true,
      },
      reverseButton: {
        enabled: true,
      },
      optionsButton: {
        enabled: true,
      },
      routeSummary: {
        enabled: false,
      },
      narrativeControl: {
        enabled: true,
        compactResults: false,
        interactive: true,
      },
    }).addTo(map);
  }

  // Get OpenWeather API and renders weather information in the card's hike information tab
  function getWeather(lat, long) {
    return $.ajax({
      url: `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${long}&appid=2d017a4453be6f15af1c818bb7e28d02`,
      success: response => {
        console.log("weather working");
        var weather = response.weather[0].description;
        var icon = response.weather[0].icon;
        var temp = response.main.temp;
        var tempF = Math.round(convert(temp));
        var sunrise = response.sys.sunrise;
        var sunset = response.sys.sunset;
        function convert(K) {
          var F = (K - 273.15) * 1.80 + 32;
          return F;
        }
        function convertTime(T) {
          var dt = new Date(T * 1000);
          var hr = dt.getHours();
          var m = "0" + dt.getMinutes();
          return `${hr}:${m.substr(-2)}`;
        }
        var sunsetConvert = convertTime(sunset);
        var sunriseConvert = convertTime(sunrise);
        $("#weather-input").append(`<img src="assets/images/${icon}.png" alt="weather icon" width="60" height="60"><span>${weather}</span><div>Sunrise: ${sunriseConvert}</div><div>Sunset:${sunsetConvert}</div><div>Temp: ${tempF}&#8457</div>`);
      },
      error: error => console.log(error)
    })
  }

  // Get OpenWeather API and renders weather forecast in the card's hike information tab
  function getWeatherForecast(lat, long) {
    return $.ajax({
      url: `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${long}&appid=2d017a4453be6f15af1c818bb7e28d02`,
      success: response => {
        var forecast = response.list[0].weather[0].description;
        $("#weather-input").append(`<span>Today's forecast: ${forecast}</span><div>`);
      },
      error: error => console.log(error)
    })
  }
  
  // Get Yelp API and render restaurants in the card's restaurants tab
  function getYelp(lat, long) {
    return $.ajax({
      url: `https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/businesses/search?categories=restaurants&latitude=${lat}&longitude=${long}&radius=25000&limit=10`,
      headers: {
        "Authorization": "Bearer U4zPieXnsduH4Rg3NZDZvSSMzQmAwTZqI8wc1JEwROAUknwL15_b6FiWNlkhZCMhNTBJNTm2ZzctwONE9rEob9e6DuAoCv2zUH2fO29eDglEb6F1UGIC_ILc--l7XXYx"
      },
      success: response => {
        var business = response.businesses;
        for (var i = 0; i < response.businesses.length; i++) {
          $("#yelp-input").append(`<li><a href=${business[i].url} target="_blank">${business[i].name}</a><span> , ${business[i].location.city} </span></li>`);
        }
      },
      error: error => console.log(error)
    })
  }

  // Empty results
  function emptyResults() {
    $("#weather-input").empty();
    $("#title-input").empty();
    $("#rating-input").empty();
    $("#difficulty-input").empty();
    $("#description-input").empty();
    $("#image-input").empty();
    $("#yelp-input").empty();
    $("#directions-input").empty();
    $("#distance-input").empty();
  }

  // Event listeners
  // Form validation
  $("#search-form").parsley().on("form:validate", function () {
    var ok = $(".parsley-error").length === 0;
    $(".bs-callout-info").toggleClass("hidden", !ok);
    $('.bs-callout-warning').toggleClass('hidden', ok);
  });

  // When user clicks submit button, renders out relevant hike results
  $("#submit-button").on("click", function (event) {
    event.preventDefault();
    $('#search-form').parsley().validate();
    var instance = $('#term').parsley();
    if (instance.isValid()) {
      $("#results-here").empty();
      emptyResults();
      searchInput = $("#term").val();
      var state = $("#states option:selected").text();
      $.when(getLatLong(searchInput, state)).then(function () {
        getHikingProject(lat, long);
        $("form").trigger("reset");
      });
    }
  });

  // When user clicks on a hike button, renders out relevant information
  $(document).on("click", ".hiking-button", function (event) {
    event.preventDefault();
    $("#hike-display").css("visibility", "visible");
    if (map !== undefined && map !== null) {
      map.remove()
    };
    emptyResults();
    var hikeID = $(this).attr("data-id");
    var hikeLat = $(this).attr("data-lat");
    var hikeLong = $(this).attr("data-long");
    getYelp(hikeLat, hikeLong);
    getWeatherForecast(hikeLat, hikeLong);
    getWeather(hikeLat, hikeLong);
    getHikeDetails(hikeID);
    getDirections(hikeLat, hikeLong);
  });
});