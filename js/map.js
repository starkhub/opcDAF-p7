var api_key = config.secret_key; //initialisation clé API à partir d'un fichier config séparé
var restaurantsList, map, infoWindow, marker, bounds, mapLat, mapLng; //init. variables
var markerIcon = './css/images/user-marker-64.png'; //init. image marker utilisateur
var markers = []; //init. tableau des markers
var restaurantsListDiv = document.getElementById('restaurants-list'); // init. de la liste des restaurants
var clickTime = Date.now() - 1001; //timer infoWindow
var reviewModal = document.getElementById('reviewModal');
var reviewModalButton = document.getElementById('reviewModalButton');
var reviewTextArea = document.getElementById('reviewCommentArea');

var closeReviewModalButton = document.getElementById('closeReviewModalButton');

var setReviewButton = document.getElementById('submitReviewButton');
var reviewCommentArea = document.getElementById('reviewCommentArea');
var reviewRatingSelect = document.getElementById('reviewRating');

class JsonList { //Class de la liste JSON
  constructor(list) {
    this.list = list;
  }

  initRestaurantsList() { //On insert la liste des restaurants dans le dom avec une balise script
    restaurantsList = document.createElement('script');//
    restaurantsList.src = this.list;
    document.getElementsByTagName('head')[0].appendChild(restaurantsList);
  }

  setJsonListToLocalStorage() { //On place la liste des restaurants dans le session storage pour faciliter l'accès futur
    sessionStorage.setItem('restaurants', JSON.stringify(restaurantsJsonList[0].mainList)); //Le Storage ne stock que des valeurs de type String, pas d'objets !
  }

