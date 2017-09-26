    
function click(e) {
    if(e.target.id == "reload") {
        chrome.storage.local.clear();
        chrome.tabs.reload();
    } else if(e.target.id == "logo") 
        chrome.tabs.create({url: "https://github.com/mrwrob/netfweb"});
    else{
        var save = {};
        save['scoreSource'] = e.target.id;
        chrome.storage.sync.set(save);
        chrome.tabs.reload();
    }
    window.close();
}

document.addEventListener('DOMContentLoaded', function () {
    var divs = document.querySelectorAll('div');
    for (var i = 0; i < divs.length; i++) {
        divs[i].addEventListener('click', click);
    }
});

var readStore = "scoreSource";
$('#filmweb').css('font-weight', 'bold');
chrome.storage.sync.get(readStore, function(data) {
    if(data === undefined || data[readStore] === undefined){
        $('#filmweb').css('font-weight', 'bold');
    } else{
        $('#filmweb').css('font-weight', 'none');
        $('#nflix').css('font-weight', 'none');
        $('#'+data[readStore]).css('font-weight', 'bold');
    }

});

