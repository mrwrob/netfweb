$('body').append("<div id='hidden'></div>");


function parseFilmWeb(idNetflix,targetURL, v=0){
    if((targetURL.match(/filmweb/)) && (! targetURL.match(/(undefined|news|person|user|videogame)/))){
        $.ajax({
            url: targetURL,
            success: function(data) {
                var parseURL=/communityRateInfo:"[^"]*"/.exec(data);
                var score = "?";
                if(parseURL !== null){
                    score = parseURL[0].replace(/.*"([^"]*)"/,'$1');
                    var titleName="filmweb_"+idNetflix;
                    var filmwebJSON = JSON.stringify({ 'score': score, 'URL' : targetURL, 'v': v });
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
        $.ajax({
            url:'http://www.filmweb.pl/search?q='+encodeURIComponent(request.titleName.replace("'","")),
            success: function(data) {
                var parseURL=/<a href[^>]*hitTitle/.exec(data);
                if(parseURL !== null){
                    var targetURL = "http://www.filmweb.pl"+parseURL[0].replace(/.*href="([^"]*).*/,'$1');
                    parseFilmWeb(request.idNetflix,targetURL);
                }
            }
        });
    } else {
        item = JSON.parse(data["filmweb_"+request.idNetflix]);
        if(!item.score && item.URL) {
            parseFilmWeb(request.idNetflix,item.URL, item.v);
        }
    }
}

function parseMetacritic(idNetflix,targetURL, v=0){
    if(targetURL.match(/metacritic/)){
        $.ajax({
            url: targetURL,
            success: function(data) {
                var parseURL=/setTargeting\("score", "[^"]*"/.exec(data);
                var score = "?";
                if(parseURL !== null){
                    score = parseURL[0].replace(/setTargeting\("score", "([^"]*)"/,'$1');
                    var titleName="metacritic_"+idNetflix;
                    var filmwebJSON = JSON.stringify({ 'score': score, 'URL' : targetURL, 'v': v });
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
       $.ajax({
            url:'http://www.metacritic.com/search/all/'+encodeURIComponent(request.titleName.replace("'",""))+'/results?cats%5Bmovie%5D=1&cats%5Btv%5D=1&search_type=advanced',
            success: function(data) {
                var re = new RegExp('<a href[^>]*>'+request.titleName.replace(/[ \'-;,]/g,'.')+' *<', 'i');
                var parseURL=re.exec(data);
                if(parseURL == null){
                    re = new RegExp('<a href[^>]*>[^<]*'+request.titleName.replace(/[ \'-;,]/g,'.')+'[^<]*<', 'i');
                    parseURL=re.exec(data);
                }
                if(parseURL !== null){
                    var targetURL = "http://www.metacritic.com"+parseURL[0].replace(/.*href="([^"]*).*/,'$1');
                    parseMetacritic(request.idNetflix,targetURL);
                }
            }
        });
    }else {
        item = JSON.parse(data["metacritic_"+request.idNetflix]);
        if(!item.score && item.URL) {
            parseMetacritic(request.idNetflix,item.URL, item.v);
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

function import_maps(){
    var readStore = {};
    readStore["control"] = '';
    chrome.storage.local.get(readStore, function(data){
        if(!data || data["control"]!="df343sds"){

            var save = {};
            save["control"] = "df343sds";
            chrome.storage.local.set(save);

            for (var i in  map_filmweb){
                var itemJSON = JSON.stringify({'URL' : "http://www.filmweb.pl/"+map_filmweb[i], 'v': '1' });
                var save = {};
                save["filmweb_"+i] = itemJSON;
                chrome.storage.local.set(save);
            }

            for (var i in  map_metacritic){
                var itemJSON = JSON.stringify({'URL' : 'http://www.metacritic.com/'+map_metacritic[i], 'v': '1' });
                var save = {};
                save["metacritic_"+i] = itemJSON;
                chrome.storage.local.set(save);
            }
        }

        map_filmweb="";
        map_metacritic="";

    });


}

function send_report_c(data){
    $.ajax({
        method: "POST",
        url: "http://lina.pl/netfweb/report_c.php",
        data: { data: data }
    });
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
        if(request.ok){
            var readStore1 = "";
            if(request.source=='fw') readStore1 = "filmweb_"+request.idNetflix;
            else if (request.source=='me') readStore1 = "metacritic_"+request.idNetflix;
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
/*        $.ajax({
            method: "POST",
            url: "http://lina.pl/netfweb/report_f.php",
            data: { data: request.data }
        });
*/
        var newData = request.data.split(",");
        if(newData[1].match(/filmweb/)) parseFilmWeb(newData[0], newData[1]);
        else if(newData[1].match(/metacritic/)) parseMetacritic(newData[0], newData[1]);
    }else if(request.type=="getTitle"){
        $.ajax({
            url:'https://www.netflix.com/title/'+request.idNetflix,
            success: function(data) {
                var re = new RegExp('title has-jawbone-nav-transition[^<]*<div[^>]*[^<]*');
                var parseTitle=re.exec(data);
                console.log(parseTitle);

            }
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
    }
//    chrome.storage.local.clear();
    import_maps();
});