  setNewRestaurants() { //On définit et on place tous les restaurants de la liste sur la carte
    markers.forEach(item => item.setMap(null)); //On retire tous les markers de la carte
    var restaurantsJsonList = JSON.parse(sessionStorage.getItem('restaurants'));
    var ratingFilter = parseInt(document.getElementById('rating-filter').value);

    for (let i = 0; i < restaurantsJsonList.length; i++) {
      let restaurantName = restaurantsJsonList[i].restaurantName; //On récupère le nom du restaurant
      let restaurantAddress = restaurantsJsonList[i].address;  //On récupère l'adresse du restaurant
      let ratingsArray = restaurantsJsonList[i].ratings; //On récupère le tableau notes
      let ratingsSum = 0; // Moyenne des notes à 0
      let ratingsComments = '<ul class="restaurant-reviews">'; //Début de la liste html des avis

      ratingsArray.forEach( //On additionne les notes
        star => ratingsSum += star.stars
      );
      ratingsArray.forEach( //On parcourt les avis et on fait une liste html
        comment => ratingsComments += '<li><span><strong>Note</strong> : ' + comment.stars + '</span><br /><span><strong>Commentaire</strong> : ' + comment.comment + '</span></li><br/><hr>'
      )
      ratingsComments += '</ul>'; //On ferme la liste des avis.

      let ratingsAvg = parseFloat(ratingsSum / ratingsArray.length).toFixed(2); //On calcule la moyenne des notes
      let itemLat = restaurantsJsonList[i].lat; //On récupère la Lattitude
      let itemLong = restaurantsJsonList[i].long; //On récupère la Longitude
      let streetViewImage = restaurantsJsonList[i].streetViewImage; //On récupère l'image StreetView
      let coords = new google.maps.LatLng(itemLat, itemLong); //On définit une nouvelle instance des coordonnées de la map
      var restaurantID = document.getElementById(restaurantName); //On récupère l'ID du restaurant dans la page HTML

      if (ratingsAvg >= 0 && ratingsAvg <= ratingFilter) { //Filtrage par les moyennes des avis
        if (map.getBounds().contains(coords)) { //Si les coordonnées sont dans la map actuelle
          let marker = new google.maps.Marker({ //On créé une instance d'un marker dédiée au restaurant i
            position: coords,
            map: map
          });
          let infowindow = new google.maps.InfoWindow({ //On créé une instance d'un infoWindow dédiée au restaurant i
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
          marker.addListener('click', function () { //On écoute l'évènement d'un click sur un marker
            infowindow.open(map, marker);
            clickTime = Date.now(); //Définit clickTime avec le timeStamp actuel
          });
          markers.push(marker); //On insert le marker dans le tableau dédié

          if (!restaurantID) { //Si l'ID tu restaurant n'existe pas dans le dom, on créé l'item contenant les infos du restaurant
            let restaurantsListContent = document.createElement('div');
            restaurantsListDiv.appendChild(restaurantsListContent).classList.add('restaurant-file', 'my-15');
            restaurantsListContent.id = restaurantName;
            restaurantsListContent.innerHTML = '<h2>' + restaurantName + '</h2>' +
              '<p><strong>Moyenne des notes</strong> : ' + ratingsAvg + '</p>' +
              '<button name="addReviewButton" id="addReviewButton' + i + '" data-target="reviewModal" onclick="toggleModal(this.dataset.target, ' + i + ')">Ajouter un avis</button></div>';
          }
        } else if (document.getElementById(restaurantName)) { //Si le restaurant n'est pas dans la carte et qu'il était affiché auparavant, on supprime ses infos du dom
          document.getElementById(restaurantName).remove();
        }
      } else if (document.getElementById(restaurantName)) { //Si le restaurant n'a pas une note suffisante et qu'il était affiché auparavant, on supprime ses infos du dom
        document.getElementById(restaurantName).remove();
      }
    }
  }
  writeNewReview(resto) {
    document.getElementById('commentBlock' + resto).style.display = "block";
  }

  setNewReview(resto) {
    let tempRestaurantsJsonList = JSON.parse(sessionStorage.getItem('restaurants'));
    let restaurantRatingsArray = tempRestaurantsJsonList[resto].ratings;
    let userComment = reviewTextArea.value;
    let userRating = parseInt(document.getElementById('reviewRating').value);
    if (userComment != '') {
      toggleModal('reviewModal');
      reviewTextArea.value = '';
      restaurantRatingsArray.push({ 'stars': userRating, 'comment': userComment });
      sessionStorage.setItem('restaurants', JSON.stringify(tempRestaurantsJsonList));
      jsonList.setNewRestaurants();
    }
    else {
      alert('Veuillez saisir un commentaire !')
    }
  }

  setNewRestaurant() {
    let tempRestaurantsJsonList = JSON.parse(sessionStorage.getItem('restaurants'));
    console.log(tempRestaurantsJsonList)

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
      infoWindow.setContent('Vous êtes ici !');
      infoWindow.open(map);

      map.setCenter(pos);

      map.addListener('idle', function () {
        if (Date.now() > (clickTime + 1000))
          jsonList.setNewRestaurants();
      });

      map.addListener('click', function (mapsMouseEvent) {
        console.log(mapsMouseEvent.latLng.toString());
        toggleModal('addRestaurantModal'); // ADD RESTAURANT WITH A CLICK ON THE MAP 
        //jsonList.setNewRestaurant();
      })

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

/*
function revealReviewModal(resto) {
  var reviewModal = document.getElementById('reviewModal');
  reviewModal.id = resto;
  setReviewButton.id = resto;
  reviewCommentArea.id = 'reviewComment' + resto;
  reviewRatingSelect.id = 'reviewRating' + resto;
  reviewModal.style.display = 'block';
}

function closeReviewModal(resto) {
  setReviewButton.id = 'setReviewButton';
  reviewModal.id = 'reviewModal';
  reviewCommentArea.id = 'reviewCommentArea';
  reviewRatingSelect.id = 'reviewRating';
  reviewCommentArea.value = '';
  reviewRatingSelect.value = 1;
  reviewModal.style.display = 'none';
}*/

const jsonList = new JsonList('js/restaurantsList.js'); //Création de l'object Liste JSON
jsonList.initRestaurantsList(); //Initialisation de la liste JSON

window.onload = function () { //Quand la fenêtre (DOM) est prête
  jsonList.setJsonListToLocalStorage(); //On met dans le Local Storage le contenu du fichier JSON
  loadjs(); //On charge la carte
}

// GET THE MODAL ID AND THE RESTAURANT ID THEN REVEAL THE MODAL IF CLOSED, CLOSE IT IF OPENED

function toggleModal(target, item){
  let modal = document.getElementById(target);
  let modalVisibility = modal.style.display;
  let submitButton = document.getElementById(target + 'Button');
  if(modalVisibility == 'block'){
    modal.style.display = 'none';
    delete submitButton.dataset.target;
  } else{
    submitButton.dataset.target = item;
    modal.style.display = 'block'
  }
}


reviewModalButton.addEventListener('click', function(event){
  event.preventDefault;
  let resto = this.dataset.target;
  jsonList.setNewReview(resto);

})