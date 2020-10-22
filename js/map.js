var api_key = config.secret_key; //initialisation clé API à partir d'un fichier config séparé
var restaurantsList, map, infoWindow, marker, bounds, mapLat, mapLng; //init. variables
var markerIcon = './css/images/user-marker-64.png'; //init. image marker utilisateur
var markers = []; //init. tableau des markers
var restaurantsListDiv = document.getElementById('restaurants-list'); // init. de la liste des restaurants
var clickTime = Date.now() - 1001; //timer infoWindow

class Restaurant {
  constructor(name, address, ratingsArray, lat, lng, streetViewImage,index){
    this.name = name,
    this.address = address,
    this.ratingsArray = ratingsArray,
    this.lat = lat,
    this.lng = lng,
    this.streetViewImage = streetViewImage,
    this.index = index
  }

  setOnMap(){
    let coords = new google.maps.LatLng(this.lat, this.lng); //On définit une nouvelle instance des coordonnées de la map
    let ratingsSum = 0; // Moyenne des notes à 0
    let ratingsComments = '<ul class="restaurant-reviews">'; //Début de la liste html des avis
    this.ratingsArray.forEach( //On additionne les notes
      star => ratingsSum += star.stars
    );
    this.ratingsArray.forEach( //On parcourt les avis et on fait une liste html
      comment => ratingsComments += '<li><span><strong>Note</strong> : ' + comment.stars + '</span><br /><span><strong>Commentaire</strong> : ' + comment.comment + '</span></li><br/><hr>'
    )
    this.ratingsComments += '</ul>'; //On ferme la liste des avis.
    var ratingsAvg = calculateAverage(ratingsSum, this.ratingsArray.length);
    var ratingFilter = parseInt(document.getElementById('rating-filter').value);
    var restaurantID = document.getElementById(this.name); //On récupère l'ID du restaurant dans la page HTML

    if (ratingsAvg >= 0 && ratingsAvg <= ratingFilter) { //Filtrage par les moyennes des avis
      if (map.getBounds().contains(coords)) { //Si les coordonnées sont dans la map actuelle
        let marker = new google.maps.Marker({ //On créé une instance d'un marker dédiée au restaurant i
          position: coords,
          map: map
        });
        let infowindow = new google.maps.InfoWindow({ //On créé une instance d'un infoWindow dédiée au restaurant i
          content:
            '<div class="infoWindow"><h1 class="my-15">' + this.name + '</h1>' +
            '<p class="infoWindowAddress">' + this.address + '</p>' +
            '<p class="infoWindowRating"> Moyenne des notes : ' + ratingsAvg + '</p>' +
            '<h3>Avis clients</h3>' +
            '<ul>' +
            ratingsComments
            +
            '</ul></div>' +
            '<div class="streeViewImage"><img src="https://maps.googleapis.com/maps/api/streetview?size=600x400&location=' + this.streetViewImage + '&key=' + api_key + '"></div>'
        });
        marker.addListener('click', function () { //On écoute l'évènement d'un click sur un marker
          infowindow.open(map, marker);
          clickTime = Date.now(); //Définit clickTime avec le timeStamp actuel
        });
        markers.push(marker); //On insert le marker dans le tableau dédié

        if (!restaurantID) { //Si l'ID tu restaurant n'existe pas dans le dom, on créé l'item contenant les infos du restaurant
          let restaurantsListContent = document.createElement('div');
          restaurantsListDiv.appendChild(restaurantsListContent).classList.add('restaurant-file','my-15');
          restaurantsListContent.id = this.name;
          restaurantsListContent.innerHTML = '<h2>' + this.name + '</h2>' +
            '<p><strong>Moyenne des notes</strong> : ' + ratingsAvg + '</p>';
        }
      } else if (document.getElementById(this.name)) { //Si le restaurant n'est pas dans la carte et qu'il était affiché auparavant, on supprime ses infos du dom
        document.getElementById(this.name).remove();
      }
    } else if (document.getElementById(this.name)) { //Si le restaurant n'a pas une note suffisante et qu'il était affiché auparavant, on supprime ses infos du dom
      document.getElementById(this.name).remove();
    }
  }

}

