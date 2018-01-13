// Runs background script to aquire score from FilmWeb. Adds SPAN and fullfill it with data from storage.


function reportWrong(idNetflix, ok, source){
    chrome.runtime.sendMessage({type: "report", idNetflix: idNetflix, ok: ok, source: source});
}

function clearMap(idNetflix, source){
    var itemJSON = JSON.stringify({'URL' : ''});
    var save = {};
    save[source+"_"+idNetflix] = itemJSON;
    chrome.storage.local.set(save);
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
    chrome.runtime.sendMessage({type: "getScore", titleName: titleName, idNetflix: idNetflix, all: "1"});

    if(filmBox.find('div.nfw_score').length == 0 || filmBox.find('div.nfw_score').text != '?'){

        filmBox.append("<div class='nfw_score title_"+idNetflix+"'></div>");
        if(!scoreSource) scoreSource='filmweb';
        var readStore = scoreSource+"_"+idNetflix;

        chrome.storage.local.get(readStore, function(data) {
            filmBox.find(".nfw_score").html(getInfo(data[readStore]).score);
        });
    }
}

function placeScoreBob(idNetflix, filmBox){
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
    chrome.runtime.sendMessage({type: "getScore", titleName: titleName, idNetflix: idNetflix, all: "0"});
//    chrome.runtime.sendMessage({type: "getScoreMeta", titleName: titleName, idNetflix: idNetflix});

    filmBox.before("<div class='nfw_score_jaw'><img class='nfw_wrong' src='"+chrome.extension.getURL("/wrong.png")+"'> <img src='"+chrome.extension.getURL("/star.png")+"'><div id='nfw_report_a'><div id='nfw_report'></div></div> </div>");
    filmBox.before("<div class='nfw_related'><a href='https://www.netflix.com/search?q=%20&suggestionId="+idNetflix+"_video'>related titles...</a></div>");
    destBox = filmBox.parent().find('.nfw_score_jaw');
    destBox.find(".nfw_wrong").click(function(){
        $nfw_report=$(this).parent().find('#nfw_report');
        if($nfw_report.html()){
            var save = {};
            save['clipboard'] = {idNetflix: idNetflix, title: titleName};
            chrome.storage.local.set(save);

            $nfw_report.css("display", "block");
        }
        $(this).remove();
    });

    var readStore = "filmweb_"+idNetflix;
    chrome.storage.local.get(readStore, function(data) {
        var infoJSON = getInfo(data[readStore]);
        var filmwebURL = infoJSON.URL;
        if(!filmwebURL) filmwebURL='http://www.filmweb.pl/search?q='+encodeURIComponent(titleName).replace("'","%27");
        destBox.append(" <a target='_blank' class='nfw_jaw_link link_"+readStore+"' href='"+filmwebURL+"'>&nbsp;Filmweb&nbsp;<span class='title_"+readStore+"'>"+infoJSON.score+"</span></a>&nbsp;<img src='"+chrome.extension.getURL("/star.png")+"'> ");
        if(infoJSON.v!=1) {
            destBox.find('#nfw_report').append("<div id='ntw_fw_report'>Filmweb&nbsp;<img id='ntw_fw_ok' class='nfw_button' src='"+chrome.extension.getURL("/ok.png")+"'>&nbsp;<img id='ntw_fw_wrong' class='nfw_button' src='"+chrome.extension.getURL("/wrong.png")+"'> </div>");
            destBox.find('#ntw_fw_ok').click(function(){
                reportWrong(idNetflix, 1, 'fw');
                destBox.find('#ntw_fw_report').remove();
            });
            destBox.find('#ntw_fw_wrong').click(function(){
                reportWrong(idNetflix, 0, 'fw');
                clearMap(idNetflix, "filmweb");
                destBox.find('#ntw_fw_report').remove();
            });
        }
    });

    readStore1 = "nflix_"+idNetflix;
    chrome.storage.local.get(readStore1, function(data) {
        var infoJSON = getInfo(data[readStore1]);
        destBox.append(" <a target='_blank' class='nfw_jaw_link link_"+readStore1+"' href='"+infoJSON.URL+"'>Nflix.pl&nbsp;<span class='title_"+readStore1+"'>"+infoJSON.score+"</span></a>&nbsp;<img src='"+chrome.extension.getURL("/star.png")+"'> ");
    });

    readStore2 = "metacritic_"+idNetflix;
    chrome.storage.local.get(readStore2, function(data) {
        var infoJSON = getInfo(data[readStore2]);
        var metacriticURL = infoJSON.URL;
        if(!metacriticURL) metacriticURL='http://www.metacritic.com/search/all/'+encodeURIComponent(titleName.replace("'"," "))+'/results?cats%5Bmovie%5D=1&cats%5Btv%5D=1&search_type=advanced';
        destBox.append(" <a target='_blank' class='nfw_jaw_link link_"+readStore2+"' href='"+metacriticURL+"'>Metacritic&nbsp;<span class='title_"+readStore2+"'>"+infoJSON.score+"</span></a>&nbsp;<img src='"+chrome.extension.getURL("/star.png")+"'> ");
        if(infoJSON.v!=1) destBox.find('#nfw_report').append("<div id='ntw_me_report'>Metacritic&nbsp;<img id='ntw_me_ok' class='nfw_button' src='"+chrome.extension.getURL("/ok.png")+"'>&nbsp;<img id='ntw_me_wrong' class='nfw_button' src='"+chrome.extension.getURL("/wrong.png")+"'> </div>");
            destBox.find('#ntw_me_ok').click(function(){
                reportWrong(idNetflix, 1, 'me');
                destBox.find('#ntw_me_report').remove();
            });
            destBox.find('#ntw_me_wrong').click(function(){
                reportWrong(idNetflix, 0, 'me');
                clearMap(idNetflix, "metacritic");
                destBox.find('#ntw_me_report').remove();
            });
    });

    readStore3 = "imdb_"+idNetflix;
    chrome.storage.local.get(readStore3, function(data) {
        var infoJSON = getInfo(data[readStore3]);
        var imdbURL = infoJSON.URL;
        if(!imdbURL) imdbURL='http://www.imdb.com/find?ref_=nv_sr_fn&s=all&q='+encodeURIComponent(titleName.replace("'"," "));
        destBox.append(" <a target='_blank' class='nfw_jaw_link link_"+readStore3+"' href='"+imdbURL+"'>IMDb&nbsp;<span class='title_"+readStore3+"'>"+infoJSON.score+"</span></a>&nbsp;<img src='"+chrome.extension.getURL("/star.png")+"'> ");
        if(infoJSON.v!=1) destBox.find('#nfw_report').append("<div id='ntw_im_report'>IMDb&nbsp;<img id='ntw_im_ok' class='nfw_button' src='"+chrome.extension.getURL("/ok.png")+"'>&nbsp;<img id='ntw_im_wrong' class='nfw_button' src='"+chrome.extension.getURL("/wrong.png")+"'> </div>");
            destBox.find('#ntw_im_ok').click(function(){
                reportWrong(idNetflix, 1, 'im');
                destBox.find('#ntw_im_report').remove();
            });
            destBox.find('#ntw_im_wrong').click(function(){
                reportWrong(idNetflix, 0, 'im');
                clearMap(idNetflix, "imdb");
                destBox.find('#ntw_im_report').remove();
            });
    });

}


