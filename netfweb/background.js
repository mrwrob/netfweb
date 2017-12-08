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

function getFilmWeb(request,data, delay){

    if(!data["filmweb_"+request.idNetflix]){
        $.ajax({
            url:'http://www.filmweb.pl/search?q='+encodeURIComponent(request.titleName.replace("'"," ")),
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
        if(item.URL && (!item.score || request.all==0)) {
            parseFilmWeb(request.idNetflix,item.URL, item.v);
        }
    }
}

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
                        var filmwebJSON = JSON.stringify({ 'score': score, 'URL' : targetURL, 'v': v });
                        var save = {};
                        save[titleName] = filmwebJSON;
                        chrome.storage.local.set(save);
                    }
               }

            });

        }, Math.random()*delay/3);
    }
}



function getMetacritic(request, data, delay){
    if(!data["metacritic_"+request.idNetflix]){

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
    }else {

        item = JSON.parse(data["metacritic_"+request.idNetflix]);
        if(item.URL && (!item.score || request.all == 0) ) {
            parseMetacritic(request.idNetflix,item.URL, delay, item.v);
        }
    }
}


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
                        var filmwebJSON = JSON.stringify({ 'score': score, 'URL' : targetURL, 'v': v });
                        var save = {};
                        save[titleName] = filmwebJSON;
                        chrome.storage.local.set(save);
                    }
                }

            });

        }, Math.random()*delay/3);
    }
}


function getIMDB(request, data, delay){
    if(!data["imdb_"+request.idNetflix]){

        window.setTimeout(function(){
            $.ajax({
                url:'https://unogs.com/nf.cgi?t=loadvideo&q='+request.idNetflix,
                beforeSend: function(request) {
                    request.setRequestHeader("Accept","text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8");
                    request.setRequestHeader("Cache-Control","max-age=0");
                    request.setRequestHeader("Upgrade-Insecure-Requests","1");
                },
                success: function(data) {
                    imdb=data.RESULT.imdbinfo;
                    if(imdb) {
                        var score='';
                        if(imdb[0]) score = imdb[0];
                        if(imdb[9]) {
                            var targetURL = 'http://www.imdb.com/title/'+imdb[9];
                            var imdbJSON = JSON.stringify({ 'score': score, 'URL' : targetURL });
                            var save = {};
                            var titleName="imdb_"+request.idNetflix;
                            save[titleName] = imdbJSON;
                            chrome.storage.local.set(save);
                        }
                    }
                }
            })}, Math.random()*delay);
    }else {

        item = JSON.parse(data["imdb_"+request.idNetflix]);
        if(item.URL && (!item.score || request.all == 0) ) {
            parseIMDB(request.idNetflix,item.URL, delay, item.v);
        }
    }
}



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
            
            for (var i in  map_imdb){
                var itemJSON = JSON.stringify({'URL' : 'http://www.imdb.com/'+map_imdb[i], 'v': '1' });
                var save = {};
                save["imdb_"+i] = itemJSON;
                chrome.storage.local.set(save);
                console.log(save);
            }

        }

        map_filmweb="";
        map_metacritic="";
        map_imdb="";

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
                    getFilmWeb(request,data, delay);
                });
            }

            if((request.all=="0") || (scoreSource=='nflix')){
                readStore = {};
                readStore["nflix_"+request.idNetflix] = '';
                chrome.storage.local.get(readStore, function(data){
                    getNflix(request,data, delay) ;
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
            else if (request.source=='im') readStore1 = "imdb_"+request.idNetflix;
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

        if(newData[1].match(/filmweb/)) parseFilmWeb(newData[0], newData[1], 1);
        else if(newData[1].match(/metacritic/)) parseMetacritic(newData[0], newData[1], 1);
        else if(newData[1].match(/imdb/)) parseIMDB(newData[0], newData[1], 1);
    }else if(request.type=="getTitle"){
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
                    re = new RegExp('jawbone-overview-info.*(actionsRow?)');
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

chrome.webRequest.onBeforeSendHeaders.addListener(function(details){
    var newRef = "http://unogs.com";
    var gotRef = false;
    for(var n in details.requestHeaders){
        gotRef = details.requestHeaders[n].name.toLowerCase()=="referer";
        if(gotRef){
            details.requestHeaders[n].value = newRef;
            break;
        }
    }
    if(!gotRef){
        details.requestHeaders.push({name:"Referer",value:newRef});
    }
        return {requestHeaders:details.requestHeaders};
    },{
        urls:["https://unogs.com/*"]
    },[
        "requestHeaders",
        "blocking"
    ]
);
