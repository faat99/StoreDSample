document.addEventListener("deviceready", init, false);
var app = {};
app.db = null;     

var storeObject = {TransportOrderID:''}
var driver = {};

function init() {
	app.openDb();
	app.createTable();
}

app.openDb = function() {
   if (window.navigator.simulator === true) {
        // For debugin in simulator fallback to native SQL Lite
        console.log("Use built in SQL Lite");
        app.db = window.openDatabase("tblApp", "1.0", "Cordova Demo", 200000);
    }
    else {
        app.db = window.sqlitePlugin.openDatabase("tblApp");
    }
}
     
app.createTable = function() {
	var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("CREATE TABLE IF NOT EXISTS tblApp(ID INTEGER PRIMARY KEY ASC, AssetID INTEGER, ClientLocationID INTEGER, ContentsDescription TEXT, ClientLocation TEXT, Status TEXT, CurrentLocation TEXT, CurrentLocationID INTEGER, AssetClientID INTEGER, TransportOrderAssetID INTEGER, TransportOrderID INTEGER, TargetLocation TEXT, TOAStatus TEXT, CompletionStamp DATETIME, ClientID INTEGER, CompletionTimeStamp DATETIME, TOStatus TEXT, DriverName TEXT, PlannedDate DATETIME, PlannedTimeStart DATETIME, PlannedTimeEnd DATETIME, Notes TEXT, Sequence INTEGER, DriverAppPW TEXT)", [], function() {alert("table created");app.insertJSON();}, app.onError);
	});
}

app.onError = function(tx, e) {
	console.log("Error: " + e.message);
} 

app.insertJSON = function(){
    $.getJSON('http://storedapp.fruitfulserver.com/AppJSONPage2Generator',
    function (data){          
        var db = app.db;            
            db.transaction(function(tx){
                $.each(data, function(key,item){  
                tx.executeSql("INSERT INTO tblApp(AssetID, ContentsDescription, ClientLocation, Status, ClientLocationID, CurrentLocation, CurrentLocationID, AssetClientID, TransportOrderAssetID, TransportOrderID, TargetLocation, TOAStatus, CompletionStamp, ClientID, CompletionTimeStamp, TOStatus, DriverName, PlannedDate, PlannedTimeStart, PlannedTimeEnd, Notes, Sequence, DriverAppPW) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
					  [item.AssetID, item.ContentsDescription, item.Expr1, item.Status, item.ClientLocationID, item.Expr2,  item.LocationID, item.AssetClientID, item.TransportOrderAssetID, item.TransportOrderID, item.LocationName, item.TOAStatus, item.CompletionStamp, item.ClientID, item.CompletionTimeStamp, item.TOStatus, item.DriverName, item.PlannedDate, item.PlannedTimeStart, item.PlannedTimeEnd, item.Notes, item.Sequence, item.DriverAppPW], [], function(tx,error){error.message;});
            });            
        });   
    });    
}

function selectPW(){
    var render = function (tx, rs){  
        alert("Starting render function");
        alert(rs);
        alert(rs.rows.length);
        var row = rs.rows.item(0); 
        
        alert(row);
        alert(row.DriverAppPW);
        
        var realpw = String(row.DriverAppPW); 
        
        alert(realpw);
		if (realpw === String($('#pwd').val())){
                $('#login').hide();
	    		_login = true;
	    		$('#ffname').text($('#userName').val());		
        		$.mobile.changePage('#home', { transition: 'flip' });
            }
        else{ alert('Invalid Login Credentials.'); }
        app.refresh1();        
    }
    
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("SELECT DriverAppPW FROM tblApp", [], 
					  function(tx,rs) {alert("Done"); render(tx,rs);}, 
					  app.onError);
	});     
}


app.logincheck = function(drivername){
    var render = function (tx, rs){  
        alert("Starting render function");
        alert(rs);
        alert(rs.rows.length);
        var row = rs.rows.item(0); 
        
        alert(row);
        alert(row.DriverAppPW);
        
        var realpw = String(row.DriverAppPW); 
        
        alert(realpw);
		if (realpw === String($('#pwd').val())){
                $('#login').hide();
	    		_login = true;
	    		$('#ffname').text($('#userName').val());		
        		$.mobile.changePage('#home', { transition: 'flip' });
            }
        else{ alert('Invalid Login Credentials.'); }
        app.refresh1();        
    }

    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("SELECT DriverAppPW FROM tblApp WHERE DriverName=?", [drivername], 
					  function(tx,rs) {alert(drivername);render(tx,rs);}, 
					  app.onError);
	});        
}

