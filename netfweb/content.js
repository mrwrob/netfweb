// Runs background script to aquire score from FilmWeb. Adds SPAN and fullfill it with data from storage.
function placeScore(titleName, filmBox){
    chrome.runtime.sendMessage({type: "getScore", titleName: titleName});

    filmBox.append("<span class='nfw_score title_"+titleName.replace(/[^\w]/gi, '')+"'></span>");

    var readStore = titleName.replace(/[^\w]/gi, '');
    chrome.storage.local.get(readStore, function(data) {
        if(data[readStore] !== undefined){
            filmBox.find("span").append(data[readStore]);
        }
    });
}

chrome.storage.onChanged.addListener(function(changes, namespace) {
   titleName=score="";
   for (key in changes) {
       var storageChange = changes[key];
       titleName=key;
       score=storageChange.newValue;
   }
   $(".title_"+titleName).each(function(){
	$(this).append(score);
   });
});

//chrome.storage.local.clear();     // TODO: clear scores after some time

$('.ptrack-content').each(function(){
    titleName = $(this).find('.video-preload-title-label:first').text()
    if(titleName) placeScore(titleName, $(this));
});


// Allows to monitor changes in DOM. Does not work for JavaScript modifications...
var observer = new MutationObserver(function( mutations ) { 
  mutations.forEach(function( mutation ) {
    var newNodes = mutation.addedNodes; // DOM NodeList
    if( newNodes !== null ) { // If there are new nodes added
    	var $nodes = $( newNodes ); // jQuery set
    	$nodes.each(function() {
            $(this).find('.ptrack-content').each(function(){
                titleName = $(this).find('.video-preload-title-label:first').text()
                if(titleName) placeScore(titleName, $(this));
            });
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
 

