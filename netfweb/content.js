// Runs background script to aquire score from FilmWeb. Adds SPAN and fullfill it with data from storage.

/**
 * Send message to background.js to report the correctness of links to rating websites.
 * @param {string} idNetflix - title's netflix ID
 * @param {boolean} ok - true the link correct, otherwise false
 * @param {string} source - rating website id (fw - Filmweb, me - Metacritic, im - IMDb)
 */
function reportLinks(idNetflix, ok, source){
    chrome.runtime.sendMessage({type: "report", idNetflix: idNetflix, ok: ok, source: source});
}

/**
 * Clears storage entry regarding mapping between given title and website
 * @param {string} idNetflix - title's netflix ID
 * @param {string} source - rating website name (filmweb, metacritic, imdb)
 */
function clearMap(idNetflix, source){
    var itemJSON = JSON.stringify({'URL' : ''});
    var save = {};
    save[source+"_"+idNetflix] = itemJSON;
    chrome.storage.local.set(save);
}

/**
 * Clears storage entry regarding mapping between given title and website
 * @param {string} data - data read from storage
 * @return {json} - returns JSON object (with score and URL values)
 */
function getInfo(data){
    if(data){
        var infoJSON = JSON.parse(data);
        if(infoJSON.score == "0" || infoJSON.score == "" || infoJSON.score == undefined) infoJSON.score="?";
        return infoJSON;
    } else {
        return JSON.parse('{ "score": "?", "URL": ""}');
    }
}

function displayScore(score){
  if(score && (score == "?")) return score;
  if(isNaN(score)) newScore = parseFloat(score.replace(",","."));
  else newScore = score;
  if(newScore < 10) return Math.round(newScore*10)/10
  else return Math.round(newScore);
}

/**
 * Place title's rating from one selected source on browsing page (that with multiply titles)
 * @param {string} titleName - title's name
 * @param {string} idNetflix - title's netflix ID
 * @param {string} filmBox - jquery object where information will be placed
 */
function placeScore(titleName, idNetflix, filmBox){
    /* Send message to background.js to prepare information about rating of selected title,
       all=1 - only for one, currently selected source website */
    chrome.runtime.sendMessage({type: "getScore", titleName: titleName, idNetflix: idNetflix, all: "1"});

//    if(filmBox.find('div.nfw_score').length == 0 || filmBox.find('div.nfw_score').text != '?'){
    if(filmBox.find('div.nfw_score').length == 0){
        filmBox.append("<div class='nfw_score title_"+idNetflix+"'></div>");
        if(!scoreSource) scoreSource='tmdb';
        var readStore = scoreSource+"_"+idNetflix;
        console.log(readStore);
        /* Read and place score from storage */
        chrome.storage.local.get(readStore, function(data) {
            console.log(data[readStore]);
	    colorScore = currScore = displayScore(getInfo(data[readStore]).score);
	     
	    if(displayColors && (colorScore != '?')){
		    if(colorScore>10) colorScore /= 10;
		    if(colorScore < 5) colorClass = 'red';
		    else if(colorScore < 6.5) colorClass = 'orange';
		    else if(colorScore < 8) colorClass = 'yellow';
		    else colorClass = 'green';
            	    filmBox.find(".nfw_score").addClass('nfw_circle_'+colorClass);
	    }
            filmBox.find(".nfw_score").html(currScore);
        });

        var readStore = "watch_"+idNetflix;
        /* Read and place score from storage */
        chrome.storage.local.get(readStore, function(data) {
            if(data[readStore]){
                filmBox.css('opacity', '0.3');
            }
        });
    }
}

/**
 * Place title's ratings from all sources on title's detail page
 * @param {string} titleName - title's name
 * @param {string} idNetflix - title's netflix ID
 * @param {string} filmBox - jquery object where information will be placed
 */