//Page1
app.refresh1 = function(){
    var driver = $('#userName').val();
    var planneddate = fnFormatDateTime(new Date());      
    
    var render = function (tx, rs){   
        var table = "<table id='page1table' class='zebra'><thead><tr><th></th><th></th><th>T/O ID</th><th>Planned Time Start</th><th>Planned Time End</th><th>Notes</th><th>T/O Status</th><th>Sequence</th><th>Completion Time Stamp</th><th>Client Address</th></tr></thead><tbody>";
        
        for (var i = 0; i < rs.rows.length; i++) {  
            var row = rs.rows.item(i);
            table += "<tr><td><a href='javascript:flip("+row.TransportOrderID+");' class='button-bevel black'>Details</a></td><td><a class='button-bevel black' href='javascript:failedTO("+row.TransportOrderID+");'>Fail</a></td><td>" + row.TransportOrderID + "</td><td>" + row.PlannedTimeStart + "</td><td>"  + row.PlannedTimeEnd + "</td><td>"  + row.Notes + "</td><td>"  + row.TOStatus + "</td><td>"  + row.Sequence + "</td><td>"  + row.CompletionTimeStamp + "</td><td>" + row.ClientLocation + "</td></tr>"; 
        }        
        table += "</tbody></table>";
        
        var todoItems = document.getElementById("content");
        todoItems.innerHTML = table;        
    }
    
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("SELECT DISTINCT TransportOrderID, ClientLocation, STRFTIME('%H:%M', PlannedTimeStart) AS PlannedTimeStart, STRFTIME('%H:%M', PlannedTimeEnd) AS PlannedTimeEnd, Notes, TOStatus, Sequence, CompletionTimeStamp, STRFTIME('%m/%d/%Y', PlannedDate) AS PlannedDate FROM tblApp WHERE (DriverName=? AND PlannedDate=?) ORDER by Sequence ASC", [driver,planneddate],
					  render, 
					  app.onError);
	}); 
}

function flip(toid){    
    storeObject.TransportOrderID = toid;
    app.refresh2(storeObject.TransportOrderID);
    $.mobile.changePage('#assets', {transition: 'flip'} );
}

function failedTO(toid) {	
    var render = function (tx, rs){
        var row = rs.rows.item(0); 
        app.failedTO2(toid, row.PlannedDate, row.Sequence, row.DriverName, row.TOStatus);
    }    
    
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("SELECT PlannedDate, Sequence, DriverName, TOStatus FROM tblApp WHERE TransportOrderID=?", [toid], 
					  render, 
					  app.onError);
	});      
}

app.failedTO2 = function(toid, planneddate, sequence, drivername, tostatus){    
	if(tostatus === null)
    {   
        var render = function (tx, rs){
            var row = rs.rows.item(0)["MAX(Sequence)"];
            app.failedTO3(toid, row+1);
        }  
    
        var db = app.db;
        db.transaction(function(tx) {
            tx.executeSql("SELECT MAX(Sequence) FROM tblApp WHERE (DriverName=? AND PlannedDate=?)", [drivername, planneddate],
    					  render,
    					  app.onError);
        });
    }    
    else if (tostatus === 'Failedx1')
    {
        var db = app.db;
        db.transaction(function(tx) {
        tx.executeSql("UPDATE tblApp SET TOStatus='Failedx2' WHERE TransportOrderID=?", [toid],
					  app.onSuccess1,
					  app.onError);
        });  
    } 
}

app.failedTO3 = function(toid, newsequence){    
    var db = app.db;
    db.transaction(function(tx) {
        tx.executeSql("UPDATE tblApp SET Sequence=?, TOStatus='Failedx1' WHERE TransportOrderID=?", [newsequence, toid],
					  app.onSuccess1,
					  app.onError);
    });    
}

app.onSuccess1 = function(tx, r) {
    app.refresh1();    
}
app.onSuccess2 = function(tx, r) {
    app.refresh2(storeObject.TransportOrderID);    
}

