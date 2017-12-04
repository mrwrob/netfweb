function compare(a, b) {
    a = a.replace(/;.*/,"").replace(/,/g,".");
    b = b.replace(/;.*/,"").replace(/,/g,".");
    return b-a;
}

chrome.runtime.onMessage.addListener(function(request, sender, callback) {
    if(request.type=="titleResponse"){
        $('#id_'+request.idNetflix).append("<h3><a target='_blank' href='https://www.netflix.com/title/"+request.idNetflix+"'>"+request.title+"</a></h3><h4>"+request.year+" / "+request.duration+"</h4> <p>"+request.synopsis+"</p>");
    }
});

function generateList(from, count, sortArray){
    $('#list').html("");
    for(var a=from; a<from+count; a++){
        var pos = sortArray[a].split(';');
        $('#list').append("<div class='desc' id='id_"+pos[1]+"'><div class='nfw_score'>"+pos[0]+"</div></div>");
        chrome.runtime.sendMessage({type: "getTitle", idNetflix: pos[1]});
    }
}

function readDB(source){
    chrome.storage.local.get(null, function(items) {
        var scoreArray = new Array();
        for (key in items) {
            if(key.match(source)){
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

        sortArray = scoreArray.sort(compare);
        generateList(from, count, sortArray);


    });
}
var sortArray =Array();
var from=0, count=10;

readDB("filmweb");

$('#next').click(function(){
    from+=count;
    generateList(from, count, sortArray);
});
$('#prev').click(function(){
    if(from-count<0) from=0;
    else from-=count;
    generateList(from, count, sortArray);
});

$('#nflix').click(function(){
    readDB("nflix");
});

$('#metacritic').click(function(){
    readDB("metacritic");
});

$('#filmweb').click(function(){
    readDB("filmweb");
});

$('#imdb').click(function(){
    readDB("imdb");
});


