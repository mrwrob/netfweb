// Runs background script to aquire score from FilmWeb. Adds SPAN and fullfill it with data from storage.
function placeScore(titleName, idNetflix, filmBox){
    chrome.runtime.sendMessage({type: "getScore", titleName: titleName, idNetflix: idNetflix});

    filmBox.append("<div class='nfw_score title_"+titleName.replace(/[^\w]/gi, '')+"'></div>");

    var readStore = scoreSource+"_"+titleName.replace(/[^\w]/gi, '');
    chrome.storage.local.get(readStore, function(data) {
        if(scoreSource == 'nflix'){
            score = data[readStore];
            if(score == "0" || score == "" || score == undefined) score="?";
            filmBox.find(".nfw_score").html(score);
        } else {
            var filmwebJSON = JSON.parse(data[readStore]);
            score = filmwebJSON.score;
            if(score == "0" || score == "" || score == undefined) score="?";
            filmBox.find(".nfw_score").html(score);
        }
    });
}

function placeScoreBob(titleName, filmBox){

    var readStore = "filmweb_"+titleName.replace(/[^\w]/gi, '');
    chrome.storage.local.get(readStore, function(data) {
        var filmwebJSON = JSON.parse(data[readStore]);
        score = filmwebJSON.score;
        if(score == "0" || score == "" || score == undefined) score="?";
        filmBox.append("<span class='nfw_score_bob' onlick='return false;'>Filmweb "+score+"</span>");
    });

    readStore1 = "nflix_"+titleName.replace(/[^\w]/gi, '');
    chrome.storage.local.get(readStore1, function(data) {
        score = data[readStore1];
        if(score == "0" || score == "" || score == undefined) score="?";
        filmBox.append("<span class='nfw_score_bob' onlick='return false;'>Nflix.pl "+score+"</span>");
    });

}

function placeScoreJaw(titleName, filmBox){

    var readStore = "filmweb_"+titleName.replace(/[^\w]/gi, '');
    filmBox.append("<div class='nfw_score_jaw'></div>");
    chrome.storage.local.get(readStore, function(data) {
        var filmwebJSON = JSON.parse(data[readStore]);
        score = filmwebJSON.score;
        if(score == "0" || score == "" || score == undefined) score="?";
        filmBox.find('.nfw_score_jaw').append("<img src='"+chrome.extension.getURL("/star.png")+"'> Filmweb "+score+" ");
    });

    readStore1 = "nflix_"+titleName.replace(/[^\w]/gi, '');
    chrome.storage.local.get(readStore1, function(data) {
        score = data[readStore1];
        if(score == "0" || score == "" || score == undefined) score="?";
        filmBox.find('.nfw_score_jaw').append("<img src='"+chrome.extension.getURL("/star.png")+"'> Nflix.pl "+score+" ");
    });

}


chrome.storage.onChanged.addListener(function(changes, namespace) {
    titleName=score="";
    for (key in changes) {
        var storageChange = changes[key];
        titleName=key.replace(scoreSource+"_","");
        score=storageChange.newValue;
//        if(key=="scoreSource"){
//            titleName = $(this).find('.video-preload-title-label:first').text()
//            if(titleName) placeScore1(titleName, $(this));   
//            alert(key+" "+score);
//        }
    }
 
    if(score == "0"||score=="") score="?";

    if(key!="scoreSource"){
        $(".title_"+titleName).each(function(){
            if(titleName.match('$nflix')){
                $(this).html(score);
            } else {
                var filmwebJSON = JSON.parse(score);
                score = filmwebJSON.score;
                if(score == "0" || score == "" || score == undefined) score="?";
                $(this).html(score);
            }
       });
    }
});


var scoreSource='nflix';
var readStore = "scoreSource";
chrome.storage.sync.get(readStore, function(data) {
    if(data[readStore] !== undefined) scoreSource = data[readStore];
    $('.title_card').each(function(){
        titleName = $(this).find('.video-preload-title-label:first').text();
        idNetflix = $(this).attr('href').replace(/\/watch\/([0-9]*).*/,"$1");
        if(titleName) placeScore(titleName,idNetflix, $(this));
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
                    idNetflix = $(this).attr('href').replace(/\/watch\/([0-9]*).*/,"$1");
                    if(titleName) {
                        placeScore(titleName,idNetflix, $(this));
                    }
                });
                    
                if($(this).attr('class').match("bob-card")){
                    $(this).find('.bob-text').each(function(){
                        titleName = $(this).find('.bob-title').text();
                        if(titleName) placeScoreBob(titleName, $(this).find('.bob-title'));
                    });
                }

                if($(this).attr('class').match("jawBoneOpenContainer")){
                    titleName=$(this).find('div.title').text();
                    console.log("gotit:"+ titleName);
                    if(titleName) placeScoreJaw(titleName, $(this).find('div.meta'));
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
 

