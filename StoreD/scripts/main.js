document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    
}
    
var airlinesApp = function(){}

airlinesApp.prototype = function() {
    var _login = false;
    
    run = function(){
        var that = this;
        $('#home').on('pagebeforecreate',$.proxy(_initHome,that));
    },
    
    
    _initHome = function(){      
    	$('#fflocation').text('Exchange Area');
        if (!_login) {
	    	$.mobile.changePage("#logon", { transition: "flip" });                             
	    }
    };
    
    return {
        run:run,
    };
    
/*    function myLogin(){
    app.logincheck($('#userName').val());
                app.refresh1();
	    		return false;
	}*/
}();