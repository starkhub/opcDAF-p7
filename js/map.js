// ----- VARS
var api_key = config.secret_key; //Initialize the API KEY from external file
var restaurantsList, map, infoWindow, marker, bounds, mapLat, mapLng; //Initialize main variables
var userMarkerIcon = './css/images/user-marker-64.png'; //Init. user marker icon
var restaurantMarkerIcon = './css/images/restaurant-marker-32.png'; //Init. restaurants marker icon
var markers = []; //Init. markers array
var restaurantsListDiv = document.getElementById('restaurants-list'); //Init. restaurants list container
var restaurantsAmount = document.getElementById('restaurants-amount'); //Init. restaurants amount counter
var addRestaurantToggle = document.getElementById('addRestaurantToggle'); //Init. add new restaurant toggle
// RESTAURANT MODALS VARS
var restaurantNameInput = document.getElementById('addRestaurantName');
var addRestaurantAddressSelect = document.getElementById('addRestaurantAddressSelect');
// REVIEW MODALS VARS
var reviewModal = document.getElementById('reviewModal');
var reviewTextArea = document.getElementById('reviewCommentArea');
// INITIAL DIALOG
var dialog = bootbox.dialog({
  message: '<div class="lead p-3"><p class="text-center mb-5">Bienvenue !</p><p class="text-justify">Nous vous conseillons d\'accepter la demande de localisation afin d\'obtenir une expérience d\'utilisation optimale. <br/>Nous ne conservons aucune donnée personnelle.</p><p class="text-center mt-5">Nous vous souhaitons d\'avance un bon appétit !</p></div>',
  closeButton: false
});
// ----- OBJECTS
class Restaurant {
  constructor(name, address, reviewsArray, rating, lat, lng, streetViewImage, index, placeId, source) {
    this.name = name,
      this.address = address,
      this.rating = rating,
      this.reviewsArray = reviewsArray,
      this.lat = lat,
      this.lng = lng,
      this.streetViewImage = streetViewImage,
      this.index = index,
      this.placeId = placeId,
      this.source = source //User Added or Google Place API Added
  }
  setOnMap() {
    var ratingsSum = 0;
    var ratingsComments = '<ul class="restaurant-reviews">';
    var restaurantAvgRating;
    var coords = new google.maps.LatLng(this.lat, this.lng);
    var formatedID = this.name.replace(/ /g, "_");
    var ratingFilter = parseInt(document.getElementById('rating-filter').value);
    this.reviewsArray.forEach(
      star => ratingsSum += star.stars
    );
    this.reviewsArray.forEach(
      comment => ratingsComments += '<li><span><strong>Note</strong> : ' + comment.stars + '</span><br /><span><strong>Commentaire</strong> : ' + comment.comment + '</span></li><br/><hr>'
    );
    ratingsComments += '</ul>';
    if (this.rating >= 0 && this.rating <= ratingFilter) { //Rating Filter Check
      if (map.getBounds().contains(coords)) { //Map Bounds Check
        let marker = new google.maps.Marker({
          position: coords,
          map: map,
          icon: restaurantMarkerIcon,
          placeId: this.placeId,
          source: this.source
        });
        let infowindow = new google.maps.InfoWindow({
          content:
            '<div class="infoWindow"><h2 class="my-5 text-center">' + this.name + '</h2>' +
            '<div class="streeViewImage"><img src="https://maps.googleapis.com/maps/api/streetview?size=600x400&location=' + this.streetViewImage + '&key=' + api_key + '"></div>' +
            '<p class="infoWindowAddress mt-2">' + this.address + '</p>' +
            '<p class="infoWindowRating" id="infoWindowRating"><span class="font-weight-bold">Moyenne des notes : </span>' + this.rating + '</p>' +
            '<h3>Avis clients</h3>' +
            '<ul id="restaurant-reviews"></ul></div>'
        });
        marker.addListener('click', function () { //Listen For Marker Click, Getting Reviews By Clicking
          infowindow.open(map, marker);
          jsonList.getReviews(this.placeId, this.source);
        });
        markers.push(marker); //Put Markers Into The Markers Array
        let restaurantsListContent = document.createElement('div'); //Create The Restaurant Card
        restaurantsListDiv.appendChild(restaurantsListContent).classList.add('restaurant-file', 'my-2', 'card', 'p-2', 'text-center');
        restaurantsListContent.id = formatedID;
        restaurantsListContent.innerHTML = '<h2>' + this.name + '</h2>' +
          '<p id="restaurantAvgRating' + this.index + '"></p>' +
          '<button name="addReviewButton" class="btn btn-warning" id="addReviewButton' + this.index + '" data-restaurant="' + this.index + '" data-toggle="modal" data-target="#reviewModal">Ajouter un avis</button></div>';
        restaurantAvgRating = document.getElementById('restaurantAvgRating' + this.index);
        restaurantAvgRating.innerHTML = '<p><strong>Moyenne des notes</strong> : ' + this.rating + '</p>';
      }
    }
    restaurantsAmount.innerHTML = document.querySelectorAll("#restaurants-list div").length + ' résultats...'; //Update The Counter With Founded Restaurants Amount
  }
}
class JsonList {
  constructor() {
    this.map;
    this.coords;
    this.service;
  }
  initialize() {
    this.deleteFromSessionStorage();
  }
  setMap(map, coords) {//SETTERS
    this.map = map;
    this.coords = coords;
    this.service = new google.maps.places.PlacesService(this.map);
  }
  setMainList(items) {
    return new Promise((resolve, reject) => {
      if (this.getMainList() === null) {
        sessionStorage.setItem('restaurants', JSON.stringify(items)); //This Is The First Record On The List
        resolve();
      } else {
        let tempMainList = this.getMainList(); //Restaurants Are Already In The List
        let tempNewMainList = tempMainList.concat(items);
        sessionStorage.setItem('restaurants', JSON.stringify(tempNewMainList));
        resolve();
      }
    })
  }
  setNewReview(restaurant, comment, rating) {
    let tempMainList = this.getMainList();
    let tempReviewsArray = tempMainList[restaurant].reviews;
    let oldRatingTotal = Number(tempMainList[restaurant].ratingTotal);
    let oldRating = Number(tempMainList[restaurant].rating);
    let newRatingTotal = tempMainList[restaurant].ratingTotal = oldRatingTotal + 1;
    let newRating = tempMainList[restaurant].rating = parseFloat((oldRatingTotal * oldRating + rating) / newRatingTotal).toFixed(2);
    tempReviewsArray.push({ 'stars': rating, 'comment': comment });
    $('#reviewModal').modal('toggle');
    this.deleteFromSessionStorage();
    this.setMainList(tempMainList);
    bootbox.alert('<div class="lead p-3"><p>Merci pour votre commentaire.</p></div>');
  }
  setNewRestaurant(restaurantName, restaurantAdress, restaurantLat, restaurantLng) {
    var newRestaurant = {
      "restaurantName": restaurantName,
      "address": restaurantAdress,
      "lat": parseFloat(restaurantLat),
      "long": parseFloat(restaurantLng),
      "streetViewImage": "" + parseFloat(restaurantLat) + "," + parseFloat(restaurantLng) + "",
      "rating": 0,
      "ratingTotal": 0,
      "reviews": [],
      "source": "user"
    }
    var restaurantIndex;
    var restaurantToAdd;
    if (this.getMainList() !== null) {
      var tempMainList = this.getMainList();
      restaurantIndex = tempMainList.length;
      restaurantToAdd = newRestaurant;
    } else {
      restaurantIndex = 0;
      restaurantToAdd = [newRestaurant];
    }
    this.setMainList(restaurantToAdd).then(function () {
      $('#addRestaurantModal').modal('toggle');
      bootbox.confirm({
        message: '<div class="lead p-3"><p>Restaurant ajouté, voulez-vous saisir un avis ?</p></div>',
        locale: "fr",
        callback: function (result) {
          if (result) {
            $('#reviewModalButton').attr('data-restaurant', restaurantIndex);
            $('#reviewModal').modal('toggle');
          }
        }
      });
      for (let i = 9; i >= 0; i--) { // REMOVE SELECT OPTIONS IN MODAL
        addRestaurantAddressSelect.remove(i);
      }
      restaurantNameInput.value = ''; // RESET RESTAURANT NAME VALUE
      jsonList.searchPlacesInThisArea();
    });
  }
  getMainList() { //GETTERS
    return JSON.parse(sessionStorage.getItem('restaurants'));
  }
  getPlaces(bounds) { //Search For Nearest Places
    this.placesList = []; //Reset The Places List Before Fill It Again
    var request = {
      bounds: bounds,
      type: ['restaurant']
    };
    this.service.nearbySearch(request, placeCallback);
  }
  getReviews(placeId, source) { //Search For Place Reviews
    if (source === "user") { //If Restaurant Source Is User (User Added Restaurant)
      var checkExist = setInterval(function () {
        if (document.getElementById('restaurant-reviews')) { //Wait For Restaurant Reviews Container To Exists On The Dom
          clearInterval(checkExist);
          detailsFetch(placeId);
        }
      }, 100); //Check Every 100ms
    } else { //If Restaurant Source Is From Google Places
      var request = {
        placeId: placeId
      };
      this.service.getDetails(request, detailsCallback);
    }
  }
  getRestaurants() { //Get Restaurants From Main List
    let sessionStorageLength = sessionStorage.length;
    restaurantsListDiv.innerHTML = "";
    markers.forEach(item => item.setMap(null));
    var restaurantsJsonList = JSON.parse(sessionStorage.getItem('restaurants'));
    if (sessionStorageLength != 0) {
      for (let i = 0; i < restaurantsJsonList.length; i++) {
        // LET INITIALIZE EACH RESTAURANT VARIABLES AND GIVE THEM TO THE RESTAURANT OBJECT
        var restaurantName = restaurantsJsonList[i].restaurantName;
        var restaurantAddress = restaurantsJsonList[i].address;
        var restaurantRating = restaurantsJsonList[i].rating;
        var reviewsArray = restaurantsJsonList[i].reviews;
        var itemLat = restaurantsJsonList[i].lat;
        var itemLong = restaurantsJsonList[i].long;
        var streetViewImage = restaurantsJsonList[i].streetViewImage;
        var placeId = restaurantsJsonList[i].placeId;
        var source = restaurantsJsonList[i].source;
        let restaurant = window["restaurant" + i];
        restaurant = new Restaurant(restaurantName, restaurantAddress, reviewsArray, restaurantRating, itemLat, itemLong, streetViewImage, i, placeId, source);
        restaurant.setOnMap();
      }
    }
  }
  searchPlacesInThisArea() { //METHODS
    let bounds = map.getBounds();
    this.getPlaces(bounds);
  }
  deleteFromSessionStorage() { //Delete Main List Inside Session Storage If Exists
    if (sessionStorage.getItem('restaurants') != null) {
      sessionStorage.removeItem('restaurants');
    }
  }
}
const jsonList = new JsonList();// STEP 1 - NEW JSONLIST INSTANCE
// ----- FUNCTIONS
function loadMap() { // STEP 2 - LOAD GOOGLE MAPS AS JS SCRIPT
  var map = document.createElement("script");
  map.type = "text/javascript";
  map.src = "https://maps.googleapis.com/maps/api/js?key=" + api_key + "&libraries=places&maptype=roadmap&callback=initMap"; // CALL MAPS API & PLACES LIBRARY THEN CALLBACK INITMAP
  document.body.appendChild(map);
}
function initMap() { // STEP 3 - GOOGLE MAP INIT
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
  infoWindow = new google.maps.InfoWindow;
  const searchControlDiv = document.createElement("div");
  searchPlacesInThisAreaControl(searchControlDiv, map);
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(searchControlDiv);
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
      afterInit(map, pos, mapLat, mapLng); //Geolocation is OK
    }, function () {
      let mapLat = map.getCenter().lat();
      let mapLng = map.getCenter().lng();
      var pos = {
        lat: mapLat,
        lng: mapLng
      };
      afterInit(map, pos, mapLat, mapLng); //User Deny Geolocation, Initialize With Defaults
    });
  } else {
    let mapLat = map.getCenter().lat();
    let mapLng = map.getCenter().lng();
    var pos = {
      lat: mapLat,
      lng: mapLng
    };
    afterInit(map, pos, mapLat, mapLng); //Browser Doesn't Support Geolocation, Initialize with defaults
  }
}
function afterInit(map, pos, mapLat, mapLng) {
  map.setCenter(pos);
  var coords = new google.maps.LatLng(mapLat, mapLng);
  dialog.modal('hide');
  jsonList.setMap(map, coords);
  jsonList.initialize();
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
function placeCallback(results, status) { //Get Nearby Places
  if (status == google.maps.places.PlacesServiceStatus.OK) {//Nearby Search Return Something
    var tempList = [];
    var mainList = jsonList.getMainList();
    var placeIdTempList = [];
    if (mainList != null) {
      for (let i = 0; i < mainList.length; i++) {
        placeIdTempList.push(mainList[i].placeId);
      }
    }
    for (var i = 0; i < results.length; i++) {
      var restaurantPlaceID = results[i].place_id;
      let restaurantLng = results[i].geometry.location.lng();
      let restaurantLat = results[i].geometry.location.lat();
      let restaurantName = results[i].name;
      let restaurantAddress = results[i].vicinity;
      let restaurantRating = results[i].rating != null ? results[i].rating : "0";
      let restaurantRatingsTotal = results[i].user_ratings_total != null ? results[i].user_ratings_total : "0";
      let newRestaurant = {
        "restaurantName": restaurantName,
        "address": restaurantAddress,
        "lat": parseFloat(restaurantLat),
        "long": parseFloat(restaurantLng),
        "streetViewImage": "" + parseFloat(restaurantLat) + "," + parseFloat(restaurantLng) + "",
        "rating": restaurantRating,
        "ratingTotal": restaurantRatingsTotal,
        "reviews": [],
        "placeId": restaurantPlaceID,
        "source": "googlePlaces"
      }
      if (mainList != null) { //Session Storage Main List Is Not Null
        if (placeIdTempList.includes(restaurantPlaceID) === false) { //Restaurant Is Not In Session Storage List
          tempList.push(newRestaurant);
        }
      } else { //Session Storage Main List Is Null
        tempList.push(newRestaurant);
      }
    }
    if (tempList.length > 0) {//There's New Restaurants To Save
      jsonList.setMainList(tempList).then(jsonList.getRestaurants());
    } else {//All The Restaurants are already saved
      jsonList.getRestaurants();
    }
  } else {//Nearby Search Return Nothing
    restaurantsAmount.innerHTML = document.querySelectorAll("#restaurants-list div").length + ' résultats...';
    jsonList.getRestaurants();
  }
}
function detailsCallback(place, status) { //Get Reviews Of Given Place For Google Place Added Restaurant
  if (status == google.maps.places.PlacesServiceStatus.OK) { //Getting Reviews Return Something
    var tempMainList = jsonList.getMainList();
    var reviewsContainer = document.getElementById('restaurant-reviews');
    reviewsContainer.innerHTML = "";
    let newRestaurantReviews = {
      "reviews": place.reviews
    }
    let placeId = place.place_id;
    let index;
    for (let i = 0; i < tempMainList.length; i++) {
      if (tempMainList[i].placeId === placeId) {//Get The Right Restaurant In The Main List
        index = i;
        let reviewsArray = tempMainList[i].reviews;
        if (reviewsArray.length != 0) {//There's Already Some Reviews Inside The Array
          reviewsArray.forEach(function (item) {
            reviewsContainer.innerHTML += '<li><span><strong>Note</strong> : ' + item.stars + '</span><br /><span><strong>Commentaire</strong> : ' + item.comment + '</span></li><br/><hr>';
          });
        }
      }
    }
    if (newRestaurantReviews.reviews != undefined) {
      newRestaurantReviews.reviews.forEach(function (item) {
        reviewsContainer.innerHTML += '<li><span><strong>Note</strong> : ' + item.rating + '</span><br /><span><strong>Commentaire</strong> : ' + item.text + '</span></li><br/><hr>';
      });
    } else if (newRestaurantReviews.reviews === undefined && reviewsContainer.innerHTML === "") {
      reviewsContainer.innerHTML += '<p class="text-center">Aucun avis à afficher pour le moment...</p>';
    }
  } else {
    bootbox.alert('Un problème est survenu surant la requête à la ligne 425. Contactez un développeur.')
  }
}
function detailsFetch(placeId) { //Fetch Place Details And Put Them Inside The Place InfoWindow For User Added Restaurant
  var tempMainList = jsonList.getMainList();
  var reviewsContainer = document.getElementById('restaurant-reviews');
  reviewsContainer.innerHTML = "";
  for (let i = 0; i < tempMainList.length; i++) {
    if (tempMainList[i].placeId === placeId) {
      index = i;
      let reviewsArray = tempMainList[i].reviews;
      if (reviewsArray.length != 0) {
        reviewsArray.forEach(function (item) {
          reviewsContainer.innerHTML += '<li><span><strong>Note</strong> : ' + item.stars + '</span><br /><span><strong>Commentaire</strong> : ' + item.comment + '</span></li><br/><hr>'
        });
      }
    }
  }
}
// ----- MAP CUSTOM CONTROL
function searchPlacesInThisAreaControl(controlDiv, map) {
  const controlUI = document.createElement("div"); // CUSTOM CONTROL CSS
  controlUI.classList.add('btn');
  controlUI.classList.add('btn-warning');
  controlUI.classList.add('border');
  controlUI.classList.add('border-dark');
  controlUI.title = "Rechercher dans cette zone";
  controlDiv.appendChild(controlUI);
  const controlText = document.createElement("div"); // CUSTOM CONTROL TEXT CSS
  controlText.style.color = "rgb(25,25,25)";
  controlText.style.fontFamily = "Roboto,Arial,sans-serif";
  controlText.style.fontSize = "16px";
  controlText.style.lineHeight = "38px";
  controlText.style.paddingLeft = "5px";
  controlText.style.paddingRight = "5px";
  controlText.innerHTML = "Rechercher";
  controlUI.appendChild(controlText);
  controlUI.addEventListener("click", () => { // CUSTOM CONTROL TRIGGER
    jsonList.searchPlacesInThisArea();
  });
}
// ----- ONLOAD INIT
window.onload = function () {
  loadMap(); // STEP 2 - LOAD THE MAIN MAP
}
// ----- TRIGGERS
addReviewForm.addEventListener('submit', function (event) {//Add Review Form Trigger
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
});