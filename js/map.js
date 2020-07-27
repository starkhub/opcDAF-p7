// Note: This example requires that you consent to location sharing when
// prompted by your browser. If you see the error "The Geolocation service
// failed.", it means you probably did not give permission for the browser to
// locate you.
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
      ratingsArray.forEach(
        star => ratingsSum += star.stars
      );

      let ratingsAvg = ratingsSum / ratingsArray.length;

      let coords = new google.maps.LatLng(restaurantsJsonList[i].lat, restaurantsJsonList[i].long);

      if (ratingsAvg >= 0 && ratingsAvg <= ratingFilter) {
        if (map.getBounds().contains(coords)) {
          let marker = new google.maps.Marker({ //ON PLACE LES MARQUEURS DES RESTAURANTS
            position: coords,
            map: map
          });
          let infowindow = new google.maps.InfoWindow(); //ON GERE LES FENETRE POPUP AU CLIC SUR UN MARQUEUR
          marker.addListener('click', function () {
            infowindow.setContent(
              '<h1>' + restaurantName + '</h1>' +
              '<p> Moyenne des notes : </p>' + ratingsAvg
            );
            infowindow.open(map, marker);
          });
          markers.push(marker);
          console.log('Le marker est visible !');
        } else {
          if (document.getElementById(restaurantName)) {
            document.getElementById(restaurantName).remove();
          }
          console.log('le marker est invisible !');
        }
      }
    }
  }

  loadRestaurants() {
    //GESTION DE LA LISTE DES RESTAURANTS

    var restaurants = JSON.parse(localStorage.getItem('restaurants'));

    //map.fitBounds(map.getBounds(), 0);

    for (let i = 0; i < markers.length; i++) {
      markers[i].setVisible(false)
      console.log("On efface les markers de la carte")
    }

    var ratingFilter = parseInt(document.getElementById('rating-filter').value);

    markers = []; //On vide la tableau des markers

    for (let i = 0; i < restaurants.length; i++) { //ON PARCOURT LA LISTE DES AVIS

      let latLng = new google.maps.LatLng(restaurants[i].lat, restaurants[i].long); //ON RECUPERE LES COORDONNEES DU RESTO

      let marker = new google.maps.Marker({ //ON PLACE LES MARQUEURS DES RESTAURANTS
        position: latLng,
        map: map
      });
      marker.setVisible(false);
      markers.push(marker);

      let restaurantName = restaurants[i].restaurantName;
      let ratingsArray = restaurants[i].ratings; //ON PARCOURT LA LISTE DES NOTES DANS LE TABLEAU DES AVIS
      let ratingsSum = 0;
      ratingsArray.forEach(
        star => ratingsSum += star.stars
      );

      let ratingsAvg = ratingsSum / ratingsArray.length;

      let infowindow = new google.maps.InfoWindow(); //ON GERE LES FENETRE POPUP AU CLIC SUR UN MARQUEUR
      marker.addListener('click', function () {
        infowindow.setContent(
          '<h1>' + restaurantName + '</h1>' +
          '<p> Moyenne des notes : </p>' + ratingsAvg
        );
        infowindow.open(map, marker);
      });

      var restaurantID = document.getElementById(restaurantName); //On récupère l'ID du restaurant dans la page HTML

      if (ratingsAvg >= 0 && ratingsAvg <= ratingFilter) {
        if (checkMarkerInBounds(marker)) {
          marker.setVisible(true);
          console.log('Le marker est visible !')
        }

        if (checkMarkerInBounds(marker) && !restaurantID) {
          let restaurantsListContent = document.createElement('div');
          restaurantsListDiv.appendChild(restaurantsListContent).classList.add('restaurant-file');
          restaurantsListContent.id = restaurantName;
          restaurantsListContent.innerHTML = '<h2>' + restaurantName + '</h2>' +
            '<p>Moyenne des notes : ' + ratingsAvg;
        } else if (!checkMarkerInBounds(marker) && restaurantID) {
          document.getElementById(restaurantName).remove();
        }
      } else if (document.getElementById(restaurantName)) {
        document.getElementById(restaurantName).remove();
      } else {
        console.log("Le restaurant n'a pas une assez bonne note...")
      }
    }

    map.addListener('dragend', function () {
      var idleListerner = map.addListener('center_changed', function () {
        google.maps.event.removeListener(idleListerner);
        window.setTimeout(function () {
          jsonList.loadRestaurants();
        }, 500);
      });
    });
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

function test() {
  var restaurants = JSON.parse(localStorage.getItem('restaurants'));
  console.log(restaurants)
  console.log(restaurants[0])
  for (let i = 0; i < restaurants.length; i++) {

    console.log(restaurants[i].ratings)
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