//Page2 
app.refresh2 = function(toid){    
    var render = function (tx, rs){   
        var table = "<table id='page2table' class='zebra'><thead><tr><th></th><th>Asset ID</th><th>Target Location</th><th>TOA Status</th><th>Completion Stamp</th><th>Contents Description</th><th>Current Location</th></tr></thead><tbody>";
        
        for (var i = 0; i < rs.rows.length; i++) {
            var row = rs.rows.item(i);
            table += "<tr><td><a class='button-bevel black' href='javascript:check("+row.TransportOrderAssetID+","+row.ClientID+");'>Check</a></td><td>" + row.AssetID + "</td><td>" + row.TargetLocation + "</td><td>"  + row.TOAStatus + "</td><td>"  + row.CompletionStamp + "</td><td>"+row.ContentsDescription+"</td><td>" + row.CurrentLocation +"</td></tr>"; 
        }        
        table += "</tbody></table>";
        
        var todoItems = document.getElementById("content2");
        todoItems.innerHTML = table;        
    }
    
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("SELECT DISTINCT TransportOrderAssetID, ClientID, AssetID, TargetLocation, TOAStatus, CompletionStamp, CurrentLocation from tblApp WHERE TransportOrderID=? ORDER BY AssetID ASC", [toid],
					  render, 
					  app.onError);
	}); 
}

function check(toaid,clientid){
    var render = function (tx, rs){             
        var row = rs.rows.item(0);
        if (row.Status='Done')
        {check2(toaid,1,clientid);}
        else
        {check2(toaid,0,clientid);}                       
    }    
    
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("SELECT Status FROM tblApp WHERE TransportOrderAssetID=?", [toaid],
					  render, 
					  app.onError);
	}); 
}

function check2(toaid,number,clientid){
    if (number=1)
    {
        var db = app.db;
		db.transaction(function(tx) {
		tx.executeSql("UPDATE tblApp SET Status='In transition', TOAStatus='Coming Back' WHERE TransportOrderAssetID=?", [toaid],
					  app.onSuccess2, 
					  app.onError);
        });
    }
    else if (number=0)
    {
        var db = app.db;
		db.transaction(function(tx) {
		tx.executeSql("UPDATE tblApp SET TOStatus='Client Served', Status='Done', TOAStatus='Finished', AssetClientID=?, CompletionStamp=DATETIME() WHERE TransportOrderAssetID=?", [clientid,toaid],
					  app.onSuccess2, 
					  app.onError);
		}); 
    }
}

function calculate(){
	var driver = $('#userName').val();
    var planneddate = fnFormatDateTime(new Date());  	
    
    var render = function (tx, rs){     
        for (var i = 0; i < rs.rows.length; i++) {  
            var row = rs.rows.item(i);
            calculate2(row.TransportOrderID);
        }              
    }
    
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("SELECT DISTINCT TransportOrderID FROM tblApp WHERE (DriverName=? AND PlannedDate=?)", [driver,planneddate],
					  render, 
					  app.onError);
	});      
}

function calculate2(toid){    
    var render = function (tx, rs){
        if (rs.rows.length>0){
            incomplete(toid);
        }
        else { 
            complete(toid);
        }
    }
    
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("SELECT TOAStatus FROM tblApp WHERE (TransportOrderID=? AND TOAStatus<>'Finished')", [toid],
					  render, 
					  app.onError);
	});       
} 

function incomplete(toid){    
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("UPDATE tblApp SET TOStatus='Incomplete', CompletionTimeStamp=DATETIME() WHERE TransportOrderID=?", [toid],
					  app.onSuccess1, 
					  app.onError);
	});       
} 

function complete(toid){
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("UPDATE tblApp SET TOStatus='Complete', CompletionTimeStamp=DATETIME() WHERE TransportOrderID=?", [toid],
					  app.onSuccess1, 
					  app.onError);
	});           
}

function locationsynchronise(){
    var driver = $('#userName').val();
    var planneddate = fnFormatDateTime(new Date());  
    
    var render = function (tx, rs){
        if (rs.rows.length>0){            	
    		locationsynchronise1(1);
        }
        else {             	
    		locationsynchronise1(0);
        }
    }
    
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("SELECT TOStatus FROM tblApp WHERE (DriverName=? AND PlannedDate=? AND TOStatus<>null)", [driver,planneddate],
					  render, 
					  app.onError);
	});
}

