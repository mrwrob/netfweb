$('body').append("<div id='hidden'></div>");

function getFilmWeb(request,data){
    if(data[request.titleName.replace(/[^\w]/gi, '')] === ""){
        $('#hidden').load('http://www.filmweb.pl/search?q='+encodeURIComponent(request.titleName)+ ' #body', function() {
            var targetURL="http://filmweb.pl"+$('.hitTitle:first').attr('href');
            if(! targetURL.match(/(undefined|news|person|user|videogame)$/)){
                var titleName=request.titleName.replace(/[^\w]/gi, '');
                $('#hidden').load(targetURL+' #body', function() {
                    var titleName=request.titleName.replace(/[^\w]/gi, '');
                    var save = {};
                    save[titleName] = $('span[itemprop="ratingValue"]').html();
                    chrome.storage.local.set(save);
                });
            }
        });
    }
}

chrome.runtime.onMessage.addListener(function(request, sender, callback) {
    if((request.type=="getScore")&&(request.titleName !== undefined)){
        titleName=request.titleName.replace(/[^\w]/gi, '');
        var readStore = {};
        readStore[titleName] = '';
        chrome.storage.local.get(readStore, function(data){
            getFilmWeb(request,data) ;
        });
    }
});
