$('body').append("<div id='hidden'></div>");

/**
 * Saves information about rating, and URL in data storage
 * @param {string} storageID - ID of stored score: sourceWebsite_idNetflix
 * @param {string} score - rating provided by website
 * @param {string} targetURL - URL of title's website on the source website
 * @param {integer} v - verification status (1 - verified, 0 - unverified)
 */
function saveScore(storageID, score, targetURL, v, seen=0){
    var infoJSON = JSON.stringify({ 'score': score, 'URL' : targetURL, 'v': v, 'seen' :  seen});
    var save = {};
    save[storageID] = infoJSON;
    chrome.storage.local.set(save);
}

/**
 * Parse the Filmweb website to get the title's rating
 * @param {string} idNetflix - title's netflix ID
 * @param {string} targetURL - URL of title's website on the source website
 * @param {integer} v - verification status (1 - verified, 0 - unverified)
 */
function parseFilmWeb(idNetflix,targetURL, delay, v=0){
    if((targetURL.match(/filmweb/)) && (! targetURL.match(/(undefined|news|person|user|videogame)/))){
        window.setTimeout(function(){
		$.ajax({
		    url: targetURL,
		    success: function(data) {
			var parseURL=/filmRating__rateValue">[^<]*"/.exec(data);
			var score = "?";
			if(parseURL !== null){
			    score = parseURL[0].replace(/.*">([^<]*)"/,'$1');
			    var storageID="filmweb_"+idNetflix;
			    saveScore(storageID, score, targetURL, v);
			}
		    }
		});
        }, Math.random()*delay/3);
    }
}


