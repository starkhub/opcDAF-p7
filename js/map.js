// ---------- VARS ----------
var api_key = config.secret_key; //initialisation clé API à partir d'un fichier config séparé
var restaurantsList, map, infoWindow, marker, bounds, mapLat, mapLng; //init. variables
var markerIcon = './css/images/user-marker-64.png'; //init. image marker utilisateur
var markers = []; //init. tableau des markers
var restaurantsListDiv = document.getElementById('restaurants-list'); // init. de la liste des restaurants
var restaurantsAmout = document.getElementById('restaurants-amount'); // init. du nombre de restaurants trouvés
var clickTime = Date.now() - 1001; //timer infoWindow
// ---------- RESTAURANT MODALS VARS ----------
var reviewModal = document.getElementById('reviewModal');
var reviewRatingSelect = document.getElementById('reviewRating');
var reviewTextArea = document.getElementById('reviewCommentArea');
var closeReviewModalButton = document.getElementById('closeReviewModalButton');
// ---------- REVIEW MODALS VARS ----------
var reviewModalButton = document.getElementById('reviewModalButton');
var addRestaurantModalButton = document.getElementById('addRestaurantModalButton');
var restaurantNameInput = document.getElementById('addRestaurantName');
var addRestaurantAddressSelect = document.getElementById('addRestaurantAddressSelect');

var placesIdArr = [];

// ---------- OBJECTS ----------
class Card {
  constructor() {

  }
  create() {

  }
  delete() {

  }
  update() {

  }
}

