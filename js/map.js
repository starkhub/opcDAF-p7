var api_key = config.secret_key;
var restaurantsList, map, infoWindow, marker, bounds, mapLat, mapLng;
var markerIcon = './css/images/user-marker-64.png';
var markers = [];
var restaurantsListDiv = document.getElementById('restaurants-list');

class JsonList {
  constructor(list) {
    this.list = list;
  }

  initRestaurantsList() {
    restaurantsList = document.createElement('script');
    restaurantsList.src = this.list;
    document.getElementsByTagName('head')[0].appendChild(restaurantsList);
  }

  setJsonListToLocalStorage() {
    localStorage.setItem('restaurants', JSON.stringify(restaurantsJsonList[0].mainList)); //Le Local Storage ne stock que des valeurs de type String, pas d'objets !
  }

  setNewRestaurants() {

    markers.forEach(item => item.setMap(null)); //On retire tous les markers de la carte

    var restaurantsJsonList = JSON.parse(localStorage.getItem('restaurants'));

    var ratingFilter = parseInt(document.getElementById('rating-filter').value);

    for (let i = 0; i < restaurantsJsonList.length; i++) {
      let restaurantName = restaurantsJsonList[i].restaurantName;
      let ratingsArray = restaurantsJsonList[i].ratings; //ON PARCOURT LA LISTE DES NOTES DANS LE TABLEAU DES AVIS
      let ratingsSum = 0;
      let ratingsComments = '<ul class="restaurant-reviews">';
      ratingsArray.forEach(
        star => ratingsSum += star.stars
      );
      ratingsArray.forEach(
        comment => ratingsComments += '<li><span>Note : ' + comment.stars +'</span><br /><span>Commentaire : ' + comment.comment + '</span></li><br/><hr>'
      )
      ratingsComments += '</ul>';
      
      console.log(ratingsComments);

      let ratingsAvg = ratingsSum / ratingsArray.length;

      let coords = new google.maps.LatLng(restaurantsJsonList[i].lat, restaurantsJsonList[i].long);

      var restaurantID = document.getElementById(restaurantName); //On récupère l'ID du restaurant dans la page HTML

      if (ratingsAvg >= 0 && ratingsAvg <= ratingFilter) {
        if (map.getBounds().contains(coords)) {
          let marker = new google.maps.Marker({ //ON PLACE LES MARQUEURS DES RESTAURANTS
            position: coords,
            map: map
          });
          let infowindow = new google.maps.InfoWindow({
            content: 
              '<h1>' + restaurantName + '</h1>' +
              '<p> Moyenne des notes : </p>' + ratingsAvg +
              '<h3>Avis clients</h3>' +
              '<ul>' +
              ratingsComments
               +
              '</ul>',
              disableAutoPan: true
          });
          marker.addListener('click', function () {
              infowindow.open(map, marker);
          });
          markers.push(marker);

          if (!restaurantID) {
            let restaurantsListContent = document.createElement('div');
            restaurantsListDiv.appendChild(restaurantsListContent).classList.add('restaurant-file');
            restaurantsListContent.id = restaurantName;
            restaurantsListContent.innerHTML = '<h2>' + restaurantName + '</h2>' +
              '<p>Moyenne des notes : ' + ratingsAvg;
          }
        } else {
          if (document.getElementById(restaurantName)) {
            document.getElementById(restaurantName).remove();
          }
        }
      }
    }
  }
}

function initMap() {

  //alert("Merci d'autoriser la géolocalisation lorsque votre navigateur vous le proposera !");

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

      map.setCenter(pos);

      map.addListener('idle', function () {
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

function checkMarkerInBounds(marker) {
  return map.getBounds().contains(marker.getPosition());
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(browserHasGeolocation ?
    'Erreur : nous ne pouvons pas vous localiser.' :
    'Erreur : votre navigateur ne supporte pas la géolocalisation.');
  infoWindow.open(map);
}

function loadjs() { //Chargement du fichier de config
  var loadMap = document.createElement("script");
  loadMap.type = "text/javascript";
  loadMap.src = "https://maps.googleapis.com/maps/api/js?key=" + api_key + "&maptype=roadmap&callback=initMap";
  document.body.appendChild(loadMap);
}

const jsonList = new JsonList('js/restaurantsList.js'); //Création de l'object Liste JSON
jsonList.initRestaurantsList(); //Initialisation de la liste JSON

window.onload = function () { //Quand la fenêtre (DOM) est prête
  jsonList.setJsonListToLocalStorage(); //On met dans le Local Storage le contenu du fichier JSON
  loadjs(); //On charge la carte
}