function getFilmwebURL(request, data, delay){
  var re = new RegExp('data-title="'+request.titleName.replace(/[\'-;,\?]/g,'.').replace(/[  ęóąśłżźćńĘÓĄŚŁŻŹĆŃ]/g,'[^"]*')+'".*?class="filmPreview__description"', 'im');
  var parseURL=re.exec(data);

  if(parseURL == null){
      re = new RegExp('<a class="filmPreview__link"[^>]*>[^<]*<h3 class="filmPreview__title">'+request.titleName.replace(/[ \'-;,]/g,'.')+'.*?filmPreview__filmTime', 'i');
      parseURL=re.exec(data);
  }

  if((parseURL !== null)&&(!parseURL[0].match("Zielona.mila"))){
      var targetURL = "https://www.filmweb.pl"+parseURL[0].replace(/.*?class="filmPreview__link" href="([^"]*)".*/,'$1');
      var score = parseURL[0].replace(/.*"ratingValue">([^<]*).*/,'$1')
      var storageID="filmweb_"+request.idNetflix;
      saveScore(storageID, score, targetURL, 0);
  }

}

/**
 * Searches for the Filmweb website with title's rating
 * @param {json} request - JSON with information about title (idNetflix, titleName)
 * @param {object} data - data read from storage
 * @param {integer} delay - number of delay before fetching website
 */
function getFilmWeb(request, data, delay){
    if(!data["filmweb_"+request.idNetflix]){  // data about title not available in storage
        window.setTimeout(function(){
      		$.ajax({
      		    url:'https://www.filmweb.pl/search?q='+encodeURIComponent(request.titleName).replace("'","%27"),
      		    success: function(data) {

      			if(data.match(/top.location.href/)){
      			  var re = new RegExp("top.location.href='([^']*)", 'm');
      			  var parseURL=re.exec(data);
      			  if(parseURL != null){
      			    newURL = parseURL[0].replace(/top.location.href='([^']*).*/,"$1", "m");
      			    $.ajax({
      				url:newURL,
      				success: function(data) {
      				  getFilmwebURL(request, data, delay);
      				}
      			      });
      			  }
      			} else {
      			  getFilmwebURL(request, data, delay);
      			}
      		    }
      		});
        }, Math.random()*delay);
    } else { // data about title already in storage
        item = JSON.parse(data["filmweb_"+request.idNetflix]);
        if(item.URL && (!item.score || request.all==0)) {
            parseFilmWeb(request.idNetflix,item.URL, delay, item.v);
        }
    }
}

/**
 * Parse the Metcritic website to get the title's rating
 * @param {string} idNetflix - title's netflix ID
 * @param {string} targetURL - URL of title's website on the source website
 * @param {integer} delay - number of delay before fetching website
 * @param {integer} v - verification status (1 - verified, 0 - unverified)
 */
function parseMetacritic(idNetflix,targetURL, delay, v=0){
    if(targetURL.match(/metacritic/)){
        window.setTimeout(function(){
            $.ajax({
                url: targetURL,
                success: function(data) {
                    var parseURL=/setTargeting\({"score": "[^"]*"/.exec(data);
                    var score = "?";
                    if(parseURL !== null){
                        score = parseURL[0].replace(/setTargeting\({"score": "([^"]*)"/,'$1');
                        var titleName="metacritic_"+idNetflix;
                        saveScore(titleName, score, targetURL, v);
                    }
               }

            });
        }, Math.random()*delay/3);
    }
}

/**
 * Searches for the Metcritic website with title's rating
 * @param {json} request - JSON with information about title (idNetflix, titleName)
 * @param {object} data - data read from storage
 * @param {integer} delay - number of delay before fetching website
 */
function getMetacritic(request, data, delay){
    if(!data["metacritic_"+request.idNetflix]){  // data about title not available in storage
        window.setTimeout(function(){
            $.ajax({
                url:'https://www.metacritic.com/search/all/'+encodeURIComponent(request.titleName.replace("'"," "))+'/results?cats%5Bmovie%5D=1&cats%5Btv%5D=1&search_type=advanced',
                success: function(data) {
                    var re = new RegExp('<a href[^>]*>'+request.titleName.replace(/[ \'-;,]/g,'.')+' *<', 'i');
                    var parseURL=re.exec(data);
                    if(parseURL == null){
                        re = new RegExp('<a href[^>]*>[^<]*'+request.titleName.replace(/[ \'-;,]/g,'.')+'[^<]*<', 'i');
                        parseURL=re.exec(data);
                    }
                    if(parseURL !== null){
                        var targetURL = "https://www.metacritic.com"+parseURL[0].split('\n', 1)[0].replace(/.*href="([^"]*).*/,'$1');
                        parseMetacritic(request.idNetflix,targetURL.replace(/(%20)+$/,''), delay);
                    }
                }
            })}, Math.random()*delay);
    }else { // data about title already in storage
        item = JSON.parse(data["metacritic_"+request.idNetflix]);
        if(item.URL && (!item.score || request.all == 0) ) {
            parseMetacritic(request.idNetflix,item.URL, delay, item.v);
        }
    }
}

/**
 * Parse the IMDb website to get the title's rating
 * @param {string} idNetflix - title's netflix ID
 * @param {string} targetURL - URL of title's website on the source website
 * @param {integer} delay - number of delay before fetching website
 * @param {integer} v - verification status (1 - verified, 0 - unverified)
 */
function parseIMDB(idNetflix,targetURL, delay, v=0){
    if(targetURL.match(/imdb/)){
        window.setTimeout(function(){
            $.ajax({
                url: targetURL,
                success: function(data) {
                    var parseURL=/<div class="ratingValue">[^<]*<strong[^<]*<span[^<]*<\/span/.exec(data);
                    var score = "?";
                    if(parseURL !== null){
			                  score = parseURL[0].replace(/.*<span itemprop="ratingValue">([^<]*)<\/span/,'$1');
                        var titleName="imdb_"+idNetflix;
                        saveScore(titleName, score.split("\n")[1], targetURL, v);
                    }
                }

            });

        }, Math.random()*delay/3);
    }
}

/**
 * Searches for the Metcritic website with title's rating
 * @param {json} request - JSON with information about title (idNetflix, titleName)
 * @param {object} data - data read from storage
 * @param {integer} delay - number of delay before fetching website
 */
function getIMDB(request, data, delay){
    if(!data["imdb_"+request.idNetflix]){ // data about title not available in storage
        window.setTimeout(function(){
                   $.ajax({ // Search directly on the IMDb website
                        url:'https://www.imdb.com/find?ref_=nv_sr_fn&s=all&q='+encodeURIComponent(request.titleName.replace("'"," ")),
                        success: function(data) {
                            var re = new RegExp('primary_photo"> <a href="/title/[^>]*>', 'i');
                            var parseURL=re.exec(data);

                            if(parseURL !== null){
                                var targetURL = "https://www.imdb.com"+parseURL[0].replace(/.*href="([^"]*).*/,'$1');
                                parseIMDB(request.idNetflix,targetURL, 1000);
                            }
                        }
            })}, Math.random()*delay);
    }else { // data about title already in storage
        item = JSON.parse(data["imdb_"+request.idNetflix]);
        if(item.URL && (!item.score || request.all == 0) ) {
            parseIMDB(request.idNetflix,item.URL, delay, item.v);
        }
    }
}

/**
 * Parse the TheMovieDB.org website to get the title's rating
 * @param {string} idNetflix - title's netflix ID
 * @param {string} targetURL - URL of title's website on the source website
 * @param {integer} delay - number of delay before fetching website
 * @param {integer} v - verification status (1 - verified, 0 - unverified)
 */
function parseTMDB(idNetflix,targetURL, delay, v=0){
    if(targetURL.match(/themoviedb/) && !targetURL.match(/680304/)){
        window.setTimeout(function(){
          apiURL=targetURL.replace(/www\.themoviedb\.org/, "api.themoviedb.org/3")+"?api_key=863a68f7de47c832b98df21711a2ec1a";
            $.ajax({
                url: apiURL,
                success: function(data) {
                  if(data !== null){
                    var score = "?";
                    var score = Math.round(data.vote_average*10)/10;
                    var titleName="tmdb_"+idNetflix;
                    saveScore(titleName, score, targetURL, v);
                  }
                }
            });

        }, Math.random()*delay/3);
    }
}

/**
 * Get TheMovieDB.org rating
 * @param {string} idNetflix - title's netflix ID
 * @param {string} targetURL - URL of title's website on the source website
 * @param {integer} delay - number of delay before fetching website
 */
function getTMDb(request,data, delay){
    if(!data["tmdb_"+request.idNetflix]){
      window.setTimeout(function(){
        $.getJSON('https://api.themoviedb.org/3/search/multi?api_key=863a68f7de47c832b98df21711a2ec1a&query='+encodeURIComponent(request.titleName).replace("'","%27"), function(data) {
                if(data !== null && data.results[0]){
                  var score = Math.round(data.results[0].vote_average*10)/10;
                  var titleName="tmdb_"+request.idNetflix;
                  var targetURL = 'https://www.themoviedb.org/'+data.results[0].media_type+'/'+data.results[0].id;
                  saveScore(titleName, score, targetURL, 0);
                }
         });
       }, Math.random()*delay);
    }else { // data about title already in storage
        item = JSON.parse(data["tmdb_"+request.idNetflix]);
        if(item.URL && (!item.score || request.all == 0) ) {
            parseTMDB(request.idNetflix,item.URL, delay, item.v);
        }
    }
}

/**
 * Searches for the Rotten Tomatoes website with title's rating
 * @param {json} request - JSON with information about title (idNetflix, titleName)
 * @param {object} data - data read from storage
 * @param {integer} delay - number of delay before fetching website
 */
function getRottenTomatoes(request, data, delay){
  if(!data["rotten_tomatoes_"+request.idNetflix]){
    window.setTimeout(function(){
      $.ajax({
          url: 'https://www.rottentomatoes.com/search?search='+encodeURIComponent(request.titleName.replace("'"," ")),
          success: function(data) {
            var titleNameRegexStr = request.titleName.replace(/[^\w&]+/g,'\\W+').replace(/&/g,'\(?:And\|&\)');
            var re = new RegExp('name":"'+titleNameRegexStr+'","url":"([^"]*)","tomatometerScore":{"score":"(\\d+)', 'i');
            var [,targetURL, score] = re.exec(data) || [];
            if(targetURL !== null && score !== null){
              score = score / 10;
              var titleName = "rotten_tomatoes_"+request.idNetflix;
              saveScore(titleName, score, targetURL, 0);
            }
          }
        })
      },
      Math.random()*delay
    );
  }
}

/**
 * Parse the FilmAffinity website to get the title's rating
 * @param {string} idNetflix - title's netflix ID
 * @param {string} targetURL - URL of title's website on the source website
 * @param {integer} delay - number of delay before fetching website
 * @param {integer} v - verification status (1 - verified, 0 - unverified)
 */
function parseFilmAffinity(idNetflix, targetURL, delay, v=0){
  if(targetURL.match(/filmaffinity/)){
    window.setTimeout(function(){
      $.ajax({
        url: targetURL,
        success: function(data) {
          var titleName = "film_affinity_"+idNetflix;
          var regexStr = '<div id="movie-rat-avg" itemprop="ratingValue" content="(\\d+\.?\\d*)';
          var scoreRegExp = new RegExp(regexStr, "i");
          var [, score] = scoreRegExp.exec(data) || [];
          if (score) {
            saveScore(titleName, score, targetURL, 0);
          } else {
            console.error(`[FilmAffinity] score for "${titleName}" not found on "${targetURL}" using "${scoreRegExp}"`);
          }
        }
      });
    }, Math.random() * delay);
  }
}

/**
 * Searches for the FilmAffinity website with title's rating
 * @param {json} request - JSON with information about title (idNetflix, titleName)
 * @param {object} data - data read from storage
 * @param {integer} delay - number of delay before fetching website
 */
function getFilmAffinity(request, data, delay) {
  if (!data["film_affinity_"+request.idNetflix]) {
    var searchTitleName = request.titleName.replace("Marvel's ", "");
    var searchURL = "https://www.filmaffinity.com/us/search.php?stext=" + encodeURIComponent(searchTitleName);
    window.setTimeout(function(){
      $.ajax({
        url: searchURL,
        success: function(data) {
          var canonicalURL, targetURL, targetUrlRegExp;
          [, canonicalURL] = new RegExp('<meta property="og:url" content="([^"]*)').exec(data) || [];
          if (canonicalURL && canonicalURL.startsWith("https://www.filmaffinity.com/us/film")) {
            targetURL = canonicalURL;
          } else {
            var nameRegexStr = request.titleName
              .replace(/&/g, "\(?:And\|&|&amp;|\\+\)")
              .replace(/2/g, "\(?:2|²\)")
              .replace(/3/g, "\(?:3|³\)")
              .replace("Marvel's ", "\(?:Marvel's \)?");
            var regexStr = '<div class="mc-title"><a +href="([^"]*)" title="' + nameRegexStr + '\\s?(?:\\(TV (?:Mini)?Series\\))?"';
            targetUrlRegExp = new RegExp(regexStr, "i");
            [, targetURL] = targetUrlRegExp.exec(data) || [];
          }
          if (targetURL) {
            parseFilmAffinity(request.idNetflix, targetURL, delay);
          } else {
            console.error(`[FilmAffinity] targetURL for "${request.titleName}" not found on "${canonicalURL}" using "${targetUrlRegExp}"`);
          }
        }
      })
    }, Math.random() * delay);
  }
}

/**
 * Parse the Trakt TV website to get the title's rating
 * @param {string} idNetflix - title's netflix ID
 * @param {string} targetURL - URL of title's website on the source website
 * @param {integer} delay - number of delay before fetching website
 * @param {integer} v - verification status (1 - verified, 0 - unverified)
 */
function parseTraktTV(idNetflix,targetURL, delay, v=0){
	if(targetURL.match(/trakt/)){
		document.cookie = 'SameSite=None; Secure';
		var request_ = new XMLHttpRequest();
		request_.responseType = 'json';
		request_.open('GET', targetURL.replace('https://trakt.tv/', 'https://api.trakt.tv/') + '/ratings');
		request_.setRequestHeader('Content-Type', 'application/json');
		request_.setRequestHeader('trakt-api-version', '2');
		request_.setRequestHeader('trakt-api-key', 'ffa074e4f91501a4b287206468975d0044d696ae4ed537a43fffc9fd77ee4ec1');
		request_.onreadystatechange = function () {
			if (this.readyState === 4 && this.response) {
				var score = Math.round(this.response['rating']*10)/10;
				var titleName="trakt_tv_"+idNetflix;
				saveScore(titleName, score, targetURL, v);
			}
		};
		request_.send();
    }
}

/**
 * Searches for the Trakt TV website with title's rating
 * @param {json} request - JSON with information about title (idNetflix, titleName)
 * @param {object} data - data read from storage
 * @param {integer} delay - number of delay before fetching website
 */
function getTraktTV(request, data, delay){
	if(!data["trakt_tv_"+request.idNetflix]){
		document.cookie = 'SameSite=None; Secure';
		var request_ = new XMLHttpRequest();
		request_.responseType = 'json';
		request_.open('GET', 'https://api.trakt.tv/search?query=' + encodeURIComponent(request.titleName));
		request_.setRequestHeader('Content-Type', 'application/json');
		request_.setRequestHeader('trakt-api-version', '2');
		request_.setRequestHeader('trakt-api-key', 'ffa074e4f91501a4b287206468975d0044d696ae4ed537a43fffc9fd77ee4ec1');
		request_.onreadystatechange = function () {
			if (this.readyState === 4 && this.response[0]) {
				var type = this.response[0]['type']
				var Slug = this.response[0][type]['ids']['slug'];
				var targetURL = 'https://trakt.tv/' + type + 's/' + Slug;
				parseTraktTV(request.idNetflix,targetURL, 1000);
			}
		};
		request_.send();
	}else { // data about title already in storage
        item = JSON.parse(data['trakt_tv_' + request.idNetflix]);
        if(item.URL && (!item.score || request.all == 0) ) {
            parseTraktTV(request.idNetflix,item.URL, delay, item.v);
        }
    }
}


/**
 * Update storege with new mapping between source service URL and title
 * @param {string} idNetflix - title's netflix ID
 * @param {string} source - rating website name (filmweb, metacritic, imdb)
 * @param {string} sourceURL - rating website name URL
 */
function update_map(idNetflix, source, sourceURL){
  var readStore = source+"_"+idNetflix;
  chrome.storage.local.get(readStore, function(data) {
    var itemJSON = JSON.stringify({'URL' : sourceURL, 'v': '1' });
    if(data[readStore]){
      var storageJSON = JSON.parse(data[readStore]);
      if(storageJSON.score) {
        itemJSON = JSON.stringify({'URL' : sourceURL, 'score': storageJSON.score, 'v': '1' });
      }
    }
    var save = {};
    save[readStore] = itemJSON;
    chrome.storage.local.set(save);
  });
}

/**
 * Update storege based on verified mappings from JSON files
 */
function import_maps(){
    var readStore = {};
    readStore["control"] = '';
    chrome.storage.local.get(readStore, function(data){
//      for (var idNetflix in  map_filmweb) update_map(idNetflix, 'filmweb', 'https://www.filmweb.pl/'+map_filmweb[idNetflix]);
      for (var idNetflix in  map_imdb)  update_map(idNetflix, 'imdb', 'https://www.imdb.com/'+map_imdb[idNetflix]);
      for (var idNetflix in  map_metacritic) update_map(idNetflix, 'metacritic', 'https://www.metacritic.com/'+map_metacritic[idNetflix]);
      for (var idNetflix in  map_tmdb) update_map(idNetflix, 'tmdb', 'https://www.themoviedb.org/'+map_tmdb[idNetflix]);
	  for (var idNetflix in  map_trakttv) update_map(idNetflix, 'trakttv', 'https://trakt.tv/'+map_trakttv[idNetflix]);
//      map_filmweb="";
      map_metacritic="";
      map_imdb="";
      map_tmdb="";
	  map_trakttv="";
    });
}

/**
 * Sends report with verifications and new mappings between source service URL and title
 * @param {json} data - mapping between source service URL and title's netflix ID
 */
function send_report_c(data){
    $.ajax({
        method: "POST",
        url: "https://www.lina.pl/netfweb/report_c.php",
        data: { data: data }
    });
}

/* Listens and handles messages sent from content.js */
chrome.runtime.onMessage.addListener(function(request, sender, callback) {

    if((request.type=="getScore")&&(request.idNetflix)){
    /* Request for rating information */
        var delay=10;
        if(request.all=="1") delay=30000;
        var readStore = "scoreSource";
        chrome.storage.local.get(readStore, function(data) {
            var scoreSource='tmdb';
            if(data && data.scoreSource) scoreSource = data.scoreSource;

            var readStore = {};
            if(((request.all=="0")&&(request.serviceDisplay.filmweb == 1)) || (scoreSource=='filmweb')){
                readStore["filmweb_"+request.idNetflix] = '';
                chrome.storage.local.get(readStore, function(data){
                    getFilmWeb(request, data, delay);
                });
            }
            if(((request.all=="0")&&(request.serviceDisplay.tmdb == 1)) || (scoreSource=='tmdb')){
                readStore = {};
                readStore["tmdb_"+request.idNetflix] = '';
                chrome.storage.local.get(readStore, function(data){
                    getTMDb(request, data, delay) ;
                });
            }
            if(((request.all=="0")&&(request.serviceDisplay.metacritic == 1)) || (scoreSource=='metacritic')){
                readStore = {};
                readStore["metacritic_"+request.idNetflix] = '';
                chrome.storage.local.get(readStore, function(data){
                     getMetacritic(request, data, delay) ;
                });
            }
            if(((request.all=="0")&&(request.serviceDisplay.imdb == 1)) || (scoreSource=='imdb')){
                readStore = {};
                readStore["imdb_"+request.idNetflix] = '';
                chrome.storage.local.get(readStore, function(data){
                     getIMDB(request, data, delay) ;
                });
            }
            if(((request.all=="0")&&(request.serviceDisplay.rotten_tomatoes == 1)) || (scoreSource=='rotten_tomatoes')){
                readStore = {};
                readStore["rotten_tomatoes_"+request.idNetflix] = '';
                chrome.storage.local.get(readStore, function(data){
                     getRottenTomatoes(request, data, delay) ;
                });
            }
            if(((request.all=="0")&&(request.serviceDisplay.film_affinity == 1)) || (scoreSource=='film_affinity')){
              readStore = {};
              readStore["film_affinity_"+request.idNetflix] = '';
              chrome.storage.local.get(readStore, function(data){
                   getFilmAffinity(request, data, delay) ;
              });
			} 
			if(((request.all=="0")&&(request.serviceDisplay.trakt_tv == 1)) || (scoreSource=='trakt_tv')){
            readStore = {};
            readStore["trakt_tv_"+request.idNetflix] = '';
            chrome.storage.local.get(readStore, function(data){
                 getTraktTV(request, data, delay) ;
            });
          }
      });

    }else if(request.type=="report"){
   /* Request for sending report */
        if(request.ok){
            var readStore1 = "";
            if(request.source=='fw') readStore1 = "filmweb_"+request.idNetflix;
            else if (request.source=='me') readStore1 = "metacritic_"+request.idNetflix;
            else if (request.source=='im') readStore1 = "imdb_"+request.idNetflix;
            else if (request.source=='tm') readStore1 = "tmdb_"+request.idNetflix;
            else if (request.source=='rt') readStore1 = "rotten_tomatoes_"+request.idNetflix;
            else if (request.source=='fa') readStore1 = "film_affinity_"+request.idNetflix;

            chrome.storage.local.get(readStore1, function(data) {
                var infoJSON = JSON.parse(data[readStore1]);
                // json_data = '"'+request.idNetflix+'": { "URL": "'+infoJSON.URL+'", "score": "'+infoJSON.score+'" },';
                json_data = '"'+request.idNetflix+'": "'+infoJSON.URL+'", ';
                send_report_c(json_data);
            });
        } else {
            $.ajax({
                method: "POST",
                url: "https://www.lina.pl/netfweb/report.php",
                data: { idNetflix: request.idNetflix }
            });
        }

    }else if(request.type=="report_f"){
    /* Request for updating mapping called from popup.js */
        var newData = request.data.split(",");
        if(newData[1].match(/filmweb/)) {
            parseFilmWeb(newData[0], newData[1], 1);
            saveScore("filmweb_"+newData[0], '?', newData[1], '0');
        } else if(newData[1].match(/metacritic/)) {
            parseMetacritic(newData[0], newData[1], 1);
            saveScore("metacritic_"+newData[0], '?', newData[1], '0');
        } else if(newData[1].match(/imdb/)) {
            parseIMDB(newData[0], newData[1], 1);
            saveScore("imdb_"+newData[0], '?', newData[1], '0');
        } else if(newData[1].match(/themoviedb/)) {
            parseTMDB(newData[0], newData[1], 1);
            saveScore("tmdb_"+newData[0], '?', newData[1], '0');
        } else if(newData[1].match(/rotten_tomatoes/)) {
            parseRottenTomatoes(newData[0], newData[1], 1);
            saveScore("rotten_tomatoes_"+newData[0], '?', newData[1], '0');
        } else if(newData[1].match(/film_affinity/)) {
            parseFilAffinity(newData[0], newData[1], 1);
            saveScore("film_affinity_"+newData[0], '?', newData[1], '0');
        } else if(newData[1].match(/trakt_tv/)) {
            parseFilAffinity(newData[0], newData[1], 1);
            saveScore("trakt_tv_"+newData[0], '?', newData[1], '0');
        }

    }else if(request.type=="getTitle"){
    /* Request for getting details about title called from top.js */
        window.setTimeout(function(){
            $.ajax({
                url:'https://www.netflix.com/title/'+request.idNetflix,
                success: function(data) {
                    var re = new RegExp('title has-jawbone-nav-transition[^<]*<div[^>]*[^<]*');
                    var parseTitle=re.exec(data);
                    var title="";
                    if(parseTitle){
                        title = parseTitle[0].replace(/.*>([^>]*)$/,"$1");
                    } else {
                        re = new RegExp('title has-jawbone-nav-transition[^<]*<img alt="[^"]*"');
                        var parseTitle=re.exec(data);
                        title = parseTitle[0].replace(/.*img alt="([^"]*)"/,"$1");
                    }
                    re = new RegExp('jawbone-overview-info.*(actions?)');
                    var parseDesc=re.exec(data);
                    year = parseDesc[0].replace(/.*class="year"[^>]*>([^<]*)<.*/,"$1");
                    duration = parseDesc[0].replace(/.*class="duration"[^>]*>[^>]*>([^<]*)<.*/,"$1");
                    synopsis = parseDesc[0].replace(/.*class="synopsis"[^>]*>([^<]*)<.*/,"$1");
                    chrome.runtime.sendMessage({type: "titleResponse", title: title, idNetflix: request.idNetflix, year: year, duration: duration, synopsis: synopsis});
                }
             });
        }, Math.random()*5000);

    }
});

/* Displays information about extension and updates mapping on update or installation */
chrome.runtime.onInstalled.addListener(function(details){
    if(details.reason == "install"){
        window.open(chrome.extension.getURL("/info.html"));
    } else if(details.reason == "update"){
        currVersion = chrome.runtime.getManifest().version.split('.');
        prevVersion = details.previousVersion.split('.');
        if((currVersion[0]>prevVersion[0]) || (currVersion[1]>prevVersion[1]))
          chrome.tabs.create({url: "info.html"});
    }
    import_maps();
});
