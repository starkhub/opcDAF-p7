var api_key = config.secret_key; //initialisation clé API à partir d'un fichier config séparé
var restaurantsList, map, infoWindow, marker, bounds, mapLat, mapLng; //init. variables
var markerIcon = './css/images/user-marker-64.png'; //init. image marker utilisateur
var markers = []; //init. tableau des markers
var restaurantsListDiv = document.getElementById('restaurants-list'); // init. de la liste des restaurants
var clickTime = Date.now() - 1001; //timer infoWindow
// MODALS VARS
var reviewModal = document.getElementById('reviewModal');
var reviewRatingSelect = document.getElementById('reviewRating');
var reviewTextArea = document.getElementById('reviewCommentArea');
var closeReviewModalButton = document.getElementById('closeReviewModalButton');
var reviewModalButton = document.getElementById('reviewModalButton');
var addRestaurantModalButton = document.getElementById('addRestaurantModalButton');
var restaurantNameInput = document.getElementById('addRestaurantName');
var addRestaurantAddressSelect = document.getElementById('addRestaurantAddressSelect');

class JsonList { // JSON LIST CLASS
  constructor(list) {
    this.list = list;
  }

  initRestaurantsList() { // SET RESTAURANTS'S JSON LIST INTO THE DOM
    restaurantsList = document.createElement('script');//
    restaurantsList.src = this.list;
    document.getElementsByTagName('head')[0].appendChild(restaurantsList);
  }

  setJsonListToLocalStorage() { // PUT THE RESTAURANTS'S LIST INTO LOCAL STORAGE FOR FUTUR ACCESS
    sessionStorage.setItem('restaurants', JSON.stringify(restaurantsJsonList[0].mainList)); // LOCAL STORAGE GET ONLY STRING DATA, NO OBJECTS
  }

  setNewRestaurants() { // PUT LIST'S RESTAURANTS ON THE MAP
    markers.forEach(item => item.setMap(null)); // REMOVE ALL MARKERS ON THE MAP
    var restaurantsJsonList = JSON.parse(sessionStorage.getItem('restaurants'));
    var ratingFilter = parseInt(document.getElementById('rating-filter').value);

    for (let i = 0; i < restaurantsJsonList.length; i++) {
      let restaurantName = restaurantsJsonList[i].restaurantName;
      let restaurantAddress = restaurantsJsonList[i].address;
      let ratingsArray = restaurantsJsonList[i].ratings;
      let ratingsSum = 0;
      let ratingsComments = '<ul class="restaurant-reviews">';

      ratingsArray.forEach(
        star => ratingsSum += star.stars
      );
      ratingsArray.forEach(
        comment => ratingsComments += '<li><span><strong>Note</strong> : ' + comment.stars + '</span><br /><span><strong>Commentaire</strong> : ' + comment.comment + '</span></li><br/><hr>'
      )
      ratingsComments += '</ul>';

      let ratingsAvg = parseFloat(ratingsSum / ratingsArray.length).toFixed(2); // DEFINE AVERAGE RATING
      let itemLat = restaurantsJsonList[i].lat;
      let itemLong = restaurantsJsonList[i].long;
      let streetViewImage = restaurantsJsonList[i].streetViewImage;
      let coords = new google.maps.LatLng(itemLat, itemLong);
      var restaurantID = document.getElementById(restaurantName);

      if (ratingsAvg >= 0 && ratingsAvg <= ratingFilter){
        if (map.getBounds().contains(coords)) {
          let marker = new google.maps.Marker({
            position: coords,
            map: map
          });
          let infowindow = new google.maps.InfoWindow({
            content:

              '<div class="infoWindow"><h1 class="my-15">' + restaurantName + '</h1>' +
              '<p class="infoWindowAddress">' + restaurantAddress + '</p>' +
              '<p class="infoWindowRating"> Moyenne des notes : ' + ratingsAvg + '</p>' +
              '<h3>Avis clients</h3>' +
              '<ul>' +
              ratingsComments
              +
              '</ul></div>' +
              '<div class="streeViewImage"><img src="https://maps.googleapis.com/maps/api/streetview?size=600x400&location=' + streetViewImage + '&key=' + api_key + '"></div>'
          });

          marker.addListener('click', function () { // MARKER CLICK EVENT LISTENER
            infowindow.open(map, marker);
            clickTime = Date.now();
          });
          markers.push(marker); // PUT MARKER INSIDE MARKER'S ARRAY

          if (!restaurantID) { // CREATE RESTAURANT CARD IF NOT EXIST
            let restaurantsListContent = document.createElement('div');
            restaurantsListDiv.appendChild(restaurantsListContent).classList.add('restaurant-file', 'my-15');
            restaurantsListContent.id = restaurantName;
            restaurantsListContent.innerHTML = '<h2>' + restaurantName + '</h2>' +
              '<p><strong>Moyenne des notes</strong> : ' + ratingsAvg + '</p>' +
              '<button name="addReviewButton" class="bg-secondary" id="addReviewButton' + i + '" data-target="reviewModal" onclick="toggleModal(this.dataset.target, ' + i + ')">Ajouter un avis</button></div>';
          }
        } else if (document.getElementById(restaurantName)) { // IF RESTAURANT'S OUT OF BOUNDS AND WAS VIBIBLE BEFORE, REMOVE IT
          document.getElementById(restaurantName).remove();
        }
      } else if (document.getElementById(restaurantName)) { // IF RESTAURANT HAVE LOW RATING AND WAS VISIBLE BEFORE, REMOVE IT
        document.getElementById(restaurantName).remove();
      }
    }
  }

