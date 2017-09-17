$('body').append("<div id='hidden'></div>");

function getFilmWeb(request,data){

    if(!data["filmweb_"+request.titleName.replace(/[^\w]/gi, '')]){
        $.ajax({
            url:'http://www.filmweb.pl/search?q='+encodeURIComponent(request.titleName),
            success: function(data) {
                var parseURL=/<a href[^>]*hitTitle/.exec(data);
                if(parseURL !== null){
                    var targetURL = "http://www.filmweb.pl"+parseURL[0].replace(/.*href="([^"]*).*/,'$1');
                    if((targetURL.match(/filmweb/)) && (! targetURL.match(/(undefined|news|person|user|videogame)/))){
                        var titleName=request.titleName.replace(/[^\w]/gi, '');
                        $.ajax({
                            url: targetURL,
                            success: function(data) {
                                var parseURL=/communityRateInfo:"[^"]*"/.exec(data);
                                var score = "?";
                                if(parseURL !== null){
                                    score = parseURL[0].replace(/.*"([^"]*)"/,'$1');
                                    var titleName="filmweb_"+request.titleName.replace(/[^\w]/gi, '');
                                    var filmwebJSON = JSON.stringify({ 'score': score, 'URL' : targetURL });
                                    var save = {};
                                    save[titleName] = filmwebJSON;
                                    chrome.storage.local.set(save);
                                }
                            }
 
                        });
                    }

                }
            }
        });
    }
}

function getNflix(request,data){

    if((data["nflix_"+request.titleName.replace(/[^\w]/gi, '')] === "")|| (data["nflix_"+request.titleName.replace(/[^\w]/gi, '')] === undefined)){
        $.ajax({
            url:'http://api.nflix.pl/api_netflix_rating/?k=Lhygft5dfrte4&o=r&c=pl&netflix_id='+request.idNetflix,
            success: function(data) {
                if(data !== null){
                        var score = data;
                        var titleName="nflix_"+request.titleName.replace(/[^\w]/gi, '');
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
    if((request.type=="getScore")&&(request.titleName !== undefined)){
        titleName=request.titleName.replace(/[^\w]/gi, '');
        var readStore = {};
        readStore["filmweb_"+titleName] = '';
        chrome.storage.local.get(readStore, function(data){
            getFilmWeb(request,data) ;
        });

        readStore = {};
        readStore["nflix_"+titleName] = '';
        chrome.storage.local.get(readStore, function(data){
            getNflix(request,data) ;
        });
    }
});
