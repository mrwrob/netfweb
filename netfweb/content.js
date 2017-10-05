// Runs background script to aquire score from FilmWeb. Adds SPAN and fullfill it with data from storage.


function reportWrong(idNetflix){
    chrome.runtime.sendMessage({type: "report", idNetflix: idNetflix});
}

function getInfo(data){
    if(data){
        var infoJSON = JSON.parse(data);
        if(infoJSON.score == "0" || infoJSON.score == "" || infoJSON.score == undefined) infoJSON.score="?";
        return infoJSON;
    } else {
        return JSON.parse('{ "score": "?", "URL": ""}');
    }

}

function placeScore(titleName, idNetflix, filmBox){
    if(map_filmweb[idNetflix] != undefined && map_filmweb[idNetflix]!= null) chrome.runtime.sendMessage({type: "getScore", titleName: titleName, idNetflix: idNetflix, filmwebURL: map_filmweb[idNetflix]});
    else chrome.runtime.sendMessage({type: "getScore", titleName: titleName, idNetflix: idNetflix});

    if(filmBox.find('div.nfw_score').length == 0){
        filmBox.append("<div class='nfw_score title_"+idNetflix+"'></div>");

        var readStore = scoreSource+"_"+idNetflix;
        chrome.storage.local.get(readStore, function(data) {
            filmBox.find(".nfw_score").html(getInfo(data[readStore]).score);
        });
    }
}

function placeScoreBob(idNetflix, filmBox){
console.log('BoB');
    var readStore = "filmweb_"+idNetflix;
    chrome.storage.local.get(readStore, function(data) {
        if(data){
            filmBox.append("<span class='nfw_score_bob' onlick='return false;'>Filmweb "+getInfo(data[readStore]).score+"</span>");
        }
    });

    readStore1 = "nflix_"+idNetflix;
    chrome.storage.local.get(readStore1, function(data) {
        filmBox.append("<span class='nfw_score_bob' onlick='return false;'>Nflix.pl "+getInfo(data[readStore1]).score+"</span>");
    });

}

function placeScoreJaw(titleName, idNetflix, filmBox){
    if(map_filmweb[idNetflix] != undefined && map_filmweb[idNetflix]!= null) chrome.runtime.sendMessage({type: "getScore", titleName: titleName, idNetflix: idNetflix, filmwebURL: map_filmweb[idNetflix]});
    else chrome.runtime.sendMessage({type: "getScore", titleName: titleName, idNetflix: idNetflix});

    filmBox.before("<div class='nfw_score_jaw'><img class='nfw_wrong' src='"+chrome.extension.getURL("/wrong.png")+"'> <img src='"+chrome.extension.getURL("/star.png")+"'> </div>");
    destBox = filmBox.parent().find('.nfw_score_jaw');
    destBox.find(".nfw_wrong").click(function(){
        reportWrong(idNetflix);
        $(this).remove();
    });

    var readStore = "filmweb_"+idNetflix;
    chrome.storage.local.get(readStore, function(data) {
        var infoJSON = getInfo(data[readStore]);
        destBox.append(" <a target='_blank' class='nfw_jaw_link' href='"+infoJSON.URL+"'>&nbsp;Filmweb&nbsp;"+infoJSON.score+"</a>&nbsp;<img src='"+chrome.extension.getURL("/star.png")+"'> ");
    });

    readStore1 = "nflix_"+idNetflix;
    chrome.storage.local.get(readStore1, function(data) {
        var infoJSON = getInfo(data[readStore1]);
        destBox.append(" <a target='_blank' class='nfw_jaw_link' href='"+infoJSON.URL+"'>Nflix.pl&nbsp;"+infoJSON.score+"</a>&nbsp;<img src='"+chrome.extension.getURL("/star.png")+"'> ");
    });

}


chrome.storage.onChanged.addListener(function(changes, namespace) {
    titleName=score="";
    for (key in changes) {
        var storageChange = changes[key];
        idNetflix=key.replace(scoreSource+"_","");
        data=storageChange.newValue;
//        if(key=="scoreSource"){
//            titleName = $(this).find('.video-preload-title-label:first').text()
//            if(titleName) placeScore1(titleName, $(this));   
//            alert(key+" "+score);
//        }
    }
 

    if(key!="scoreSource"){
        $(".title_"+idNetflix).each(function(){
            $(this).html(getInfo(data).score);
       });
    }
});


var scoreSource='filmweb';
var readStore = "scoreSource";
chrome.storage.sync.get(readStore, function(data) {
    if((data !== undefined) && (data[readStore] !== undefined)) scoreSource = data[readStore];
    $('.title_card').each(function(){
        titleName = $(this).find('.video-preload-title-label:first').text();
        if(titleName){
            idNetflix = $(this).find('a').attr('href').replace(/\/watch\/([0-9]*).*/,"$1");
            if(titleName) placeScore(titleName,idNetflix, $(this));
        }
    });

    $('.jawBoneContainer').each(function(){
        titleName=$(this).find('div.title').text();
        if(!titleName){
            titleName=$(this).find('img.logo').attr('alt');
        }
        idNetflix = $(this).find('a').attr('href').replace(/\/title\/([0-9]*).*/,"$1");
        if(titleName) placeScoreJaw(titleName, idNetflix, $(this).find('div.actionsRow'));
    });


});



// Allows to monitor changes in DOM. Does not work for JavaScript modifications...
var observer = new MutationObserver(function( mutations ) { 
  mutations.forEach(function( mutation ) {
    var newNodes = mutation.addedNodes; // DOM NodeList
    if( newNodes !== null ) { // If there are new nodes added
    	var $nodes = $( newNodes ); // jQuery set
    	$nodes.each(function() {
            if($(this).attr('class') !== undefined){
                $(this).find('.title_card').each(function(){
                    titleName = $(this).find('.video-preload-title-label:first').text();
                    idNetflix = $(this).find('a').attr('href').replace(/\/watch\/([0-9]*).*/,"$1");
                    if(idNetflix) {
                        placeScore(titleName,idNetflix, $(this));
                    }
                });
                    
                if($(this).attr('class').match("bob-card")){
                    idNetflix = $(this).find('a.bob-jaw-hitzone').attr('href').replace(/.*\/title\/([0-9]*).*/,"$1");
                    if(idNetflix) placeScoreBob(idNetflix, $(this).find('.bob-title'));
                }

                if($(this).attr('class').match(/jawBone(FadeInPlaceContainer|Container|OpenContainer)/)){
                    titleName=$(this).find('div.title').text();
                    if(!titleName){
                        titleName=$(this).find('img.logo').attr('alt');
                    }
                    idNetflix = $(this).find('a').attr('href').replace(/\/title\/([0-9]*).*/,"$1");
                    if(idNetflix) placeScoreJaw(titleName, idNetflix, $(this).find('div.actionsRow'));
                }
            }              
    	});
    }
  });    
});

// Configuration of the observer:
var config = { 
	childList: true, 
	subtree: true, 
    characterData: true
};
 
// Pass in the target node, as well as the observer options
var target = $('#appMountPoint')[0];    // [0] pulls DOM element out of jQuery object
observer.observe(target, config);
 

