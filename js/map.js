var api_key = config.secret_key; // GOOGLE API KEY !KEEP SECRET!
var restaurantsList, map, infoWindow, marker, bounds, mapLat, mapLng;
var markerIcon = './css/images/user-marker-64.png';
var markers = []; // MARKERS ARRAY
var restaurantsListDiv = document.getElementById('restaurants-list');
var clickTime = Date.now() - 1001; //TIMER
//---------- CLASSES ----------
class Restaurant {
  constructor(name, address, reviews, lat, lng, streetViewImage, index) {
    this.name = name;
    this.address = address;
    this.reviews = reviews;
    this.lat = lat;
    this.lng = lng;
    this.streetViewImage = streetViewImage;
    this.index = index;
  }
  setOnMap() {
    let ratingsSum = 0;
    let commentsContainer = '<ul class="restaurant-reviews">';
    let restaurantAvgRating;
    let coords = new google.maps.LatLng(this.lat, this.lng); //ON RECUPERE LES COORDONNEES DU RESTO
    let restaurantID = document.getElementById(this.name); //On récupère l'ID du restaurant dans la page HTML
    let ratingFilter = parseInt(document.getElementById('rating-filter').value);
    this.reviews.forEach(
      star => ratingsSum += star.stars
    );
    this.reviews.forEach(
      comment => commentsContainer += '<li><span><strong>Note</strong> : ' + comment.stars + '</span><br/><span><strong>Commentaires</strong> : ' + comment.comment + '</span></li><br/><hr/>'
    )
    commentsContainer += '</ul>';
    var ratingsAvg = calculateAverage(ratingsSum, this.reviews.length);
    if (ratingsAvg >= 0 && ratingsAvg <= ratingFilter) { // FILTER RESTAURANTS BY NOTES
      if (map.getBounds().contains(coords)) {
        let marker = new google.maps.Marker({
          position: coords,
          map: map
        });
        let infowindow = new google.maps.InfoWindow({
          content:
            '<div class="infoWindow"><h1 class="my-15">' + this.name + '</h1>' +
            '<p class="infoWindowAddress">' + this.address + '</p>' +
            '<p class="infoWindowRating" id="infoWindowRating"> Moyenne des notes : ' + ratingsAvg + '</p>' +
            '<h3>Avis clients</h3>' +
            '<ul>' +
            commentsContainer
            +
            '</ul></div>' +
            '<div class="streeViewImage"><img src="https://maps.googleapis.com/maps/api/streetview?size=600x400&location=' + this.streetViewImage + '&key=' + api_key + '"></div>'
        });
        marker.addListener('click', function () { // MARKER CLICK EVENT LISTENER
          infowindow.open(map, marker);
          clickTime = Date.now();
        });
        markers.push(marker); // PUT MARKER INSIDE MARKER'S ARRAY
        if (!restaurantID) { // CREATE RESTAURANT CARD IF NOT EXIST
          console.log('Create Restaurant Card If Not Exist');
          let restaurantsListContent = document.createElement('div');
          restaurantsListDiv.appendChild(restaurantsListContent).classList.add('restaurant-file', 'my-15');
          restaurantsListContent.id = this.name;
          restaurantsListContent.innerHTML = '<h2>' + this.name + '</h2>' +
            '<p id="restaurantAvgRating' + this.index + '"></p>'
          restaurantAvgRating = document.getElementById('restaurantAvgRating' + this.index);
          restaurantAvgRating.innerHTML = '<p><strong>Moyenne des notes</strong> : ' + ratingsAvg + '</p>';
        } else { // IF RESTAURANT CARD EXIST, UPDATE THE RATING
          console.log('The card already exist, update the rating')
          restaurantAvgRating = document.getElementById('restaurantAvgRating' + this.index);
          restaurantAvgRating.innerHTML = '<p><strong>Moyenne des notes</strong> : ' + ratingsAvg + '</p>';
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
  initialize() {
    restaurantsList = document.createElement('script');
    restaurantsList.src = this.list;
    document.getElementsByTagName('head')[0].appendChild(restaurantsList);
  }
  setToLocalStorage() {
    localStorage.setItem('restaurants', JSON.stringify(restaurantsJsonList[0].mainList)); //Le Local Storage ne stock que des valeurs de type String, pas d'objets !
  }
  setNewRestaurants() {
    markers.forEach(item => item.setMap(null)); // REMOVE ALL MARKERS ON THE MAP
    var restaurantsJsonList = JSON.parse(localStorage.getItem('restaurants'));
    for (let i = 0; i < restaurantsJsonList.length; i++) {
      let restaurantName = restaurantsJsonList[i].restaurantName;
      let restaurantAddress = restaurantsJsonList[i].address;
      let restaurantReviews = restaurantsJsonList[i].ratings;
      let restaurantLat = restaurantsJsonList[i].lat;
      let restaurantLng = restaurantsJsonList[i].long;
      let restaurantStreetViewImage = restaurantsJsonList[i].streetViewImage;
      let restaurant = window['restaurant' + i];
      restaurant = new Restaurant(restaurantName, restaurantAddress, restaurantReviews, restaurantLat, restaurantLng, restaurantStreetViewImage, i);
      restaurant.setOnMap();
    }
  }
}
// ---------- FUNCTIONS ----------
function initMap() {
  alert("Merci d'autoriser la géolocalisation lorsque votre navigateur vous le proposera afin de profiter de toutes les fonctionnalités de l'application. Aucune donnée personnelle n'est conservée par nos services.");
  map = new google.maps.Map(document.getElementById('map'), { //Initialisation object Map avec pour paramètre l'ID de la carte côté html
    center: { lat: -34.397, lng: 150.644 },
    zoom: 17
  });

  infoWindow = new google.maps.InfoWindow;

  // Try HTML5 geolocation
  if (navigator.geolocation) {

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

      infoWindow.setPosition(pos);//Popup info que l'user peut fermer
      infoWindow.setContent('Vous êtes ici !');
      infoWindow.open(map);
      map.setCenter(pos); // CENTER
      map.addListener('idle', function () {
        if (Date.now() > (clickTime + 1000))
          jsonList.setNewRestaurants();
      });

    }, function () {
      handleLocationError(true, infoWindow, map.getCenter());
    });
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, map.getCenter());
  }
}
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
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
function calculateAverage(dividend, divider) {
  let result = parseFloat(dividend / divider).toFixed(2);
  return result;
}
// ---------- NEW INSTANCE OF JSONLIST ----------
const jsonList = new JsonList('js/restaurantsList.js'); //Création de l'object Liste JSON
jsonList.initialize(); //Initialisation de la liste JSON
// ---------- LOAD JSON LIST TO LOCAL STORAGE AND LOAD THE MAP
window.onload = function () { //Quand la fenêtre (DOM) est prête
  jsonList.setToLocalStorage(); //On met dans le Local Storage le contenu du fichier JSON
  loadjs(); //On charge la carte

}