function placeScoreJaw(titleName, idNetflix, filmBox){
    chrome.runtime.sendMessage({type: "getScore", titleName: titleName, idNetflix: idNetflix, all: "0", serviceDisplay: serviceDisplay});
    filmBox.before("<div class='nfw_score_jaw'><img class='nfw_wrong' src='"+chrome.extension.getURL("/wrong.png")+"'> <img src='"+chrome.extension.getURL("/star.png")+"'><div id='nfw_report_a'><div id='nfw_report'></div></div> </div>");
    filmBox.before("<div class='nfw_related'><a href='https://www.netflix.com/search?q=%20&suggestionId="+idNetflix+"_video'>related titles...</a></div>");
    destBox = filmBox.parent().find('.nfw_score_jaw');

    /* Reporting information about correctness of links to websites with ratings */
    destBox.find(".nfw_wrong").click(function(){
        $nfw_report=$(this).parent().find('#nfw_report');
        if($nfw_report.html()){
            var save = {};
            save['clipboard'] = {idNetflix: idNetflix, title: titleName};
            chrome.storage.local.set(save);
            $nfw_report.css("display", "block");
        }
        $(this).remove();
    });

    var params = {};
    if(serviceDisplay["imdb"] != 0) params["imdb"] ={ "URL": "http://www.imdb.com/find?ref_=nv_sr_fn&s=all&q=", "shortcut": "im", "name": "IMDb"};
    if(serviceDisplay["tmdb"] != 0) params["tmdb"] = { "URL": "https://www.themoviedb.org/search?query=", "shortcut": "tm", "name": "TheMovieDB"};
    if(serviceDisplay["rotten_tomatoes"] != 0) params["rotten_tomatoes"] = { "URL": "https://www.rottentomatoes.com/search?search=", "shortcut": "rt", "name": "Rotten Tomatoes"};
    if(serviceDisplay["filmweb"] != 0) params["filmweb"] = { "URL": "https://www.filmweb.pl/search?q=", "shortcut": "fw", "name": "Filmweb"};
    if(serviceDisplay["metacritic"] != 0) params["metacritic"] = { "URL": "http://www.metacritic.com/search/all/", "URL2": "/results?cats%5Bmovie%5D=1&cats%5Btv%5D=1&search_type=advanced", "shortcut": "me", "name": "Metacritic"};
    if(serviceDisplay["film_affinity"] != 0) params["film_affinity"] = { "URL": "https://www.filmaffinity.com/us/search.php?stext=", "shortcut": "fa", "name": "FilmAffinity"};
	if(serviceDisplay["trakt_tv"] != 0) params["trakt_tv"] = { "URL": "https://trakt.tv/search?query=", "shortcut": "tk", "name": "Trakt TV"};

    Object.keys(params).forEach(function(source){
      var readStore = source+"_"+idNetflix;
      chrome.storage.local.get(readStore, function(data) {
          var infoJSON = getInfo(data[readStore]);
          var sourceURL = infoJSON.URL;
          if(!sourceURL) {
            sourceURL=params[source].URL+encodeURIComponent(titleName).replace("'","%27");
            if(params[source].URL2) sourceURL+=params[source].URL2;
          }
          destBox.append(" <a target='_blank' class='nfw_jaw_link link_"+readStore+"' href='"+sourceURL+"'>&nbsp;"+params[source].name+"&nbsp;<span class='title_"+readStore+"'>"+displayScore(infoJSON.score)+"</span></a>&nbsp;<img src='"+chrome.extension.getURL("/star.png")+"'> ");
          if(infoJSON.v!=1) {
              destBox.find('#nfw_report').append("<div id='ntw_"+params[source].shortcut+"_report'>"+params[source].name+"&nbsp;<img id='ntw_"+params[source].shortcut+"_ok' class='nfw_button' src='"+chrome.extension.getURL("/ok.png")+"'>&nbsp;<img id='ntw_"+params[source].shortcut+"_wrong' class='nfw_button' src='"+chrome.extension.getURL("/wrong.png")+"'> </div>");
              destBox.find('#ntw_'+params[source].shortcut+'_ok').click(function(){
                  reportLinks(idNetflix, true, params[source].shortcut);
                  destBox.find('#ntw_'+params[source].shortcut+'_report').remove();
              });
              destBox.find('#ntw_'+params[source].shortcut+'_wrong').click(function(){
                  reportLinks(idNetflix, false, params[source].shortcut);
                  clearMap(idNetflix, source);
                  destBox.find('#ntw_'+params[source].shortcut+'_report').remove();
              });
          }
      });
    })
}

