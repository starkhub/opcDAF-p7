// Note: This example requires that you consent to location sharing when
      // prompted by your browser. If you see the error "The Geolocation service
      // failed.", it means you probably did not give permission for the browser to
      // locate you.
      var api_key = config.secret_key;
      var map, infoWindow, marker;
      var markerIcon = './css/images/user-marker-64.png';


      function initMap() {
        map = new google.maps.Map(document.getElementById('map'), { //Initialisation object Map avec pour paramètre l'ID de la carte côté html
          center: {lat: -34.397, lng: 150.644},
          zoom: 15
        });
        infoWindow = new google.maps.InfoWindow;

        var restaurantsList = document.createElement('script');
        restaurantsList.src = 'js/restaurantsList.js';
        document.getElementsByTagName('head')[0].appendChild(restaurantsList);
        
        // Try HTML5 geolocation.
        if (navigator.geolocation) {

          navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            marker = new google.maps.Marker({
              position: pos,
              map: map,
              icon: markerIcon
            });
           
            infoWindow.setPosition(pos);//Popup info que l'user peut fermer
            infoWindow.setContent('Vous êtes ici !');
            infoWindow.open(map);

            map.setCenter(pos);

          }, function() {
            handleLocationError(true, infoWindow, map.getCenter());
          });
        } else {
          // Browser doesn't support Geolocation
          handleLocationError(false, infoWindow, map.getCenter());
        }


      }

      window.restaurantsJson = function(restaurants){
        for (let i=0;i < restaurants.mainList.length;i++) {
          let latLng = new google.maps.LatLng(restaurants.mainList[i].lat, restaurants.mainList[i].long);
          let marker = new google.maps.Marker({
            position : latLng,
            map : map
          });
        }
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

     window.onload = loadjs();
