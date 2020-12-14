var api_key = config.secret_key; //Initialize the API KEY from external file
var restaurantsList, map, infoWindow, marker, bounds, mapLat, mapLng;
var userMarkerIcon = './css/images/user-marker-64.png';
var restaurantMarkerIcon = './css/images/restaurant-marker-32.png';
var markers = [];
var restaurantsListDiv = document.getElementById('restaurants-list');
var restaurantsAmount = document.getElementById('restaurants-amount');
var clickTime = Date.now() - 1001;
var welcomeMessage = bootbox.dialog({
  message: '<div class="lead p-3"><p class="text-center mb-5">Bienvenue !</p><p class="text-justify">Nous vous conseillons d\'accepter la demande de localisation afin d\'obtenir une expérience d\'utilisation optimale. <br/>Nous ne conservons aucune donnée personnelle.</p><p class="text-center mt-5">Nous vous souhaitons d\'avance un bon appétit !</p></div>',
  closeButton: false
});
class Restaurant {
  constructor(name, address, reviews, lat, lng, streetViewImage, index) {
    this.name = name;
    this.address = address;
    this.reviews = reviews;
    this.lat = lat;
    this.lng = lng;
    this.streetViewImage = streetViewImage;
    this.index = index;
    this.ratingsAvg;
    this.commentsContainer = '<ul class="restaurant-reviews">';
    this.coords;
    this.restaurantID = document.getElementById(this.name);
  }
  checkIfIsInBounds() {
    if (map.getBounds().contains(this.coords)) {
      this.setOnMap(this.coords);
      this.checkIfCardExistOnPage();
    } else if (document.getElementById(this.name)) {//Restaurant is no more in bounds, so if his card remains, delete her
      this.deleteCard();
    }
  }
  checkIfIsInRatingFilterRange() {
    let ratingFilter = parseInt(document.getElementById('rating-filter').value);
    if (this.ratingsAvg >= 0 && this.ratingsAvg <= ratingFilter) {
      this.checkIfIsInBounds();
    } else if (document.getElementById(this.name)) {
      this.deleteCard();
    }
  }
  checkIfCardExistOnPage() {
    !this.restaurantID ? this.setCard() : this.updateRating();
  }
  setCoords() {
    this.coords = new google.maps.LatLng(this.lat, this.lng);//
  }
  setComments() {
    this.reviews.forEach(
      comment => this.commentsContainer += '<li><span><strong>Note</strong> : ' + comment.stars + '</span><br/><span><strong>Commentaires</strong> : ' + comment.comment + '</span></li><br/><hr/>'
    );
    this.commentsContainer += '</ul>';
  }
  setRatingsAvg() {
    let ratingsSum = 0;
    this.reviews.forEach(
      star => ratingsSum += star.stars
    );
    this.ratingsAvg = calculateAverage(ratingsSum, this.reviews.length);
  }
  setCard() {
    let restaurantsListContent = document.createElement('div');
    restaurantsListDiv.appendChild(restaurantsListContent).classList.add('restaurant-file', 'my-2', 'card', 'p-2', 'text-center');
    restaurantsListContent.id = this.name;
    restaurantsListContent.innerHTML = '<h2>' + this.name + '</h2>' +
      '<p id="restaurantAvgRating' + this.index + '"></p>';
    this.updateRating();
  }
  setOnMap(coords) {
    let marker = new google.maps.Marker({
      position: coords,
      map: map,
      icon: restaurantMarkerIcon
    });
    let infowindow = new google.maps.InfoWindow({
      content:
        '<div class="infoWindow"><h2 class="my-5 text-center">' + this.name + '</h2>' +
        '<div class="streeViewImage"><img src="https://maps.googleapis.com/maps/api/streetview?size=600x400&location=' + this.streetViewImage + '&key=' + api_key + '"></div>' +
        '<p class="infoWindowAddress mt-2">' + this.address + '</p>' +
        '<p class="infoWindowRating" id="infoWindowRating"><span class="font-weight-bold">Moyenne des notes : </span>' + this.ratingsAvg + '</p>' +
        '<h3>Avis clients</h3>' +
        '<ul>' + this.commentsContainer + '</ul></div>'
    });
    marker.addListener('click', function () {
      infowindow.open(map, marker);
      clickTime = Date.now();
    });
    markers.push(marker);
  }
  deleteCard() {
    document.getElementById(this.name).remove();
  }
  updateRating() {
    let restaurantAvgRating = document.getElementById('restaurantAvgRating' + this.index);
    restaurantAvgRating.innerHTML = '<p><strong>Moyenne des notes</strong> : ' + this.ratingsAvg + '</p>';
  }
  buildAndSetToMap() {
    this.setCoords();
    this.setComments();
    this.setRatingsAvg();
    this.checkIfIsInRatingFilterRange();
    updateRestaurantsAmount();
  }
}
class JsonList {
  constructor(list) {
    this.list = list;
  }
  appendListToDom() {
    restaurantsList = document.createElement('script');
    restaurantsList.src = this.list;
    document.getElementsByTagName('head')[0].appendChild(restaurantsList);
  }
  setToSessionStorage() {
    sessionStorage.setItem('restaurants', JSON.stringify(restaurantsJsonList[0].mainList));
  }
  setMainList() {
    emptyMarkersArray();
    var restaurantsJsonList = JSON.parse(sessionStorage.getItem('restaurants'));
    for (let i = 0; i < restaurantsJsonList.length; i++) {
      let restaurant = window['restaurant' + i];
      let restaurantName = restaurantsJsonList[i].restaurantName;
      let restaurantAddress = restaurantsJsonList[i].address;
      let restaurantReviews = restaurantsJsonList[i].ratings;
      let restaurantLat = restaurantsJsonList[i].lat;
      let restaurantLng = restaurantsJsonList[i].long;
      let restaurantStreetViewImage = restaurantsJsonList[i].streetViewImage;
      restaurant = new Restaurant(restaurantName, restaurantAddress, restaurantReviews, restaurantLat, restaurantLng, restaurantStreetViewImage, i);
      restaurant.buildAndSetToMap();
    }
  }
}
function emptyMarkersArray() {
  markers.forEach(item => item.setMap(null));
}
function initializeMap() {
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
  if (navigator.geolocation) {
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
      loadMap(map, pos);
    }, function () {
      let mapLat = map.getCenter().lat();
      let mapLng = map.getCenter().lng();
      var pos = {
        lat: mapLat,
        lng: mapLng
      };
      loadMap(map, pos); //User Deny Geolocation, Initialize With Defaults
    });
  } else {
    let mapLat = map.getCenter().lat();
    let mapLng = map.getCenter().lng();
    var pos = {
      lat: mapLat,
      lng: mapLng
    };
    loadMap(map, pos); //Browser Doesn't Support Geolocation, Initialize with defaults
  }
}
function updateRestaurantsAmount() {
  restaurantsAmount.innerHTML = document.querySelectorAll("#restaurants-list div").length + ' résultats...'; // Update The Counter With Founded Restaurants Amount
}
function loadMap(map, pos) {
  welcomeMessage.modal('hide');
  map.setCenter(pos);
  map.addListener('idle', function () {
    if (Date.now() > (clickTime + 1000)) //Refresh Restaurants On Map After Drag
      jsonList.setMainList();
  });
}
function callMapApi() {
  var mapApiCall = document.createElement("script");
  mapApiCall.type = "text/javascript";
  mapApiCall.src = "https://maps.googleapis.com/maps/api/js?key=" + api_key + "&maptype=roadmap&callback=initializeMap";
  document.body.appendChild(mapApiCall);
}
function calculateAverage(dividend, divider) {
  let result = parseFloat(dividend / divider).toFixed(2);
  return result;
}
const jsonList = new JsonList('js/restaurantsList.js');
jsonList.appendListToDom();
window.onload = function () {
  jsonList.setToSessionStorage();
  callMapApi();
}