/**
 * Place title's ratings from all sources on title's popup page
 * @param {string} titleName - title's name
 * @param {string} idNetflix - title's netflix ID
 * @param {string} filmBox - jquery object where information will be placed
 */
function placeScoreBob(titleName, idNetflix, filmBox){
    chrome.runtime.sendMessage({type: "getScore", titleName: titleName, idNetflix: idNetflix, all: "0", serviceDisplay: serviceDisplay});
    filmBox.append("<div class='nfw_score_bob'></div>");
    destBox = filmBox.parent().find('.nfw_score_bob');

    var params = {};
    if(serviceDisplay["tmdb"] != 0) params["tmdb"] = { "URL": "https://www.themoviedb.org/search?query=", "shortcut": "tm", "name": "TheMovieDB"};
    if(serviceDisplay["imdb"] != 0) params["imdb"] ={ "URL": "http://www.imdb.com/find?ref_=nv_sr_fn&s=all&q=", "shortcut": "im", "name": "IMDb"};
    if(serviceDisplay["rotten_tomatoes"] != 0) params["rotten_tomatoes"] = { "URL": "https://www.rottentomatoes.com/search?search=", "shortcut": "rt", "name": "Rotten Tomatoes"};
    if(serviceDisplay["filmweb"] != 0) params["filmweb"] = { "URL": "https://www.filmweb.pl/search?q=", "shortcut": "fw", "name": "Filmweb"};
    if(serviceDisplay["metacritic"] != 0) params["metacritic"] = { "URL": "http://www.metacritic.com/search/all/", "URL2": "/results?cats%5Bmovie%5D=1&cats%5Btv%5D=1&search_type=advanced", "shortcut": "me", "name": "Metacritic"};
    if(serviceDisplay["film_affinity"] != 0) params["film_affinity"] = { "URL": "https://www.filmaffinity.com/us/search.php?stext=", "shortcut": "fa", "name": "FilmAffinity"};
	if(serviceDisplay["trakt_tv"] != 0) params["trakt_tv"] = { "URL": "https://trakt.tv/search?query=", "shortcut": "tk", "name": "Trakt TV"};

    Object.keys(params).forEach(function(source){
      var readStore = source+"_"+idNetflix;
      chrome.storage.local.get(readStore, function(data) {
          var infoJSON = getInfo(data[readStore]);
          var sourceURL = infoJSON.URL;
          var watched = infoJSON.seen=='1' ? true : false;
          if(!sourceURL) {
            sourceURL=params[source].URL+encodeURIComponent(titleName).replace("'","%27");
            if(params[source].URL2) sourceURL+=params[source].URL2;
          }

          destBox.append(" <img src='"+chrome.extension.getURL("/star.png")+"'>&nbsp;<a target='_blank' class='nfw_jaw_link link_"+readStore+"' href='"+sourceURL+"'>&nbsp;"+params[source].name+"&nbsp;<span class='title_"+readStore+"'>"+displayScore(infoJSON.score)+ (watched ? " Watched" : "") +"</span></a>");
          if(watched){
            box_movie.find(".title-card-container").addClass('nfw_watched');
          }
        });
    });
}

chrome.runtime.sendMessage({type: "update_token"});

/*
 * Listens to changes in data storege and changes information about ratings
 */