class Restaurant {
  constructor(name, address, reviewsArray, rating, lat, lng, streetViewImage, index, placeId) {
      this.name = name,
      this.address = address,
      this.rating = rating,
      this.reviewsArray = reviewsArray,
      this.lat = lat,
      this.lng = lng,
      this.streetViewImage = streetViewImage,
      this.index = index,
      this.placeId = placeId
  }
  setOnMap() {
    console.log('Restaurant.setOnMap : ' + this.name)
    var ratingsSum = 0;
    var ratingsComments = '<ul class="restaurant-reviews">';
    var restaurantAvgRating;
    var coords = new google.maps.LatLng(this.lat, this.lng);
    var formatedID = this.name.replace(/ /g, "_");
    var checkRestaurantID = document.getElementById(formatedID);
    var ratingFilter = parseInt(document.getElementById('rating-filter').value); // GET THE VALUE OF THE RATING FILTER BUTTON

    this.reviewsArray.forEach(
      star => ratingsSum += star.stars
    );

    this.reviewsArray.forEach(
      comment => ratingsComments += '<li><span><strong>Note</strong> : ' + comment.stars + '</span><br /><span><strong>Commentaire</strong> : ' + comment.comment + '</span></li><br/><hr>'
    );

    ratingsComments += '</ul>';

    //var ratingsAvg = calculateAverage(ratingsSum, this.reviewsArray.length);

    if (this.rating >= 0 && this.rating <= ratingFilter) { // FILTER RESTAURANTS BY NOTES

      console.log('The rating is OK, let\'s check the bounds !');

      if (map.getBounds().contains(coords)) {

        console.log('Restaurant is in bounds !');

        let marker = new google.maps.Marker({
          position: coords,
          map: map,
          placeId: this.placeId
        });
        let infowindow = new google.maps.InfoWindow({
          content:

            '<div class="infoWindow"><h2 class="my-15">' + this.name + '</h2>' +
            '<p class="infoWindowAddress">' + this.address + '</p>' +
            '<p class="infoWindowRating" id="infoWindowRating"> Moyenne des notes : ' + this.rating + '</p>' +
            '<h3>Avis clients</h3>' +
            '<ul id="restaurant-reviews">' + 
            '</ul></div>' +
            '<div class="streeViewImage"><img src="https://maps.googleapis.com/maps/api/streetview?size=600x400&location=' + this.streetViewImage + '&key=' + api_key + '"></div>'
        });

        marker.addListener('click', function () { // MARKER CLICK EVENT LISTENER
          console.log('ouverture ' + this.placeId);
          infowindow.open(map, marker);
          jsonList.getReviews(this.placeId);
          clickTime = Date.now();
        });
        
        markers.push(marker); // PUT MARKER INSIDE MARKER'S ARRAY

        console.log('Create Restaurant Card If Not Exist');

          let restaurantsListContent = document.createElement('div');
          restaurantsListDiv.appendChild(restaurantsListContent).classList.add('restaurant-file', 'my-15');
          restaurantsListContent.id = formatedID;
          restaurantsListContent.innerHTML = '<h2>' + this.name + '</h2>' +
            '<p id="restaurantAvgRating' + this.index + '"></p>' +
            '<button name="addReviewButton" class="bg-secondary" id="addReviewButton' + this.index + '" data-target="reviewModal" onclick="toggleModal(this.dataset.target, ' + this.index + ')">Ajouter un avis</button></div>';
          restaurantAvgRating = document.getElementById('restaurantAvgRating' + this.index);
          restaurantAvgRating.innerHTML = '<p><strong>Moyenne des notes</strong> : ' + this.rating + '</p>';

      } else { // IF RESTAURANT'S OUT OF BOUNDS AND WAS VIBIBLE BEFORE, REMOVE IT

        console.log('restaurant is out of bounds...');

      }


    } else { // IF RESTAURANT HAVE LOW RATING AND WAS VISIBLE BEFORE, REMOVE IT
      
      console.log('Restaurant have low rating...');
      
    }

  }

}
class JsonList {
  constructor() {
    this.map;
    this.coords;
    this.service;
    this.mainlist = [];
    this.placesList = [];
    this.reviewsList = []; // NO FUTUR NEED
  }
  initialize() { // SET RESTAURANTS'S JSON LIST INTO THE DOM
    console.log('JsonList.initialize ->')
    sessionStorage.removeItem('restaurants');
    let bounds = map.getBounds();
    this.getPlaces(bounds);
  }
  // ---------- SETTERS
  setMap(map, coords) {
    console.log('JsonList.setMap ->')
    this.map = map;
    this.coords = coords;
    this.service = new google.maps.places.PlacesService(this.map);
  }
  setPlaces(items) {
    console.log('JsonList.setPlaces ->')
    this.placesList.push(items);
    console.log(this.placesList[0])
    //this.getReviews(this.list[0])
  }
  setReviews(items) {
    this.reviewsList.push(items)
  }
  setMainList() {
    console.log('JsonList.setMainList ->')
    console.log(this.placesList[0])
  }
  // ---------- RETRIEVERS
  getPlaces(bounds) {
    console.log('JsonList.getPlaces ->')
    this.placesList = []; // RESET THE PLACES LIST ARRAY BEFORE FILL IT AGAIN
    var request = {
      bounds: bounds,
      type: ['restaurant']
    };
    this.service.nearbySearch(request, placeCallback); // SEARCH FOR NEAREST PLACES WITH CALLBACK FUNCTION 
  }
  getReviews(placeId) {
    var request = {
      placeId: placeId
    };
    this.service.getDetails(request, detailsCallback); // SEARCH FOR REVIEWS
  }
  // ---------- GETTERS
  places() {
    console.log(this.placesList)
  }
  reviews() {
    console.log(this.reviewsList)
  }
  // ---------- METHODS
  searchPlacesInThisArea() {
    console.log('JsonList.searchPlacesInThisArea');
    let bounds = map.getBounds();
    this.getPlaces(bounds);

  }

  deleteFromLocalStorage() {
    console.log('jsonList.deleteFromLocalStorage')
    sessionStorage.removeItem('restaurants');
  }

