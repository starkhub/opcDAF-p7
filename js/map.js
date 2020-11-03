// ---------- VAR ----------
var api_key = config.secret_key; //initialisation clé API à partir d'un fichier config séparé
var restaurantsList, map, infoWindow, marker, bounds, mapLat, mapLng; //init. variables
var markerIcon = './css/images/user-marker-64.png'; //init. image marker utilisateur
var markers = []; //init. tableau des markers
var restaurantsListDiv = document.getElementById('restaurants-list'); // init. de la liste des restaurants
var clickTime = Date.now() - 1001; //timer infoWindow
// ---------- RESTAURANT MODALS VARS ----------
var reviewModal = document.getElementById('reviewModal');
var reviewTextArea = document.getElementById('reviewCommentArea');
var closeReviewModalButton = document.getElementById('closeReviewModalButton');
// ---------- REVIEW MODALS VARS ----------
//var reviewModalButton = document.getElementById('reviewModalButton');
//var addRestaurantModalButton = document.getElementById('addRestaurantModalButton');
var restaurantNameInput = document.getElementById('addRestaurantName');
var addRestaurantAddressSelect = document.getElementById('addRestaurantAddressSelect');
// ---------- OBJECTS ----------
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
          map: map
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
          console.log('Create Restaurant Card If Not Exist');
          let restaurantsListContent = document.createElement('div');
          restaurantsListDiv.appendChild(restaurantsListContent).classList.add('restaurant-file', 'my-2', 'card', 'p-2');
          restaurantsListContent.id = this.name;
          restaurantsListContent.innerHTML = '<h2>' + this.name + '</h2>' +
            '<p id="restaurantAvgRating' + this.index + '"></p>' +
            '<button name="addReviewButton" class="btn" id="addReviewButton' + this.index + '" data-restaurant="' + this.index + '" data-toggle="modal" data-target="#reviewModal">Ajouter un avis</button></div>';
          restaurantAvgRating = document.getElementById('restaurantAvgRating' + this.index);
          restaurantAvgRating.innerHTML = '<p><span class="font-weight-bold">Moyenne des notes : </span>' + ratingsAvg + '</p>';
        } else { // IF RESTAURANT CARD EXIST, UPDATE THE RATING
          console.log('The card already exist, update the rating')
          restaurantAvgRating = document.getElementById('restaurantAvgRating' + this.index);
          restaurantAvgRating.innerHTML = '<p><span class="font-weight-bold">Moyenne des notes : </span>' + ratingsAvg + '</p>';
        }
      } else if (document.getElementById(this.name)) { // IF RESTAURANT'S OUT OF BOUNDS AND WAS VIBIBLE BEFORE, REMOVE IT
        console.log('restaurant is out of bounds but was visible before ! Remove it !');
        document.getElementById(this.name).remove();
      }
    } else if (document.getElementById(this.name)) { // IF RESTAURANT HAVE LOW RATING AND WAS VISIBLE BEFORE, REMOVE IT
      document.getElementById(this.name).remove();
      console.log('Restaurant have low rating and was visible before, Remove it !');
    }
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
  setNewRestaurants() { // PUT LIST'S RESTAURANTS ON THE MAP
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
    reviewTextArea.value = '';
    restaurantRatingsArray.push({ 'stars': rating, 'comment': comment });
    sessionStorage.setItem('restaurants', JSON.stringify(tempRestaurantsJsonList));
    jsonList.setNewRestaurants();
    alert('Merci pour votre commentaire !');

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

// ---------- FUNCTIONS ----------
function initMap() { // GOOGLE MAP INIT

  //alert("Merci d'autoriser la géolocalisation lorsque votre navigateur vous le proposera pour profiter au mieux des fonctionnalités de l'application !");
  map = new google.maps.Map(document.getElementById('map'), { // NEW MAP INSTANCE
    center: { lat: -34.397, lng: 150.644 },
    zoom: 17
  });

  infoWindow = new google.maps.InfoWindow; // NEW INFOWINDOW INSTANCE

  if (navigator.geolocation) { // CHECKING IF BROWSER SUPPORT GEOLOCATION
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
      infoWindow.setContent('<h5 class="py-3">Vous êtes ici !</h5>');
      infoWindow.open(map); // OPEN THE MAP
      map.setCenter(pos); // CENTER
      map.addListener('idle', function () {
        if (Date.now() > (clickTime + 1000))
          jsonList.setNewRestaurants();
      });
      map.addListener('click', function (mapsMouseEvent) { // ADD RESTAURANT WITH A CLICK ON THE MAP 
        let prompt = confirm('Voulez-vous ajouter un nouveau restaurant ?');
        if (prompt) {
          if (window.XMLHttpRequest) { // COMPATIBILITY CODE
            httpRequest = new XMLHttpRequest();
          }
          else if (window.ActiveXObject) { // IE 6 & EARLIER
            httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
          }
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
  map.type = "text/javascript";
  map.src = "https://maps.googleapis.com/maps/api/js?key=" + api_key + "&maptype=roadmap&callback=initMap";
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
      toggleModal('addRestaurantModal');
    } else {
      alert('Il y a eu un problème avec la requête.');
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
  let restaurant = $('#reviewModalButton').data('restaurant');
  let rating = parseInt(document.getElementById('reviewRating').value);
  jsonList.setNewReview(restaurant, comment, rating);
});
/*
addRestaurantForm.addEventListener('submit', function(event){
  event.preventDefault();
});*/

$('#reviewModal').on('show.bs.modal', function (event) {
  let button = $(event.relatedTarget) // Button that triggered the modal
  let restaurant = button.data('restaurant') // Extract info from data-* attributes
  console.log(restaurant);
  let modal = $(this);
  modal.find('#reviewModalButton').attr('data-restaurant', restaurant);
})

/*
reviewModalButton.addEventListener('click', function (event) { // ADD REVIEW BUTTON TRIGGER
  event.preventDefault();
  let resto = this.dataset.target;
  jsonList.setNewReview(resto);
});


addRestaurantModalButton.addEventListener('click', function(event){ // ADD RESTAURANT BUTTON TRIGGER
  event.preventDefault();
  let restaurantName = restaurantNameInput.value; // GET THE NEW RESTAURANT NAME
  if(restaurantName === ''){
    alert('Vous devez saisir le nom du restaurant !');
  }else{
    let restaurantAddress = addRestaurantAddressSelect.value; // SELECTED ADDRESS IN THE SELECT ADDRESS LIST
    let restaurantLat = addRestaurantAddressSelect.options[addRestaurantAddressSelect.selectedIndex].dataset.lat; // RETRIEVE SELECTED OPTION DATA
    let restaurantLng = addRestaurantAddressSelect.options[addRestaurantAddressSelect.selectedIndex].dataset.lng; // RETRIEVE SELECTED OPTION DATA
    jsonList.setNewRestaurant(restaurantName, restaurantAddress, restaurantLat, restaurantLng); // SET NEW RESTAURANT IN THE SESSION STORAGE LIST
  }
});
*/