chrome.storage.onChanged.addListener(function(changes, namespace) {
    titleName=score="";

		    console.log("AAA", changes);
    for (key in changes) {
        if(key.match(/scoreChecked_/)){
          serviceDisplay[key.replace(/scoreChecked_/,(""))] = changes[key].newValue.checked;
        }else if(key!="scoreSource"){
            var storageChange = changes[key];
            idNetflix=key.replace(scoreSource+"_","");
            data=storageChange.newValue;

            if(key.match(scoreSource)){
                $(".title_"+idNetflix).each(function(){
	    	        colorScore = currScore = displayScore(getInfo(data).score);
                    $(this).html(currScore);
		            if(displayColors && (colorScore != '?')){
		                if(colorScore>10) colorScore /= 10;
		                if(colorScore < 5) colorClass = 'red';
		                else if(colorScore < 6.5) colorClass = 'orange';
		                else if(colorScore < 8) colorClass = 'yellow';
		                else colorClass = 'green';
            	        $(this).addClass('nfw_circle_'+colorClass);
	                }
                });
            }
            if(key.match("watch_")){
                idNetflix=key.replace("watch_","");
                $(".title_"+idNetflix).each(function(){
                    $(this).closest('.title-card-container').css('opacity', '0.3');
                });
            }

            $(".title_"+key).each(function(){
                $(this).html(displayScore(getInfo(data).score));
            });

            $(".link_"+key).each(function(){
                $(this).attr('href',getInfo(data).URL);
            });
        }
    }
});


var scoreSource='tmdb';  // Default ratings source website
var readStore = "scoreSource";
var readStore1 = "colorsChecked";
var displayColors=false;
chrome.storage.local.get(readStore1, function(data) {
    if((data !== undefined) && (data[readStore1] !== undefined)) {
	if(data['colorsChecked']==1) displayColors=true ;
    }
});

chrome.storage.local.get(readStore, function(data) {
    if((data !== undefined) && (data[readStore] !== undefined)) scoreSource = data[readStore];

    // For all displayed titles
    $('.title-card').each(function(){
        titleName = $(this).find('.fallback-text:first').text();  // Gets the title's name
        idNetflix = $(this).find('a').attr('href').replace(/\/watch\/([0-9]*).*/,"$1"); // Gets the title's netflix ID
        if(idNetflix){
            placeScore(titleName,idNetflix, $(this));
        }
    });

    // For selected title (details view)
    $('.jawBoneContainer').each(function(){
        titleName=$(this).find('div.title').text();
        if(!titleName){
            titleName=$(this).find('img.logo').attr('alt');
        }
        idNetflix = $(this).find('a').attr('href').replace(/\/title\/([0-9]*).*/,"$1");
        if(titleName) {
            if($(this).find('div.meta-lists')) {
              var filmBox = $(this).find('div.previewModal--detailsMetadata-info');
              titleName2=titleName;
              idNetflix2=idNetflix
              setTimeout(function(){
                placeScoreJaw(titleName2, idNetflix2, filmBox);
              }, 1000);
            } else placeScoreJaw(titleName, idNetflix, $(this).find('div.previewModal--detailsMetadata-info'));
        }
    });
});

var servicesArray = ["tmdb", "imdb",  "rotten_tomatoes", "metacritic", "filmweb", "film_affinity", "trakt_tv"];
var serviceDisplay = {"tmdb": 1, "imdb": 1, "rotten_tomatoes": 1, "metacritic": 1, "filmweb": 1, "film_affinity": 1, "trakt_tv": 1};

for(var service of servicesArray){
  chrome.storage.local.get("scoreChecked_"+service, function(data) {
      if(data !== undefined || data[readStore] !== undefined){
        var keyValue = Object.keys(data)[0];
        if(keyValue !== undefined){
          if(data[keyValue].checked == 0){
            serviceDisplay[keyValue.replace(/scoreChecked_/,"")] = 0
          }
        }
      }
  });
}