  setToLocalStorage() { // PUT THE RESTAURANTS'S LIST INTO LOCAL STORAGE FOR FUTUR ACCESS
    //sessionStorage.setItem('restaurants', JSON.stringify(restaurantsJsonList[0].mainList)); // LOCAL STORAGE GET ONLY STRING DATA, NO OBJECTS
    this.deleteFromLocalStorage();
    let placesList = this.placesList[0];
    sessionStorage.setItem('restaurants', JSON.stringify(this.placesList[0]));
    console.log('JsonList : Go Set To Local Storage End');
    
    this.setNewRestaurants();
    /*
    this.map.addListener('idle', function () {
      if (Date.now() > (clickTime + 1000))
        jsonList.setNewRestaurants();
    });
    */
  }
  setNewRestaurants() { // PUT LIST'S RESTAURANTS ON THE MAP
    console.log('JsonList.setNewRestaurants ->')
    let sessionStorageLength = sessionStorage.length;

    restaurantsListDiv.innerHTML = ""; // EMPTY THE RESTAURANT CARDS LIST
    markers.forEach(item => item.setMap(null)); // REMOVE ALL MARKERS ON THE MAP
    var restaurantsJsonList = JSON.parse(sessionStorage.getItem('restaurants')); // GET RESTAURANTS LIST INTO LOCAL STORAGE

    var restaurantsIndexArr = [];
    var restaurantObjectNameArray = [];

    if (sessionStorageLength != 0) {
      console.log('Restaurants in the list = ' + restaurantsJsonList.length);
      restaurantsAmout.innerHTML = restaurantsJsonList.length + ' résultats...';
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

        let restaurant = window["restaurant" + i];
        restaurant = new Restaurant(restaurantName, restaurantAddress, reviewsArray, restaurantRating, itemLat, itemLong, streetViewImage, i, placeId);
        //TODO : CHECK IF THE RESTAURANT CARD IS ALREADY ON THE DOM !
        restaurant.setOnMap();

      } // END FOR
    }
  }
  setNewReview(restaurant) { // ADD NEW REVIEW INTO LOCAL STORAGE RESTAURANTS LIST
    let tempRestaurantsJsonList = JSON.parse(sessionStorage.getItem('restaurants'));
    let restaurantRatingsArray = tempRestaurantsJsonList[restaurant].ratings;
    let userComment = reviewTextArea.value;
    let userRating = parseInt(reviewRatingSelect.value);
    if (userComment != '') {
      toggleModal('reviewModal');
      reviewTextArea.value = '';
      restaurantRatingsArray.push({ 'stars': userRating, 'comment': userComment });
      sessionStorage.setItem('restaurants', JSON.stringify(tempRestaurantsJsonList));

      jsonList.setNewRestaurants();

      alert('Merci pour votre commentaire !');
    }
    else {
      alert('Veuillez saisir un commentaire !');
    }
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
    toggleModal('addRestaurantModal');
    alert('Restaurant ajouté, veuillez ajouter une note sur l\'écran suivant'); // RESTAURANT ADDED, NOW ASK TO USER TO SET REVIEW
    toggleModal('reviewModal', restaurantIndex);
    for (let i = 9; i >= 0; i--) { // REMOVE SELECT OPTIONS IN MODAL
      addRestaurantAddressSelect.remove(i);
    }
    restaurantNameInput.value = ''; // RESET RESTAURANT NAME VALUE
  }
}

// ---------- NEW JSONLIST INSTANCE ----------
console.log('1 - New JsonList')
const jsonList = new JsonList();

// ---------- FUNCTIONS ----------
function initMap() { // GOOGLE MAP INIT
  console.log('3 - Load Map Callback => Init Map')
  //alert("Merci d'autoriser la géolocalisation lorsque votre navigateur vous le proposera pour profiter au mieux des fonctionnalités de l'application !");
  map = new google.maps.Map(document.getElementById('map'), { // NEW MAP INSTANCE
    center: { lat: -34.397, lng: 150.644 },
    zoom: 17
  });

  infoWindow = new google.maps.InfoWindow; // NEW INFOWINDOW INSTANCE


  if (navigator.geolocation) { // CHECKING IF BROWSER SUPPORT GEOLOCATION
    console.log('3.1 - Checking for geolocation...')
    navigator.geolocation.getCurrentPosition(function (position) {
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      userMarker = new google.maps.Marker({
        position: pos,
        map: map,
        icon: markerIcon
      });
      mapLat = position.coords.latitude;
      mapLng = position.coords.longitude;
      bounds = new google.maps.LatLngBounds({
        lat: mapLat,
        lng: mapLng
      });
      infoWindow.setPosition(pos); // YOU ARE HERE POPUP
      infoWindow.setContent('<h3 class="pady-25">Vous êtes ici !</h3>');
      infoWindow.open(map); // OPEN THE MAP
      map.setCenter(pos); // CENTER

      var coords = new google.maps.LatLng(mapLat, mapLng);
      console.log('3.2 - Geolocation Ok...')
      jsonList.setMap(map, coords);
      jsonList.initialize();

      map.addListener('click', function (mapsMouseEvent) { // ADD RESTAURANT WITH A CLICK ON THE MAP 
        let prompt = confirm('Voulez-vous ajouter un nouveau restaurant ?');
        if (prompt) {

          if (window.XMLHttpRequest) { // COMPATIBILITY CODE
            httpRequest = new XMLHttpRequest();
          }
          else if (window.ActiveXObject) { // IE 6 & EARLIER
            httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
          }
          console.log('API_CALL_GEOCODE')
          httpRequest.onreadystatechange = getHttpResponse;
          httpRequest.open('GET', 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + mapsMouseEvent.latLng.lat() + ',' + mapsMouseEvent.latLng.lng() + '&key=' + api_key + '', true);
          httpRequest.send();
        }
      });
    }, function () {
      handleLocationError(true, infoWindow, map.getCenter());
    });
  } else { // IF BROWSER DOESN'T SUPPORT GEOLOCATION
    handleLocationError(false, infoWindow, map.getCenter());
  }
}

