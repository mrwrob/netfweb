    
function click(e) {
    var save = {};
    save['scoreSource'] = e.target.id;
    chrome.storage.sync.set(save);
    chrome.storage.local.clear();
    chrome.tabs.reload();
    window.close();
}

document.addEventListener('DOMContentLoaded', function () {
    var divs = document.querySelectorAll('div');
    for (var i = 0; i < divs.length; i++) {
        divs[i].addEventListener('click', click);
    }
});

var readStore = "scoreSource";
chrome.storage.sync.get(readStore, function(data) {
    if(data[readStore] === undefined){
        $('#nflix').css('font-weight', 'bold');
    } else{
        $('#'+data[readStore]).css('font-weight', 'bold');
    }

});