  setNewReview(resto) { // ADD NEW REVIEW INTO LOCAL STORAGE RESTAURANTS LIST
    let tempRestaurantsJsonList = JSON.parse(sessionStorage.getItem('restaurants'));
    let restaurantRatingsArray = tempRestaurantsJsonList[resto].ratings;
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
      "restaurantName" : restaurantName,
      "address" : restaurantAdress,
      "lat" : parseFloat(restaurantLat),
      "long" : parseFloat(restaurantLng),
      "streetViewImage" : "" + parseFloat(restaurantLat)  + "," + parseFloat(restaurantLng) + "" ,
      "ratings" : []
    }
    tempRestaurantsJsonList.push(newRestaurant);
    sessionStorage.setItem('restaurants', JSON.stringify(tempRestaurantsJsonList));
    toggleModal('addRestaurantModal');
    toggleModal('reviewModal', restaurantIndex);
    for( let i = 9; i>= 0; i--){
      addRestaurantAddressSelect.remove(i);
    }
    restaurantNameInput.value = '';
  }
}

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
      infoWindow.setContent('<h3 class="pady-25">Vous êtes ici !</h3>');
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

function loadjs() { // LOAD CONFIG FILE
  var loadMap = document.createElement("script");
  loadMap.type = "text/javascript";
  loadMap.src = "https://maps.googleapis.com/maps/api/js?key=" + api_key + "&maptype=roadmap&callback=initMap";
  document.body.appendChild(loadMap);
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

const jsonList = new JsonList('js/restaurantsList.js'); // CREATE JSON LIST INSTANCE
jsonList.initRestaurantsList(); // INITIALIZE JSON LIST

window.onload = function () {
  jsonList.setJsonListToLocalStorage(); // SET JSON LIST INTO LOCAL STORAGE
  loadjs(); // LOAD THE MAP
}

reviewModalButton.addEventListener('click', function (event) { // ADD REVIEW BUTTON TRIGGER
  event.preventDefault();
  let resto = this.dataset.target;
  jsonList.setNewReview(resto);
});

addRestaurantModalButton.addEventListener('click', function(event){ // ADD RESTAURANT BUTTON TRIGGER
  event.preventDefault();
  let restaurantName = restaurantNameInput.value;
  let restaurantAddress = addRestaurantAddressSelect.value;
  let restaurantLat = addRestaurantAddressSelect.options[addRestaurantAddressSelect.selectedIndex].dataset.lat; // RETRIEVE SELECTED OPTION DATA
  let restaurantLng = addRestaurantAddressSelect.options[addRestaurantAddressSelect.selectedIndex].dataset.lng; // RETRIEVE SELECTED OPTION DATA
  jsonList.setNewRestaurant(restaurantName, restaurantAddress, restaurantLat, restaurantLng)
});