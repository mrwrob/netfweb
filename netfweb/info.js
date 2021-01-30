var readStore1 = "colorsChecked";
var client_id_trakt_tv =      "ffa074e4f91501a4b287206468975d0044d696ae4ed537a43fffc9fd77ee4ec1";
var client_secret_trakt_tv =  "176342720e6f369570d90b08e2328ab2a9588e5ddcaff2765fc258494939aa9a";
var trakt_tv_token = "";

/* Gets selected source website from storage */
chrome.storage.local.get(readStore1, function(data) {
  if(data !== undefined || data[readStore1] !== undefined){
	if(data[readStore1]==0)  $("#colors_checkbox").prop('checked', false);
      }
});


var readStore = "scoreSource";

/* Gets selected source website from storage */
chrome.storage.local.get(readStore, function(data) {
  var mod=0;
  if(data !== undefined || data[readStore] !== undefined){
    var keyValue = Object.keys(data)[0];
    if(keyValue !== undefined){
      if(data[keyValue]){
        mod=1;
        $("#"+data[keyValue]+"_radio").prop('checked', true);
      }
    }
  }
});

$("#new_user").show();

var servicesArray = ["tmdb", "imdb",  "rotten_tomatoes", "metacritic", "filmweb", "film_affinity", "trakt_tv"];
var count=0;
for(var service of servicesArray){
  count++;
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

$("#save_default").click(function() {
   $("#new_user").hide();
   var save = {};
   save['scoreSource'] = $("input[name='default']:checked").attr('id').replace(/_radio/,"");
   chrome.storage.local.set(save);
   for(var service of servicesArray){
     var checked=0;
     if($('#'+service+"_check").prop('checked')) checked=1;
     var save = {};
     save['scoreChecked_'+service] = {checked};
     chrome.storage.local.set(save);
   }
     var save = {};
     if($('#colors_checkbox').prop('checked'))
         save['colorsChecked'] = 1;
     else save['colorsChecked'] = 0;
     chrome.storage.local.set(save);
});

$("#Trakt_TV_connect").click(function() {
  if($("#trakt_tv_code").val().length > 7){
    //Request a token
    document.cookie = 'SameSite=None; Secure';
    var request = new XMLHttpRequest();
    request.open('POST', 'https://api.trakt.tv/oauth/token');
    request.setRequestHeader('Content-Type', 'application/json');
    request.onreadystatechange = function () {
      if (this.readyState === 4) {
        in_json = JSON.parse(this.response);
        if(!in_json["error"] && in_json["access_token"])
        {
          //valid token
          var save = {};
          save['trakt_tv_token'] = this.response;
          chrome.storage.local.set(save);
          trakt_tv_token = in_json.access_token;
          chrome.runtime.sendMessage({type: "update_token"});
          $("#trakt_tv_code").css('background','green');

        }
      }
    };
    var body = {
      'code': $("#trakt_tv_code").val(),
      'client_id': client_id_trakt_tv,
      'client_secret': client_secret_trakt_tv,
      'redirect_uri': 'urn:ietf:wg:oauth:2.0:oob',
      'grant_type': 'authorization_code'
    };
    request.send(JSON.stringify(body));
  }else{
    //Gets code to requets a token
    var win = window.open('https://trakt.tv/oauth/authorize?client_id=' + client_id_trakt_tv + '&redirect_uri=urn%3Aietf%3Awg%3Aoauth%3A2.0%3Aoob&response_type=code', '_blank');
    win.focus();
  }
});

$("#Trakt_TV_get").click(function() {
  //Gets code to requets a token
  var win = window.open('https://trakt.tv/oauth/authorize?client_id=' + client_id_trakt_tv + '&redirect_uri=urn%3Aietf%3Awg%3Aoauth%3A2.0%3Aoob&response_type=code', '_blank');
  win.focus();
});


$("#config").click(function() {
   $("#new_user").show();
});