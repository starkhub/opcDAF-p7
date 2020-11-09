// ----- VARS
var api_key = config.secret_key; //Initialize the API KEY from external file
var restaurantsList, map, infoWindow, marker, bounds, mapLat, mapLng; //Initialize main variables
var userMarkerIcon = './css/images/user-marker-64.png'; //Init. user marker icon
var restaurantMarkerIcon = './css/images/restaurant-marker-32.png'; //Init. restaurants marker icon
var markers = []; //Init. markers array
var restaurantsListDiv = document.getElementById('restaurants-list'); //Init. restaurants list container
var restaurantsAmount = document.getElementById('restaurants-amount'); //Init. restaurants amount counter
var addRestaurantToggle = document.getElementById('addRestaurantToggle'); //Init. add new restaurant toggle
var clickTime = Date.now() - 1001; //timer infoWindow
// ---------- RESTAURANT MODALS VARS ----------
var restaurantNameInput = document.getElementById('addRestaurantName');
var addRestaurantAddressSelect = document.getElementById('addRestaurantAddressSelect');
// ---------- REVIEW MODALS VARS ----------
var reviewModal = document.getElementById('reviewModal');
var reviewTextArea = document.getElementById('reviewCommentArea');
// INITIAL DIALOG
var dialog = bootbox.dialog({
  message: '<div class="lead p-3"><p class="text-center mb-5">Bienvenue !</p><p class="text-justify">Nous vous conseillons d\'accepter la demande de localisation afin d\'obtenir une expérience d\'utilisation optimale. <br/>Nous ne conservons aucune donnée personnelle.</p><p class="text-center mt-5">Nous vous souhaitons d\'avance un bon appétit !</p></div>',
  closeButton: false
});
// ----- OBJECTS
class Restaurant {
  constructor(name, address, ratingsArray, lat, lng, streetViewImage, index) {
    this.name = name,
      this.address = address,
      this.ratingsArray = ratingsArray,
      this.lat = lat,
      this.lng = lng,
      this.streetViewImage = streetViewImage,
      this.index = index
  }
  setOnMap() {
    var ratingsSum = 0;
    var ratingsComments = '<ul class="restaurant-reviews">';
    var restaurantAvgRating;
    var coords = new google.maps.LatLng(this.lat, this.lng);
    var restaurantID = document.getElementById(this.name);
    var ratingFilter = parseInt(document.getElementById('rating-filter').value); // GET THE VALUE OF THE RATING FILTER BUTTON
    this.ratingsArray.forEach(
      star => ratingsSum += star.stars
    );
    this.ratingsArray.forEach(
      comment => ratingsComments += '<li><span class="font-weight-bold">Note : </span>' + comment.stars + '<br /><span class="font-weight-bold">Commentaire : </span>' + comment.comment + '</li><br/><hr>'
    )
    ratingsComments += '</ul>';
    var ratingsAvg = calculateAverage(ratingsSum, this.ratingsArray.length);
    if (ratingsAvg >= 0 && ratingsAvg <= ratingFilter) { // FILTER RESTAURANTS BY NOTES
      if (map.getBounds().contains(coords)) {
        let marker = new google.maps.Marker({
          position: coords,
          map: map,
          icon: restaurantMarkerIcon,
        });
        let infowindow = new google.maps.InfoWindow({
          content:
            '<div class="infoWindow"><h1 class="my-5">' + this.name + '</h1>' +
            '<div class="streeViewImage"><img src="https://maps.googleapis.com/maps/api/streetview?size=600x400&location=' + this.streetViewImage + '&key=' + api_key + '"></div>' +
            '<p class="infoWindowAddress mt-2">' + this.address + '</p>' +
            '<p class="infoWindowRating" id="infoWindowRating"><span class="font-weight-bold">Moyenne des notes : </span>' + ratingsAvg + '</p>' +
            '<h3>Avis clients</h3>' +
            '<ul>' +
            ratingsComments
            +
            '</ul></div>'
        });
        marker.addListener('click', function () { // MARKER CLICK EVENT LISTENER
          infowindow.open(map, marker);
          clickTime = Date.now();
        });
        markers.push(marker); // PUT MARKER INSIDE MARKER'S ARRAY
        if (!restaurantID) { // CREATE RESTAURANT CARD IF NOT EXIST
          let restaurantsListContent = document.createElement('div');
          restaurantsListDiv.appendChild(restaurantsListContent).classList.add('restaurant-file', 'my-2', 'card', 'p-2', 'text-center');
          restaurantsListContent.id = this.name;
          restaurantsListContent.innerHTML = '<h2>' + this.name + '</h2>' +
            '<p id="restaurantAvgRating' + this.index + '"></p>' +
            '<button name="addReviewButton" class="btn btn-warning" id="addReviewButton' + this.index + '" data-restaurant="' + this.index + '" data-toggle="modal" data-target="#reviewModal">Ajouter un avis</button></div>';
          restaurantAvgRating = document.getElementById('restaurantAvgRating' + this.index);
          restaurantAvgRating.innerHTML = '<p><span class="font-weight-bold">Moyenne des notes : </span>' + ratingsAvg + '</p>';
        } else { // IF RESTAURANT CARD EXIST, UPDATE THE RATING
          restaurantAvgRating = document.getElementById('restaurantAvgRating' + this.index);
          restaurantAvgRating.innerHTML = '<p><span class="font-weight-bold">Moyenne des notes : </span>' + ratingsAvg + '</p>';
        }
      } else if (document.getElementById(this.name)) { // IF RESTAURANT'S OUT OF BOUNDS AND WAS VIBIBLE BEFORE, REMOVE IT
        document.getElementById(this.name).remove();
      }
    } else if (document.getElementById(this.name)) { // IF RESTAURANT HAVE LOW RATING AND WAS VISIBLE BEFORE, REMOVE IT
      document.getElementById(this.name).remove();
    }
    restaurantsAmount.innerHTML = document.querySelectorAll("#restaurants-list div").length + ' résultats...'; //Update The Counter With Founded Restaurants Amount
  }
}
class JsonList {
  constructor(list) {
    this.list = list;
  }
  initialize() { // SET RESTAURANTS'S JSON LIST INTO THE DOM
    restaurantsList = document.createElement('script');//
    restaurantsList.src = this.list;
    document.getElementsByTagName('head')[0].appendChild(restaurantsList);
  }
  setToLocalStorage() { // PUT THE RESTAURANTS'S LIST INTO LOCAL STORAGE FOR FUTUR ACCESS
    sessionStorage.setItem('restaurants', JSON.stringify(restaurantsJsonList[0].mainList)); // LOCAL STORAGE GET ONLY STRING DATA, NO OBJECTS
  }
  setMainList() { // PUT LIST'S RESTAURANTS ON THE MAP
    markers.forEach(item => item.setMap(null)); // REMOVE ALL MARKERS ON THE MAP
    var restaurantsJsonList = JSON.parse(sessionStorage.getItem('restaurants')); // GET RESTAURANTS LIST INTO LOCAL STORAGE

    for (let i = 0; i < restaurantsJsonList.length; i++) {
      // LET INITIALIZE EACH RESTAURANT VARIABLES AND GIVE THEM TO THE RESTAURANT OBJECT
      var restaurantName = restaurantsJsonList[i].restaurantName;
      var restaurantAddress = restaurantsJsonList[i].address;
      var ratingsArray = restaurantsJsonList[i].ratings;
      var itemLat = restaurantsJsonList[i].lat;
      var itemLong = restaurantsJsonList[i].long;
      var streetViewImage = restaurantsJsonList[i].streetViewImage;

      let restaurant = window["restaurant" + i];
      restaurant = new Restaurant(restaurantName, restaurantAddress, ratingsArray, itemLat, itemLong, streetViewImage, i);
      restaurant.setOnMap();
    } // END FOR
  }
  setNewReview(restaurant, comment, rating) { // ADD NEW REVIEW INTO LOCAL STORAGE RESTAURANTS LIST
    let tempRestaurantsJsonList = JSON.parse(sessionStorage.getItem('restaurants'));
    let restaurantRatingsArray = tempRestaurantsJsonList[restaurant].ratings;
    $('#reviewModal').modal('toggle');
    restaurantRatingsArray.push({ 'stars': rating, 'comment': comment });
    sessionStorage.setItem('restaurants', JSON.stringify(tempRestaurantsJsonList));
    jsonList.setMainList();
    bootbox.alert('<div class="lead p-3"><p>Merci pour votre commentaire.</p></div>');
  }
  setNewRestaurant(restaurantName, restaurantAdress, restaurantLat, restaurantLng) { // ADD NEW RESTAURANT INTO LOCAL STORAGE
    let tempRestaurantsJsonList = JSON.parse(sessionStorage.getItem('restaurants'));
    let restaurantIndex = tempRestaurantsJsonList.length;
    let newRestaurant = {
      "restaurantName": restaurantName,
      "address": restaurantAdress,
      "lat": parseFloat(restaurantLat),
      "long": parseFloat(restaurantLng),
      "streetViewImage": "" + parseFloat(restaurantLat) + "," + parseFloat(restaurantLng) + "",
      "ratings": []
    }
    tempRestaurantsJsonList.push(newRestaurant);
    sessionStorage.setItem('restaurants', JSON.stringify(tempRestaurantsJsonList));
    $('#addRestaurantModal').modal('toggle');
    alert('Restaurant ajouté, veuillez ajouter une note sur l\'écran suivant'); // RESTAURANT ADDED, NOW ASK TO USER TO SET REVIEW
    $('#reviewModalButton').attr('data-restaurant', restaurantIndex);
    $('#reviewModal').modal('toggle');
    for (let i = 9; i >= 0; i--) { // REMOVE SELECT OPTIONS IN MODAL
      addRestaurantAddressSelect.remove(i);
    }
    restaurantNameInput.value = ''; // RESET RESTAURANT NAME VALUE
  }
}
// ---------- FUNCTIONS ----------
function initMap() { // GOOGLE MAP INIT
  let mapStyleArray = [
    {
      "featureType": "poi.business",
      "elementType": "labels.icon",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    }
  ];
  let mapOptions = {
    center: { lat: 48.856614, lng: 2.3522219 },
    zoom: 17,
    mapTypeControl: false,
    styles: mapStyleArray
  }
  map = new google.maps.Map(document.getElementById('map'), mapOptions);
  infoWindow = new google.maps.InfoWindow; // NEW INFOWINDOW INSTANCE
  if (navigator.geolocation) { // CHECKING IF BROWSER SUPPORT GEOLOCATION
    navigator.geolocation.getCurrentPosition(function (position) {
      let mapLat = position.coords.latitude;
      let mapLng = position.coords.longitude;
      var pos = {
        lat: mapLat,
        lng: mapLng
      };
      userMarker = new google.maps.Marker({
        position: pos,
        map: map,
        icon: userMarkerIcon
      });
      bounds = new google.maps.LatLngBounds({
        lat: mapLat,
        lng: mapLng
      });
      infoWindow.setPosition(pos);
      infoWindow.setContent('<h3 class="py-3">Vous êtes ici !</h3>');
      infoWindow.open(map);
      map.setCenter(pos);
      afterInit(map, pos); //Geolocation is OK
    }, function () {
      let mapLat = map.getCenter().lat();
      let mapLng = map.getCenter().lng();
      var pos = {
        lat: mapLat,
        lng: mapLng
      };
      afterInit(map, pos); //User Deny Geolocation, Initialize With Defaults
    });
  } else { // IF BROWSER DOESN'T SUPPORT GEOLOCATION
    let mapLat = map.getCenter().lat();
    let mapLng = map.getCenter().lng();
    var pos = {
      lat: mapLat,
      lng: mapLng
    };
    afterInit(map, pos); //Browser Doesn't Support Geolocation, Initialize with defaults
  }
}
function afterInit(map, pos) {
  dialog.modal('hide');
  map.setCenter(pos);
  map.addListener('idle', function () {
    if (Date.now() > (clickTime + 1000)) //Refresh Restaurants On Map After Drag
      jsonList.setMainList();
  });
  map.addListener('click', function (mapsMouseEvent) { //Listen For A Click On The Map To Add A New Restaurant
    if (addRestaurantToggle.checked) { //Check If Add Restaurant Toggle Is On
      bootbox.confirm({
        message: '<div class="lead p-3"><p>Voulez-vous ajouter un restaurant ici ?</p></div>',
        locale: "fr",
        callback: function (result) {
          if (result) {
            if (window.XMLHttpRequest) { // COMPATIBILITY CODE
              httpRequest = new XMLHttpRequest();
            }
            else if (window.ActiveXObject) { // IE 6 & EARLIER
              httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
            }//Call Geocode API...
            httpRequest.onreadystatechange = getHttpResponse;
            httpRequest.open('GET', 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + mapsMouseEvent.latLng.lat() + ',' + mapsMouseEvent.latLng.lng() + '&key=' + api_key + '', true);
            httpRequest.send();
          }
        }
      });
    }
  });
}
function loadMap() { // LOAD CONFIG FILE
  var map = document.createElement("script");
  map.type = "text/javascript";
  map.src = "https://maps.googleapis.com/maps/api/js?key=" + api_key + "&maptype=roadmap&callback=initMap";
  document.body.appendChild(map);
}
function getHttpResponse() { //Return Of The Geolocation Request
  if (httpRequest.readyState === XMLHttpRequest.DONE) {
    if (httpRequest.status === 200) {
      let response = JSON.parse(httpRequest.responseText);
      let responseLength = response.results.length;
      for (let i = 0; i < responseLength; i++) {
        let results = response.results[i];
        let restaurantLat = results.geometry.location.lat;
        let restaurantLng = results.geometry.location.lng;
        let option = document.createElement('option');
        option.innerHTML = results.formatted_address;
        option.setAttribute('value', results.formatted_address)
        addRestaurantAddressSelect.append(option);
        option.dataset.lat = restaurantLat;
        option.dataset.lng = restaurantLng;
      }
      $('#addRestaurantModal').modal('toggle');
    } else {
      bootbox.alert('Il y a eu un problème avec la requête HTTP. Contactez un développeur.');
    }
  }
}
function calculateAverage(dividend, divider) {
  let result = parseFloat(dividend / divider).toFixed(2);
  return result;
}
// ---------- OBJECTS INSTANCES ----------
const jsonList = new JsonList('js/restaurantsList.js'); // CREATE JSON LIST INSTANCE WITH RESTAURANTS LIST FILE
jsonList.initialize(); // INITIALIZE JSON LIST
// ---------- ONLOAD INIT ----------
window.onload = function () {
  jsonList.setToLocalStorage(); // SET JSON LIST INTO LOCAL STORAGE
  loadMap(); // LOAD THE MAP
}
// ---------- TRIGGERS ----------
addReviewForm.addEventListener('submit', function (event) {
  event.preventDefault();
  let comment = reviewTextArea.value;
  let restaurant = $('#reviewModalButton').attr('data-restaurant');
  let rating = parseInt(document.getElementById('reviewRating').value);
  jsonList.setNewReview(restaurant, comment, rating);
});
addRestaurantForm.addEventListener('submit', function (event) {//Add Restaurant Form Trigger
  event.preventDefault();
  let restaurantName = restaurantNameInput.value;
  let restaurantAddress = addRestaurantAddressSelect.value;
  let restaurantLat = addRestaurantAddressSelect.options[addRestaurantAddressSelect.selectedIndex].dataset.lat;
  let restaurantLng = addRestaurantAddressSelect.options[addRestaurantAddressSelect.selectedIndex].dataset.lng;
  jsonList.setNewRestaurant(restaurantName, restaurantAddress, restaurantLat, restaurantLng);
});
$('#addRestaurantToggle').on('change', function (event) {//Add Restaurant Toggle Trigger
  if (this.checked) {
    bootbox.alert('<div class="lead p-3"><p>Cliquer n\'importe où sur la carte pour ajouter un restaurant...</p></div>');
  }
});
$('#reviewModal').on('show.bs.modal', function (event) {//Review Modal Show Trigger
  let button = $(event.relatedTarget);
  let restaurant = button.data('restaurant');
  $('#reviewModalButton').attr('data-restaurant', restaurant);
});
$('#reviewModal').on('hidden.bs.modal', function (event) {//Review Modal Hide Trigger
  reviewTextArea.value = '';
  $('#reviewModalButton').removeAttr('data-restaurant');
})