function checkMarkerInBounds(marker) { // CHECK MARKER'S POSITION
  return map.getBounds().contains(marker.getPosition());
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) { // HANDLING ERRORS
  infoWindow.setPosition(pos);
  infoWindow.setContent(browserHasGeolocation ?
    'Erreur : nous ne pouvons pas vous localiser.' :
    'Erreur : votre navigateur ne supporte pas la géolocalisation.');
  infoWindow.open(map);
}

function loadMap() { // LOAD CONFIG FILE
  var map = document.createElement("script");
  console.log('2 - Load Map');
  map.type = "text/javascript";
  map.src = "https://maps.googleapis.com/maps/api/js?key=" + api_key + "&libraries=places&maptype=roadmap&callback=initMap"; // CALL MAPS API & PLACES LIBRARY THEN CALLBACK INITMAP
  document.body.appendChild(map);
}

function toggleModal(target, item) { // GET THE MODAL ID AND THE RESTAURANT ID THEN REVEAL THE MODAL IF CLOSED, CLOSE IT IF OPENED
  let modal = document.getElementById(target);
  let modalVisibility = modal.style.display;
  let submitButton = document.getElementById(target + 'Button');
  if (modalVisibility == 'block') {
    modal.style.display = 'none';
    reviewTextArea.value = '';
    delete submitButton.dataset.target;
  } else {
    submitButton.dataset.target = item;
    modal.style.display = 'block'
  }
}
function getHttpResponse() { // RETURN OF THE HTTP REQUEST FOR GEOCODING
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
      toggleModal('addRestaurantModal');
    } else {
      alert('Il y a eu un problème avec la requête.');
    }
  }
}
function calculateAverage(dividend, divider) { // AS HIS NAME TELL, CALCULTATE THE AVERAGE RATING OF RESTAUTANT
  let result = parseFloat(dividend / divider).toFixed(2);
  return result;
}
function placeCallback(results, status) { // GET NEARBY PLACES OF CURRENT LOCATION
  console.log('function placeCallback start ->')
  console.log('placeCallback status = ' + status)
  if (status == google.maps.places.PlacesServiceStatus.OK) {
    var tempList = [];
    for (var i = 0; i < results.length; i++) {
      let restaurantLng = results[i].geometry.location.lng();
      let restaurantLat = results[i].geometry.location.lat();
      let restaurantName = results[i].name;
      let restaurantAddress = results[i].vicinity;
      let restaurantRating = results[i].rating != null ? results[i].rating : "0";
      let restaurantPlaceID = results[i].place_id;
      let newRestaurant = {
        "restaurantName": restaurantName,
        "address": restaurantAddress,
        "lat": parseFloat(restaurantLat),
        "long": parseFloat(restaurantLng),
        "streetViewImage": "" + parseFloat(restaurantLat) + "," + parseFloat(restaurantLng) + "",
        "rating": restaurantRating,
        "reviews": [],
        "placeId": restaurantPlaceID
      }
      //jsonList.getReviews(restaurantPlaceID); // CALL GETREVIEWS JSON LIST FUNCTION TO GET REVIEWS PUSHED IN REVIEWS JSON LIST IN SAME TIME
      tempList.push(newRestaurant); // PUSH FETCHED RESTAURANTS IN JSON LIST
    }
    jsonList.setPlaces(tempList) // CALL SETPLACES TO SET JSON PLACES LIST
    jsonList.setToLocalStorage();
  } else {
    jsonList.deleteFromLocalStorage();
    restaurantsListDiv.innerHTML = ''; // EMPTY THE RESTAURANTS LIST
    restaurantsAmout.innerHTML = 'Aucun résultat...';
    markers.forEach(item => item.setMap(null)); // REMOVE ALL MARKERS ON THE MAP
    console.log('function placeCallback IS NOT OK');
  }
}
function detailsCallback(place, status) { // GET REVIEWS OF GIVEN PLACE ID CALLBACK
  console.log('functiondetailsCallback start ->')
  console.log('detailsCallback status = ' + status)
  if (status == google.maps.places.PlacesServiceStatus.OK) {
    var tempList = [];
    let newRestaurantReviews = {
      "reviews": place.reviews
    }
    newRestaurantReviews.reviews.forEach(item => console.log(item.text))

    //jsonList.setReviews(newRestaurantReviews); // PUSH RESTAURANT PLACE_ID REVIEWS INSIDE REVIEWS JSON LIST

  } else {
    console.log('function detailsCallback is not ok !');
  }
}