class JsonList { //Class de la liste JSON
  constructor(list) {
    this.list = list;
  }

  initialize() { //On insert la liste des restaurants dans le dom avec une balise script
    restaurantsList = document.createElement('script');//
    restaurantsList.src = this.list;
    document.getElementsByTagName('head')[0].appendChild(restaurantsList);
  }

  setJsonListToLocalStorage() { //On place la liste des restaurants dans le local storage pour faciliter l'accès futur
    localStorage.setItem('restaurants', JSON.stringify(restaurantsJsonList[0].mainList)); //Le Local Storage ne stock que des valeurs de type String, pas d'objets !
  }

  setNewRestaurants() { //On définit et on place tous les restaurants de la liste sur la carte
    markers.forEach(item => item.setMap(null)); //On retire tous les markers de la carte
    var restaurantsJsonList = JSON.parse(localStorage.getItem('restaurants'));


    for (let i = 0; i < restaurantsJsonList.length; i++) {
      let restaurantName = restaurantsJsonList[i].restaurantName; //On récupère le nom du restaurant
      let restaurantAddress = restaurantsJsonList[i].address;  //On récupère l'adresse du restaurant
      let ratingsArray = restaurantsJsonList[i].ratings; //On récupère le tableau notes
      let itemLat = restaurantsJsonList[i].lat; //On récupère la Lattitude
      let itemLong = restaurantsJsonList[i].long; //On récupère la Longitude
      let streetViewImage = restaurantsJsonList[i].streetViewImage; //On récupère l'image StreetView

      let restaurant = window["restaurant" + i];
      restaurant = new Restaurant(restaurantName, restaurantAddress, ratingsArray, itemLat, itemLong, streetViewImage, i);
      restaurant.setOnMap();

    }
  }
}

function initMap() { //Initialisation de la carte Google Map via l'API

  //alert("Merci d'autoriser la géolocalisation lorsque votre navigateur vous le proposera !");

  map = new google.maps.Map(document.getElementById('map'), { //Instanciation de la carte avec pour paramètre l'ID de la carte côté html
    center: { lat: -34.397, lng: 150.644 },
    zoom: 17
  });

  infoWindow = new google.maps.InfoWindow; //Instanciation d'un infoWindow

  if (navigator.geolocation) { //Check si le navigateur possède la fonction de géolocalisation

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

      infoWindow.setPosition(pos); //Popup info que l'utilisateur peut fermer
      infoWindow.setContent('<h3 class="pady-25">Vous êtes ici !</h3>');
      infoWindow.open(map);
      map.setCenter(pos);
      map.addListener('idle', function () {
        if(Date.now() > (clickTime + 1000))
        jsonList.setNewRestaurants();
      });

    }, function () {
      handleLocationError(true, infoWindow, map.getCenter());
    });
  } else { //Si le navigateur ne supporte pas la géolocalisation
    handleLocationError(false, infoWindow, map.getCenter());
  }
}

function checkMarkerInBounds(marker) { //Vérification de la position du marker
  return map.getBounds().contains(marker.getPosition());
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) { //Gestion des erreurs
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

function calculateAverage(dividend, divider){
  let result = parseFloat(dividend / divider).toFixed(2);
  return result;
}

const jsonList = new JsonList('js/restaurantsList.js'); //Création de l'object Liste JSON
jsonList.initialize(); //Initialisation de la liste JSON

window.onload = function () { //Quand la fenêtre (DOM) est prête
  jsonList.setJsonListToLocalStorage(); //On met dans le Local Storage le contenu du fichier JSON
  loadjs(); //On charge la carte
}
