// ---------- VARS ----------
var api_key = config.secret_key; //initialisation clé API à partir d'un fichier config séparé
var restaurantsList, map, infoWindow, marker, bounds, mapLat, mapLng; //init. variables
var markerIcon = './css/images/user-marker-64.png'; //init. image marker utilisateur
var markers = []; //init. tableau des markers
var restaurantsListDiv = document.getElementById('restaurants-list'); // init. de la liste des restaurants
var restaurantsAmount = document.getElementById('restaurants-amount'); // init. du nombre de restaurants trouvés
var clickTime = Date.now() - 1001; //timer infoWindow
// ---------- RESTAURANT MODALS VARS ----------
var restaurantNameInput = document.getElementById('addRestaurantName');
var addRestaurantAddressSelect = document.getElementById('addRestaurantAddressSelect');
// ---------- REVIEW MODALS VARS ----------
var reviewModal = document.getElementById('reviewModal');
var reviewTextArea = document.getElementById('reviewCommentArea');

// ---------- OBJECTS ----------

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

        let marker = new google.maps.Marker({
          position: coords,
          map: map,
          placeId: this.placeId
        });
        let infowindow = new google.maps.InfoWindow({
          content:

            '<div class="infoWindow"><h2 class="my-5">' + this.name + '</h2>' +
            '<div class="streeViewImage"><img src="https://maps.googleapis.com/maps/api/streetview?size=600x400&location=' + this.streetViewImage + '&key=' + api_key + '"></div>' +
            '<p class="infoWindowAddress mt-2">' + this.address + '</p>' +
            '<p class="infoWindowRating" id="infoWindowRating"><span class="font-weight-bold">Moyenne des notes : </span>' + this.rating + '</p>' +
            '<h3>Avis clients</h3>' +
            '<ul id="restaurant-reviews"></ul></div>'
        });

        marker.addListener('click', function () { // MARKER CLICK EVENT LISTENER
          console.log('ouverture ' + this.placeId);
          jsonList.getReviews(this.placeId);
          infowindow.open(map, marker);
          clickTime = Date.now();
        });

        markers.push(marker); // PUT MARKER INSIDE MARKER'S ARRAY

        console.log('Create Restaurant Card If Not Exist');

        let restaurantsListContent = document.createElement('div');
        restaurantsListDiv.appendChild(restaurantsListContent).classList.add('restaurant-file', 'my-2', 'card', 'p-2', 'text-center');
        restaurantsListContent.id = formatedID;
        restaurantsListContent.innerHTML = '<h2>' + this.name + '</h2>' +
          '<p id="restaurantAvgRating' + this.index + '"></p>' +
          '<button name="addReviewButton" class="btn btn-warning" id="addReviewButton' + this.index + '" data-restaurant="' + this.index + '" data-toggle="modal" data-target="#reviewModal">Ajouter un avis</button></div>';
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
  }
  initialize() { // SET RESTAURANTS'S JSON LIST INTO THE DOM
    console.log('JsonList.initialize ->')
    this.deleteFromSessionStorage();

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
    console.log(items)
    this.placesList.push(items);

    //this.getReviews(this.list[0])
  }
  setReviews(items) {
    this.reviewsList.push(items)
  }
  setMainList(items) {
    console.log('JsonList.setMainList ->')
    return new Promise((resolve, reject) => {
      if (this.main() === null) {
        console.log('JsonList.setMainList -> Premier enregistrement...')
        sessionStorage.setItem('restaurants', JSON.stringify(items));
        resolve("OK !");
      } else {
        console.log('JsonList.setMainList -> Des restaurants sont déjà dans la liste...')
        let tempMainList = this.main();
        let tempNewMainList = tempMainList.concat(items);
        sessionStorage.setItem('restaurants', JSON.stringify(tempNewMainList));
        resolve("OK !");
      }
    })
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
  main() {
    return JSON.parse(sessionStorage.getItem('restaurants'));
  }
  // ---------- METHODS
  searchPlacesInThisArea() {
    console.log('JsonList.searchPlacesInThisArea');
    let bounds = map.getBounds();
    this.getPlaces(bounds);
  }
  deleteFromSessionStorage() {
    console.log('jsonList.deleteFromSessionStorage')
    if (sessionStorage.getItem('restaurants') != null) {
      console.log('List présente dans le session Storage, on la supprime...')
      sessionStorage.removeItem('restaurants');
    } else {
      console.log('Aucune liste dans le session Storage...')
    }
  }
  getRestaurants() { // PUT LIST'S RESTAURANTS ON THE MAP
    console.log('JsonList.getRestaurants ->')
    let sessionStorageLength = sessionStorage.length;

    restaurantsListDiv.innerHTML = ""; // EMPTY THE RESTAURANT CARDS LIST
    markers.forEach(item => item.setMap(null)); // REMOVE ALL MARKERS ON THE MAP
    var restaurantsJsonList = JSON.parse(sessionStorage.getItem('restaurants')); // GET RESTAURANTS LIST INTO LOCAL STORAGE

    var restaurantsIndexArr = [];
    var restaurantObjectNameArray = [];

    if (sessionStorageLength != 0) {
      console.log('Restaurants in the list = ' + restaurantsJsonList.length);
      restaurantsAmount.innerHTML = restaurantsJsonList.length + ' résultats...';
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
  setNewReview(restaurant, comment, rating) { // ADD NEW REVIEW INTO LOCAL STORAGE RESTAURANTS LIST
    console.log('Index du restaurant = ' + restaurant)
    //let tempRestaurantsJsonList = JSON.parse(sessionStorage.getItem('restaurants'));
    let tempMainList = this.main();
    let tempReviewsArray = tempMainList[restaurant].reviews;
    tempReviewsArray.push({ 'stars': rating, 'comment': comment });
    $('#reviewModal').modal('toggle');
    this.deleteFromSessionStorage();
    this.setMainList(tempMainList).then(this.getRestaurants());
    alert('Merci pour votre commentaire !');
    /*
    console.log(restaurantRatingsArray)

    restaurantRatingsArray.push({ 'stars': rating, 'comment': comment });
    sessionStorage.setItem('restaurants', JSON.stringify(tempRestaurantsJsonList));
    jsonList.setNewRestaurants();
    alert('Merci pour votre commentaire !');*/
  }
  setNewRestaurant(restaurantName, restaurantAdress, restaurantLat, restaurantLng) { // ADD NEW RESTAURANT INTO LOCAL STORAGE
    var newRestaurant = {
      "restaurantName": restaurantName,
      "address": restaurantAdress,
      "lat": parseFloat(restaurantLat),
      "long": parseFloat(restaurantLng),
      "streetViewImage": "" + parseFloat(restaurantLat) + "," + parseFloat(restaurantLng) + "",
      "reviews": []
    }
    var restaurantIndex;
    var restaurantToAdd;
    if (this.main() !== null) {
      var tempMainList = this.main();
      restaurantIndex = tempMainList.length;
      restaurantToAdd = newRestaurant;
    } else {
      restaurantIndex = 0;
      restaurantToAdd = [newRestaurant];
    }
    this.setMainList(restaurantToAdd).then(function () {
      console.log('Add restaurant ok ...')
      //tempMainList.push(newRestaurant);
      //console.log(tempMainList)
      //sessionStorage.setItem('restaurants', JSON.stringify(tempRestaurantsJsonList));
      $('#addRestaurantModal').modal('toggle');
      alert('Restaurant ajouté, veuillez ajouter une note sur l\'écran suivant'); // RESTAURANT ADDED, NOW ASK TO USER TO SET REVIEW
      $('#reviewModalButton').attr('data-restaurant', restaurantIndex);
      $('#reviewModal').modal('toggle');
      for (let i = 9; i >= 0; i--) { // REMOVE SELECT OPTIONS IN MODAL
        addRestaurantAddressSelect.remove(i);
      }
      restaurantNameInput.value = ''; // RESET RESTAURANT NAME VALUE
    });
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
      $('#addRestaurantModal').modal('toggle');
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
    console.log(tempList)
    var mainList = jsonList.main();
    var placeIdTempList = [];
    if (mainList != null) {
      for (let i = 0; i < mainList.length; i++) {
        placeIdTempList.push(mainList[i].placeId);
      }
      console.log('Liste des placesId déjà enregistrés : ' + placeIdTempList)
    }

    console.log(mainList);

    for (var i = 0; i < results.length; i++) {

      var restaurantPlaceID = results[i].place_id;
      let restaurantLng = results[i].geometry.location.lng();
      let restaurantLat = results[i].geometry.location.lat();
      let restaurantName = results[i].name;
      let restaurantAddress = results[i].vicinity;
      let restaurantRating = results[i].rating != null ? results[i].rating : "0";
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
      console.log('Pour le restaurant : ' + restaurantPlaceID)
      if (mainList != null) {
        if (placeIdTempList.includes(restaurantPlaceID) === false) {
          console.log('Le restaurant n\'est pas dans le session Storage, on peut le mettre dans la tempList')
          tempList.push(newRestaurant); // PUSH FETCHED RESTAURANTS IN JSON LIST
        } else {
          console.log('Il semblerait que le restaurant soit déjà enregistré')
        }
      } else {
        console.log('Premières entrées dans le session Storage...')
        tempList.push(newRestaurant); // PUSH FETCHED RESTAURANTS IN JSON LIST
      }
    }
    if (tempList.length > 0) {
      console.log('Il y a de nouveaux restaurants à enregistrer en session Storage...')
      console.log(tempList.length)
      //jsonList.setPlaces(tempList) // CALL SETPLACES TO SET JSON PLACES LIST
      jsonList.setMainList(tempList).then(jsonList.getRestaurants());
    } else {
      console.log('Le tempList est vide car tous les restaurants sont déjà enregistrés !')
      jsonList.getRestaurants();
    }
  } else {
    console.log('function placeCallback IS NOT OK');
    jsonList.getRestaurants();
  }
}
function detailsCallback(place, status) { // GET REVIEWS OF GIVEN PLACE ID CALLBACK
  console.log('functiondetailsCallback start ->')
  console.log('detailsCallback status = ' + status)
  if (status == google.maps.places.PlacesServiceStatus.OK) {
    var tempList = [];
    var tempMainList = jsonList.main(); // GET RESTAURANTS LIST INTO LOCAL STORAGE
    var reviewsContainer = document.getElementById('restaurant-reviews');
    reviewsContainer.innerHTML = "";

    let newRestaurantReviews = {

      "reviews": place.reviews
    }
    let placeId = place.place_id;
    let index;

    for (let i = 0; i < tempMainList.length; i++) {
      if (tempMainList[i].placeId === placeId) {
        index = i;
        let reviewsArray = tempMainList[i].reviews;
        if(reviewsArray.length != 0){
          reviewsArray.forEach(function (item) {
            reviewsContainer.innerHTML += '<li><span><strong>Note</strong> : ' + item.stars + '</span><br /><span><strong>Commentaire</strong> : ' + item.comment + '</span></li><br/><hr>'
          });
        }
      }
    }
    newRestaurantReviews.reviews.forEach(function (item) {
      reviewsContainer.innerHTML += '<li><span><strong>Note</strong> : ' + item.rating + '</span><br /><span><strong>Commentaire</strong> : ' + item.text + '</span></li><br/><hr>'
    });
  } else {
    console.log('function detailsCallback is not ok !');
  }
}
// ---------- ONLOAD INIT ----------
window.onload = function () {
  loadMap(); // LOAD THE MAP
}
// ---------- TRIGGERS ----------
addReviewForm.addEventListener('submit', function (event) {
  event.preventDefault();
  let comment = reviewTextArea.value;
  let restaurant = $('#reviewModalButton').attr('data-restaurant');
  console.log('L\'index du restaurant est bien : ' + restaurant)
  let rating = parseInt(document.getElementById('reviewRating').value);
  jsonList.setNewReview(restaurant, comment, rating);
});

addRestaurantForm.addEventListener('submit', function (event) {
  event.preventDefault();
  let restaurantName = restaurantNameInput.value;
  let restaurantAddress = addRestaurantAddressSelect.value;
  let restaurantLat = addRestaurantAddressSelect.options[addRestaurantAddressSelect.selectedIndex].dataset.lat; // RETRIEVE SELECTED OPTION DATA
  let restaurantLng = addRestaurantAddressSelect.options[addRestaurantAddressSelect.selectedIndex].dataset.lng; // RETRIEVE SELECTED OPTION DATA
  jsonList.setNewRestaurant(restaurantName, restaurantAddress, restaurantLat, restaurantLng); // SET NEW RESTAURANT IN THE SESSION STORAGE LIST
});

$('#reviewModal').on('show.bs.modal', function (event) {
  let button = $(event.relatedTarget) // Button that triggered the modal
  let restaurant = button.data('restaurant') // Extract info from data-* attributes
  console.log('On attribue l\'index du restaurant : ' + restaurant)
  $('#reviewModalButton').attr('data-restaurant', restaurant);
});

$('#reviewModal').on('hidden.bs.modal', function (event) {
  reviewTextArea.value = '';
  $('#reviewModalButton').removeAttr('data-restaurant');
})