// ---------- OBJECTS INSTANCES ----------
//const jsonList = new JsonList('js/restaurantsList.js'); // CREATE JSON LIST INSTANCE WITH RESTAURANTS LIST FILE
//jsonList.initialize(); // INITIALIZE JSON LIST

// ---------- ONLOAD INIT ----------
window.onload = function () {
  //jsonList.setToLocalStorage(); // SET JSON LIST INTO LOCAL STORAGE
  loadMap(); // LOAD THE MAP
}

// ---------- TRIGGERS ----------
reviewModalButton.addEventListener('click', function (event) { // ADD REVIEW BUTTON TRIGGER
  event.preventDefault();
  let resto = this.dataset.target;
  jsonList.setNewReview(resto);
});

addRestaurantModalButton.addEventListener('click', function (event) { // ADD RESTAURANT BUTTON TRIGGER
  event.preventDefault();
  let restaurantName = restaurantNameInput.value; // GET THE NEW RESTAURANT NAME
  if (restaurantName === '') {
    alert('Vous devez saisir le nom du restaurant !');
  } else {
    let restaurantAddress = addRestaurantAddressSelect.value; // SELECTED ADDRESS IN THE SELECT ADDRESS LIST
    let restaurantLat = addRestaurantAddressSelect.options[addRestaurantAddressSelect.selectedIndex].dataset.lat; // RETRIEVE SELECTED OPTION DATA
    let restaurantLng = addRestaurantAddressSelect.options[addRestaurantAddressSelect.selectedIndex].dataset.lng; // RETRIEVE SELECTED OPTION DATA
    jsonList.setNewRestaurant(restaurantName, restaurantAddress, restaurantLat, restaurantLng); // SET NEW RESTAURANT IN THE SESSION STORAGE LIST
  }
});

/*

 var newMap = new google.maps.LatLng(mapLat, mapLng);

 var placeRequest = {
   location: newMap,
   radius: '1500',
   type: ['restaurant']
 };

 placeService = new google.maps.places.PlacesService(map);
 placeService.nearbySearch(placeRequest, placeCallback);

function placeCallback(results, status) {

console.log()
if (status == google.maps.places.PlacesServiceStatus.OK) {
console.log(status)
 for (var i = 0; i < results.length; i++) {
   let restaurantLng = results[i].geometry.location.lng();
   let restaurantLat = results[i].geometry.location.lat();
   let restaurantName = results[i].name;
   let restaurantAddress = results[i].vicinity;
   let restaurantRating = results[i].rating;
   let restaurantPlaceID = results[i].place_id;
   placesIdArr.push(restaurantPlaceID)
 }
}
}

function detailsCallback(place, status){
if (status == google.maps.places.PlacesServiceStatus.OK) {
console.log(place)
}
}

*/