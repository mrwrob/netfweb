/* Handles popup menu */
function click(e) {
    if(e.target.id == "reload") {
        chrome.storage.local.clear();
        chrome.tabs.reload();
    } else if(e.target.id == "top")
        chrome.tabs.create({url: "top.html"});
    else if(e.target.id == "help")
        chrome.tabs.create({url: "info.html"});
    else if((e.target.id == "report") || (e.target.id == "report_strong")){
        chrome.runtime.sendMessage({type: "report_f", data: $('#data').html()});
    } else {
        if(!e.target.id.match(/.*check$/)) {
          var save = {};
          save['scoreSource'] = e.target.id;
          chrome.storage.local.set(save);
          chrome.tabs.reload();
        } else {
          var checked=0;
          if($('#'+e.target.id).prop('checked')) checked=1;
          var save = {};
          save['scoreChecked_'+e.target.id.replace(/_check/,"")] = {checked};
          chrome.storage.local.set(save);
        }
    }
    window.close();
}

/* Listens to popup menu */
document.addEventListener('DOMContentLoaded', function () {
    $('div').each(function(){
        $(this).on('click', click);
    });
});

var readStore = "scoreSource";
$('#tmdb').css('font-weight', 'bold');

/* Gets selected source website from storage */
chrome.storage.local.get(readStore, function(data) {
    if(data === undefined || data[readStore] === undefined){
        $('#tmdb').css('font-weight', 'bold');
    } else{
        $('#tmdb').css('font-weight', 'none');
        $('#'+data[readStore]).css('font-weight', 'bold');
    }
});

var servicesArray = ["tmdb", "imdb",  "rotten_tomatoes", "metacritic", "filmweb", "film_affinity"];

for(var service of servicesArray){
  chrome.storage.local.get("scoreChecked_"+service, function(data) {
      if(data !== undefined || data[readStore] !== undefined){
        var keyValue = Object.keys(data)[0];
        if(keyValue !== undefined){
          if(data[keyValue].checked == 0){
            $("#"+keyValue.replace(/scoreChecked_/,"")+"_check").prop('checked', false);
          }
        }
      }
  });
}

/* Gets selected source website from storage */
chrome.storage.local.get(readStore, function(data) {
    if(data === undefined || data[readStore] === undefined){
        $('#tmdb').css('font-weight', 'bold');
    } else{
        $('#tmdb').css('font-weight', 'none');
        $('#'+data[readStore]).css('font-weight', 'bold');
    }

});

/* Handles user mapping on filmweb, metacritic and imdb websites */
chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
    if(tabs[0].url.match('filmweb.pl|metacritic.com|imdb.com|themoviedb.org|rottentomatoes.com|filmaffinity.com')){
        var readStore = "clipboard";
        chrome.storage.local.get(readStore, function(data) {
            if(data && data['clipboard']){
                $('body').append("<div id='report'>Link this site with <br><strong id='report_strong'>"+data['clipboard'].title+"</strong></div>");
                $('#data').html(data['clipboard'].idNetflix+','+tabs[0].url);
                $('#report')[0].addEventListener('click', click);
            }
        });
    }
});