chrome.storage.onChanged.addListener(function(changes, namespace) {
    titleName=score="";
    for (key in changes) {
        if(key!="scoreSource"){
            var storageChange = changes[key];
            idNetflix=key.replace(scoreSource+"_","");
            data=storageChange.newValue;

            if(key.match(scoreSource)){
                $(".title_"+idNetflix).each(function(){
                    $(this).html(getInfo(data).score);
                });
            }

            $(".title_"+key).each(function(){
                $(this).html(getInfo(data).score);
            });

            $(".link_"+key).each(function(){
                $(this).attr('href',getInfo(data).URL);
            });
    //        if(key=="scoreSource"){
    //            titleName = $(this).find('.video-preload-title-label:first').text()
    //            if(titleName) placeScore1(titleName, $(this));   
    //            alert(key+" "+score);
    //        }
        }
    }
});


var scoreSource='filmweb';
var readStore = "scoreSource";
chrome.storage.local.get(readStore, function(data) {
    if((data !== undefined) && (data[readStore] !== undefined)) scoreSource = data[readStore];
    $('.title-card').each(function(){
        titleName = $(this).find('.video-preload-title-label:first').text();

        if(titleName){
            idNetflix = $(this).find('a').attr('href').replace(/\/watch\/([0-9]*).*/,"$1");
            placeScore(titleName,idNetflix, $(this));
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
                $(this).find('.title-card-container').each(function(){
                    titleName = $(this).find('.video-preload-title-label:first').text();
                    idNetflix = $(this).find('a').attr('href').replace(/\/watch\/([0-9]*).*/,"$1");
                    if(idNetflix) {
                        placeScore(titleName,idNetflix, $(this));
                    }
                });
                    
//                if($(this).attr('class').match("bob-card")){
//                    idNetflix = $(this).find('a.bob-jaw-hitzone').attr('href').replace(/.*\/title\/([0-9]*).*/,"$1");
//                    if(idNetflix) placeScoreBob(idNetflix, $(this).find('.bob-title'));
//                }
//
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
 

