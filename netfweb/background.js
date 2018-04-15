$('body').append("<div id='hidden'></div>");

/**
 * Saves information about rating, and URL in data storage
 * @param {string} storageID - ID of stored score: sourceWebsite_idNetflix
 * @param {string} score - rating provided by website
 * @param {string} targetURL - URL of title's website on the source website
 * @param {integer} v - verification status (1 - verified, 0 - unverified)
 */
function saveScore(storageID, score, targetURL, v){
    var infoJSON = JSON.stringify({ 'score': score, 'URL' : targetURL, 'v': v });
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
function parseFilmWeb(idNetflix,targetURL, v=0){
    if((targetURL.match(/filmweb/)) && (! targetURL.match(/(undefined|news|person|user|videogame)/))){
        $.ajax({
            url: targetURL,
            success: function(data) {
                var parseURL=/communityRateInfo:"[^"]*"/.exec(data);
                var score = "?";
                if(parseURL !== null){
                    score = parseURL[0].replace(/.*"([^"]*)"/,'$1');
                    var storageID="filmweb_"+idNetflix;
                    saveScore(storageID, score, targetURL, v);
                }
            }
        });
    }
}


function getFilmwebURL(request, data, delay){
  var re = new RegExp('data-title="'+request.titleName.replace(/[ \'-;,]/g,'.').replace(/[ęóąśłżźćńĘÓĄŚŁŻŹĆŃ]/g,'[^"]*')+'".*?class="filmPreview__filmTime"', 'im');
  //var re = new RegExp('data-title=.*?class="filmPreview__filmTime"', 'im');
  var parseURL=re.exec(data);
  if(parseURL == null){
      re = new RegExp('<a class="filmPreview__link"[^>]*>[^<]*<h3 class="filmPreview__title">'+request.titleName.replace(/[ \'-;,]/g,'.')+'.*?filmPreview__filmTime', 'i');
      parseURL=re.exec(data);
  }

  if(parseURL !== null){
      var targetURL = "http://www.filmweb.pl"+parseURL[0].replace(/.*?class="filmPreview__link" href="([^"]*)".*/,'$1');
      parseFilmWeb(request.idNetflix,targetURL, delay);
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
        $.ajax({
            url:'http://www.filmweb.pl/search?q='+encodeURIComponent(request.titleName).replace("'","%27"),
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
    } else { // data about title already in storage
        item = JSON.parse(data["filmweb_"+request.idNetflix]);
        if(item.URL && (!item.score || request.all==0)) {
            parseFilmWeb(request.idNetflix,item.URL, item.v);
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
                    var parseURL=/setTargeting\("score", "[^"]*"/.exec(data);
                    var score = "?";
                    if(parseURL !== null){
                        score = parseURL[0].replace(/setTargeting\("score", "([^"]*)"/,'$1');
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
                url:'http://www.metacritic.com/search/all/'+encodeURIComponent(request.titleName.replace("'"," "))+'/results?cats%5Bmovie%5D=1&cats%5Btv%5D=1&search_type=advanced',
                success: function(data) {
                    var re = new RegExp('<a href[^>]*>'+request.titleName.replace(/[ \'-;,]/g,'.')+' *<', 'i');
                    var parseURL=re.exec(data);
                    if(parseURL == null){
                        re = new RegExp('<a href[^>]*>[^<]*'+request.titleName.replace(/[ \'-;,]/g,'.')+'[^<]*<', 'i');
                        parseURL=re.exec(data);
                    }
                    if(parseURL !== null){
                        var targetURL = "http://www.metacritic.com"+parseURL[0].replace(/.*href="([^"]*).*/,'$1');
                        parseMetacritic(request.idNetflix,targetURL, delay);
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
                    var parseURL=/<span itemprop="ratingValue">[^<]*<\/span>/.exec(data);
                    var score = "?";
                    if(parseURL !== null){
                        score = parseURL[0].replace(/.*"ratingValue">([^<]*)<\/span>/,'$1');
                        var titleName="imdb_"+idNetflix;
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
function getIMDB(request, data, delay){
    if(!data["imdb_"+request.idNetflix]){ // data about title not available in storage
        window.setTimeout(function(){
                   $.ajax({ // Search directly on the IMDb website
                        url:'http://www.imdb.com/find?ref_=nv_sr_fn&s=all&q='+encodeURIComponent(request.titleName.replace("'"," ")),
                        success: function(data) {
                            var re = new RegExp('primary_photo"> <a href="/title/[^>]*>', 'i');
                            var parseURL=re.exec(data);
                            if(parseURL !== null){
                                var targetURL = "http://www.imdb.com"+parseURL[0].replace(/.*href="([^"]*).*/,'$1');
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
 * Get Nflix rating
 * @param {string} idNetflix - title's netflix ID
 * @param {string} targetURL - URL of title's website on the source website
 * @param {integer} delay - number of delay before fetching website
 */
function getNflix(request,data, delay){
    if(!data["nflix_"+request.idNetflix]){
        $.ajax({
            url:'http://api.nflix.pl/api_netflix_rating/?k=Lhygft5dfrte4&o=r&c=pl&netflix_id='+request.idNetflix,
            success: function(data) {
                if(data !== null){
                        var score = data;
                        var titleName="nflix_"+request.idNetflix;
                        var targetURL = 'https://www.nflix.pl/netflix-polska/opis/?i='+request.idNetflix;
                        var nflixJSON = JSON.stringify({ 'score': score, 'URL' : targetURL });
                        var save = {};
                        save[titleName] = nflixJSON;
                        chrome.storage.local.set(save);
                }
             }
         });
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
    if(targetURL.match(/themoviedb/)){
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
                if(data !== null){
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
      for (var idNetflix in  map_filmweb) update_map(idNetflix, 'filmweb', 'http://www.filmweb.pl/'+map_filmweb[idNetflix]);
      for (var idNetflix in  map_imdb)  update_map(idNetflix, 'imdb', 'http://www.imdb.com/'+map_imdb[idNetflix]);
      for (var idNetflix in  map_metacritic) update_map(idNetflix, 'metacritic', 'http://www.metacritic.com/'+map_metacritic[idNetflix]);
      for (var idNetflix in  map_tmdb) update_map(idNetflix, 'tmdb', 'https://www.themoviedb.org/'+map_tmdb[idNetflix]);
      map_filmweb="";
      map_metacritic="";
      map_imdb="";
      map_tmdb="";
    });
}

/**
 * Sends report with verifications and new mappings between source service URL and title
 * @param {json} data - mapping between source service URL and title's netflix ID
 */
function send_report_c(data){
    $.ajax({
        method: "POST",
        url: "http://lina.pl/netfweb/report_c.php",
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
            var scoreSource='filmweb';
            if(data && data.scoreSource) scoreSource = data.scoreSource;

            var readStore = {};
            if((request.all=="0") || (scoreSource=='filmweb')){
                readStore["filmweb_"+request.idNetflix] = '';
                chrome.storage.local.get(readStore, function(data){
                    getFilmWeb(request, data, delay);
                });
            }
            if((request.all=="0") || (scoreSource=='tmdb')){
                readStore = {};
                readStore["tmdb_"+request.idNetflix] = '';
                chrome.storage.local.get(readStore, function(data){
                    getTMDb(request, data, delay) ;
                });
            }
            if((request.all=="0") || (scoreSource=='metacritic')){
                readStore = {};
                readStore["metacritic_"+request.idNetflix] = '';
                chrome.storage.local.get(readStore, function(data){
                     getMetacritic(request, data, delay) ;
                });
            }
            if((request.all=="0") || (scoreSource=='imdb')){
                readStore = {};
                readStore["imdb_"+request.idNetflix] = '';
                chrome.storage.local.get(readStore, function(data){
                     getIMDB(request, data, delay) ;
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

            chrome.storage.local.get(readStore1, function(data) {
                var infoJSON = JSON.parse(data[readStore1]);
                // json_data = '"'+request.idNetflix+'": { "URL": "'+infoJSON.URL+'", "score": "'+infoJSON.score+'" },';
                json_data = '"'+request.idNetflix+'": "'+infoJSON.URL+'", ';
                send_report_c(json_data);
            });
        } else {
            $.ajax({
                method: "POST",
                url: "http://lina.pl/netfweb/report.php",
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

