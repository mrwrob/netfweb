function compare(a, b) {
    a = a.replace(/;.*/,"").replace(/,/g,".");
    b = b.replace(/;.*/,"").replace(/,/g,".");
    return b-a;
}

$('.links').remove();
chrome.storage.local.get(null, function(items) {
    var scoreArray = new Array();
    for (key in items) {
        if(key.match(/^filmweb/)){
            idNetflix=key.replace(/^[^_]*_/,"");
            try {
                var infoJSON = JSON.parse(items[key]);
            } catch (e) {
                console.log(e);
            }
            if(infoJSON && infoJSON.score && infoJSON.score != 0){
                scoreArray.push(infoJSON.score+";"+idNetflix);
            }
        }
    }

    var sortArray = scoreArray.sort(compare);
    for(var a=0; a<10; a++){
        $('#list').append(sortArray[a]+"<br>");
    }

//            chrome.runtime.sendMessage({type: "getTitle", idNetflix: idNetflix});
});

/*chrome.runtime.onMessage.addListener(function(request, sender, callback) {
    if((request.type=="getScore")&&(request.idNetflix)){
    }
});
 */
