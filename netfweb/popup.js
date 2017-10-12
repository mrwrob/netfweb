    
function click(e) {
    if(e.target.id == "reload") {
        chrome.storage.local.clear();
        chrome.tabs.reload();
    } else if(e.target.id == "logo") 
        chrome.tabs.create({url: "https://github.com/mrwrob/netfweb"});
    else if(e.target.id == "help") 
        chrome.tabs.create({url: "info.html"});
    else if((e.target.id == "report") || (e.target.id == "report_strong")){
        chrome.runtime.sendMessage({type: "report_f", data: $('#data').html()});
        var save = {};
        save['clipboard'] = "";
        chrome.storage.local.set(save);
    } else {
        var save = {};
        save['scoreSource'] = e.target.id;
        chrome.storage.local.set(save);
        chrome.tabs.reload();
    }
    window.close();
}

document.addEventListener('DOMContentLoaded', function () {
    $('div').each(function(){
        $(this).on('click', click);
    });
});

var readStore = "scoreSource";
$('#filmweb').css('font-weight', 'bold');
chrome.storage.local.get(readStore, function(data) {
    if(data === undefined || data[readStore] === undefined){
        $('#filmweb').css('font-weight', 'bold');
    } else{
        $('#filmweb').css('font-weight', 'none');
        $('#nflix').css('font-weight', 'none');
        $('#'+data[readStore]).css('font-weight', 'bold');
    }

});

chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
    if(tabs[0].url.match('filmweb.pl')){
        var readStore = "clipboard";
        chrome.storage.local.get(readStore, function(data) {
            if(data && data['clipboard']){
                $('body').append("<div id='report'>Link this site with <br><strong id='report_strong'>"+data['clipboard'].title+"</strong></div>");
                $('#data').html('"'+data['clipboard'].idNetflix+'": "'+tabs[0].url+'",');
                $('#report')[0].addEventListener('click', click);
            }
        });
    }
 
});