function locationsynchronise1(tocount){    
    var driver = $('#userName').val();
    var planneddate = fnFormatDateTime(new Date());  
    
    var render = function (tx,rs){
        if (rs.rows.item(0)["CurrentLocation"]==='Exchange Area'&&tocount===0){ 
            var render = function (tx, rs){$('#fflocation').text('Van'); app.onSuccess2();}        
            var db = app.db;
        	db.transaction(function(tx) {
        		tx.executeSql("UPDATE tblApp SET TOAStatus='Going Out', CurrentLocationID=2, CurrentLocation='Van' WHERE (DriverName=? AND PlannedDate=? AND Status<>'Done')", [driver,planneddate],
        					  render, 
        					  app.onError);
        	});         
        }
        else
        {
            app.journeychecker();
        }
    }   
    
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("SELECT CurrentLocation FROM tblApp WHERE (DriverName=? AND PlannedDate=? AND Status<>'Done')", [driver,planneddate],
					  render, 
					  app.onError);
	});   
}

app.journeychecker = function(){
    var driver = $('#userName').val();
    var planneddate = fnFormatDateTime(new Date());  
    
    var render = function (tx, rs){
        if (!(rs.rows.item(0)["MIN(Sequence)"]===null)){
        	app.journeychecker2(rs.rows.item(0)["MIN(Sequence)"]);
        }        
        else {
            var db = app.db;
    		db.transaction(function(tx) {
    		tx.executeSql("UPDATE tblApp SET CurrentLocation = 'Exchange Area', CurrentLocationID=1 WHERE (DriverName=? AND PlannedDate=? AND Status<>'Done')", [driver,planneddate],
					  function(){app.onSuccess2(); $('#fflocation').text('Exchange Area');}, 
					  app.onError);
			});
        }
    }
    
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("SELECT MIN(Sequence) FROM tblApp WHERE (DriverName=? AND PlannedDate=? AND ([TOStatus] IS NULL OR [TOStatus] ='Failedx1'))", [driver,planneddate],
					  render, 
					  app.onError);
	});    
}

app.journeychecker2 = function(minsequence){
    var driver = $('#userName').val();
    var planneddate = fnFormatDateTime(new Date());  
    
    var render = function (tx, rs){
        app.journeychecker3(rs.rows.item(0)["ClientLocation"],rs.rows.item(0)["ClientLocationID"]);
    }
    
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("SELECT ClientLocation,CurrentLocationID FROM tblApp WHERE (DriverName=? AND PlannedDate=? AND Sequence=?)", [driver,planneddate,minsequence],
					  render, 
					  app.onError);
	}); 
}

app.journeychecker3 = function(nextlocation,nextlocationid){
    var driver = $('#userName').val();
    var planneddate = fnFormatDateTime(new Date()); 
    
    var render = function (tx, rs){
        app.onSuccess2();
        $('#fflocation').text(nextlocation); 
    }
    
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("UPDATE tblApp SET CurrentLocation=?, CurrentLocationID=? WHERE (DriverName=? AND PlannedDate=? AND Status<>'Done')", [nextlocation,nextlocationid,driver,planneddate],
					  render, 
					  app.onError);
	}); 
}

//Return value
app.synchronisation = function(){
   var render = function (tx, rs){                
        for (var i = 0; i < rs.rows.length; i++) {            
            var row = rs.rows.item(i);            
            var A = row.TransportOrderAssetID;            
            var B = row.TOAStatus;
            var C = row.CompletionStamp;            
            $('#content3').load('http://storedapp.fruitfulserver.com/appjsonpage1receptor?TransportOrderAssetID='+A+'&TOAStatus='+B+'&CompletionStamp='+C);
            var D = row.ContentsDescription;
            var E = row.Status;
            var F = row.CurrentLocationID;
            var G = row.AssetClientID;   
			var H = row.AssetID;         
            $('#content4').load('http://storedapp.fruitfulserver.com/appjsonpage1receptor2?AssetID='+H+'&ContentsDescription='+D+'&Status='+E+'&CurrentLocationID='+F+'&AssetClientID='+G);
            var I = row.CompletionTimeStamp;
            var J = row.TOStatus;
            var K = row.Sequence;
            var L = row.TransportOrderID;
            $('#content5').load('http://storedapp.fruitfulserver.com/appjsonpage1receptor3?TransportOrderID='+L+'&CompletionTimeStamp='+I+'&TOStatus='+J+'&Sequence='+K);
        }         
    }
    
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("SELECT * FROM tblApp", [], 
					  render, 
					  app.onError);
	});   
}