// Allows to monitor changes in DOM.
var observer = new MutationObserver(function( mutations ) {   // based on https://gabrieleromanato.name/jquery-detecting-new-elements-with-the-mutationobserver-object/
  mutations.forEach(function( mutation ) {
    var newNodes = mutation.addedNodes; // DOM NodeList
    if( newNodes !== null ) { // If there are new nodes added
    	var $nodes = $( newNodes ); // jQuery set
    	$nodes.each(function() {
            if($(this).attr('class') !== undefined){
                
                // For all displayed titles
                $(this).find('.title-card-container').each(function(){
                    titleName = $(this).find('.fallback-text:first').text();
                    idNetflix = $(this).find('a').attr('href').replace(/\/watch\/([0-9]*).*/,"$1");
                    if(idNetflix) {
                        placeScore(titleName,idNetflix, $(this));
                    }
                });

                // For selected title (details view)
                if($(this).attr('class').match(/focus-trap-wrapper.previewModal--wrapper.detail-modal/)){
                    if(idNetflix) {
		    detailDialog = $(this).closest('#appMountPoint');
                    titleName=detailDialog.find('.previewModal--player-titleTreatment-logo').attr('alt');
		    idNetflix = detailDialog.find('div.ptrack-content').attr('data-ui-tracking-context').replace(/.*%22video_id%22:([0-9]*).*/,"$1");
                    	placeScoreBob(titleName,idNetflix, $(this).find('div.previewModal--detailsMetadata'));
                    }
                }
                if($(this).attr('class').match(/bob-card/)){
                  titleName=$(this).find('.bob-title').text();
		  idNetflix = $(this).find('div.ptrack-content').attr('data-ui-tracking-context').replace(/.*%22video_id%22:([0-9]*).*/,"$1");
                  if(idNetflix) {
                    placeScoreBob(titleName,idNetflix, $(this).find('div.previewModal--popup'));
                  }
                }

                if($(this).attr('class').match(/focus-trap-wrapper.previewModal--wrapper.mini-modal/)){
                  titleName=$(this).find('.previewModal--boxart').attr('alt');
		  idNetflix = $(this).find('div.ptrack-content').attr('data-ui-tracking-context').replace(/.*%22video_id%22:([0-9]*).*/,"$1");
                  if(idNetflix) {
                    placeScoreBob(titleName,idNetflix, $(this).find('div.previewModal--info'));
                  }
                }


                // For the player
                //tem de guardar na memoria o que esta a ver (UNIQUE)
                //limpa ao para
                //se não limpar tem de limpar antes de entrar outro
                if($(this).attr('class').match(/svg-icon-nfplayerPlay/)){
                    idNetflix = window.location.pathname.replace("/watch/","");
                    chrome.runtime.sendMessage({type: "watch", idNetflix: idNetflix, mode: "pause"});
                    console.log("Is paused");
                }
                if($(this).attr('class').match(/svg-icon-nfplayerPause/)){
                    idNetflix = window.location.pathname.replace("/watch/","");
                    chrome.runtime.sendMessage({type: "watch", idNetflix: idNetflix, mode: "play"});
                    console.log("Is playing");
                }
                if($(this).attr('class').match(/touchable.PlayerControls--control-element.nfp-popup-control.nfp-popup-control--static-position/)){
                    idNetflix = window.location.pathname.replace("/watch/","");
                    chrome.runtime.sendMessage({type: "watch", idNetflix: idNetflix, mode: "start"});
                    console.log("Start");
                }
                if($(this).attr('class').match(/ptrack-container.fill-container.OriginalsPostPlay-BackgroundTrailer/)){
                    idNetflix = window.location.pathname.replace("/watch/","");
                    chrome.runtime.sendMessage({type: "watch", idNetflix: idNetflix, mode: "end"});
                    console.log("End");
                }

            }
    	});
    }
  });
});

// Configuration of the MutationObserver:
var config = {
	childList: true,
	subtree: true,
  characterData: true
};

// Pass in the target node, as well as the observer options
var target = $('#appMountPoint')[0];
observer.observe(target, config);
