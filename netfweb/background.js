$('body').append("<div id='hidden'></div>");


function parseFilmWeb(request,targetURL){
    if((targetURL.match(/filmweb/)) && (! targetURL.match(/(undefined|news|person|user|videogame)/))){
        $.ajax({
            url: targetURL,
            success: function(data) {
                var parseURL=/communityRateInfo:"[^"]*"/.exec(data);
                var score = "?";
                if(parseURL !== null){
                    score = parseURL[0].replace(/.*"([^"]*)"/,'$1');
                    var titleName="filmweb_"+request.idNetflix;
                    var filmwebJSON = JSON.stringify({ 'score': score, 'URL' : targetURL });
                    var save = {};
                    save[titleName] = filmwebJSON;
                    chrome.storage.local.set(save);
                }
            }

        });
    }
}

function getFilmWeb(request,data){

    if(!data["filmweb_"+request.idNetflix]){
        if(request.filmwebURL) parseFilmWeb(request,'http://www.filmweb.pl/'+request.filmwebURL);
        else {
            $.ajax({
                url:'http://www.filmweb.pl/search?q='+encodeURIComponent(request.titleName),
                success: function(data) {
                    var parseURL=/<a href[^>]*hitTitle/.exec(data);
                    if(parseURL !== null){
                        var targetURL = "http://www.filmweb.pl"+parseURL[0].replace(/.*href="([^"]*).*/,'$1');
                        parseFilmWeb(request,targetURL);
                    }
                }
            });
        }
    }
}

function parseMetacritic(request,targetURL){
    if(targetURL.match(/metacritic/)){
        $.ajax({
            url: targetURL,
            success: function(data) {
                var parseURL=/setTargeting\("score", "[^"]*"/.exec(data);
                var score = "?";
                if(parseURL !== null){
                    score = parseURL[0].replace(/setTargeting\("score", "([^"]*)"/,'$1');
                    var titleName="metacritic_"+request.idNetflix;
                    var filmwebJSON = JSON.stringify({ 'score': score, 'URL' : targetURL });
                    var save = {};
                    save[titleName] = filmwebJSON;
                    chrome.storage.local.set(save);
                }
            }

        });
    }
}



function getMetacritic(request, data){
    if(!data["metacritic_"+request.idNetflix]){
        if(request.metacriticURL) {
            parseMetacritic(request,'http://www.metacritic.com/'+request.metacriticURL);
        }else {
            $.ajax({
                url:'http://www.metacritic.com/search/all/'+encodeURIComponent(request.titleName)+'/results?cats%5Bmovie%5D=1&cats%5Btv%5D=1&search_type=advanced',
                success: function(data) {
                    var re = new RegExp('<a href[^>]*>'+request.titleName.replace(/[ \'-;,]/g,'.')+' *<', 'i');
                    var parseURL=re.exec(data);
                    if(parseURL == null){
                        re = new RegExp('<a href[^>]*>[^<]*'+request.titleName.replace(/[ \'-;,]/g,'.')+'[^<]*<', 'i');
                        parseURL=re.exec(data);
                    }
                    if(parseURL !== null){
                        var targetURL = "http://www.metacritic.com"+parseURL[0].replace(/.*href="([^"]*).*/,'$1');
                        parseMetacritic(request,targetURL);
                    }
                }
            });
        }
    }
}



function getNflix(request,data){

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

chrome.runtime.onMessage.addListener(function(request, sender, callback) {
    if((request.type=="getScore")&&(request.idNetflix)){
        var readStore = {};
        readStore["filmweb_"+request.idNetflix] = '';
        chrome.storage.local.get(readStore, function(data){
            getFilmWeb(request,data) ;
        });

        readStore = {};
        readStore["nflix_"+request.idNetflix] = '';
        chrome.storage.local.get(readStore, function(data){
            getNflix(request,data) ;
        });

    } else if((request.type=="getScoreMeta")&&(request.idNetflix)){
        var readStore = {};
        readStore["metacritic_"+request.idNetflix] = '';
        chrome.storage.local.get(readStore, function(data){
             getMetacritic(request, data) ;
        });
    }else if(request.type=="report"){
        $.ajax({
            method: "POST",
            url: "http://lina.pl/netfweb/report.php",
            data: { idNetflix: request.idNetflix }
        });
        var save = {};
        save['clipboard'] = {idNetflix: request.idNetflix, title: request.title};
        chrome.storage.local.set(save);
    }else if(request.type=="report_f"){
        $.ajax({
            method: "POST",
            url: "http://lina.pl/netfweb/report_f.php",
            data: { data: request.data }
        });
     }
});

chrome.runtime.onInstalled.addListener(function(details){
    if(details.reason == "install"){
        window.open(chrome.extension.getURL("/info.html"));
    } else if(details.reason == "update"){
        currVersion = chrome.runtime.getManifest().version.split('.');
        prevVersion = details.previousVersion.split('.');
        if((currVersion[0]>prevVersion[0]) || (currVersion[1]>prevVersion[1]))
            window.open(chrome.extension.getURL("/info.html"));
        chrome.storage.local.clear();
    }
});


