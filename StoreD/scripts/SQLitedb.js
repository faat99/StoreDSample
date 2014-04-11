document.addEventListener("deviceready", init, false);
var app = {};
app.db = null;     
app.db2 = null;
app.db3 = null;
app.db_drivers = null;

var storeObject = {TransportOrderID:''}
var driver = {};
var version = 4;

function init() {
	app.openDb();
	app.versioncheck();
}

//database
app.openDb = function() {
   if (window.navigator.simulator === true) {
        // For debugin in simulator fallback to native SQL Lite
        console.log("Use built in SQL Lite");
        app.db = window.openDatabase("tblApp", "1.0", "STORED", 200000);
        app.db2 = window.openDatabase("tblAppVersion", "1.0", "STORED", 200000);  
        app.db3 = window.openDatabase("tblAppLocation", "1.0", "STORED", 200000);          
        app.db_drivers = window.openDatabase("tblDrivers", "1.0", "STORED", 200000);          
    }
    else {
        app.db = window.sqlitePlugin.openDatabase("tblApp", "1.0", "STORED", 200000);
        app.db2 = window.sqlitePlugin.openDatabase("tblAppVersion", "1.0", "STORED", 200000);
        app.db3 = window.sqlitePlugin.openDatabase("tblAppLocation", "1.0", "STORED", 200000);
        app.db_drivers = window.sqlitePlugin.openDatabase("tblDrivers", "1.0", "STORED", 200000);
    }
}

app.versioncheck = function() {    
	var db = app.db2;
	db.transaction(function(tx) {        
		tx.executeSql("CREATE TABLE IF NOT EXISTS tblAppVersion (ID INTEGER PRIMARY KEY ASC, VersionNumber INTEGER, CreationDate DATE)", [], app.transitionalstep, function(tx,e){alert('tblAppVersion create: '+ e.message);});	

    });    
}

app.transitionalstep = function(){
    var db = app.db2;
	db.transaction(function(tx) { 
		tx.executeSql("SELECT VersionNumber FROM tblAppVersion ORDER BY ID DESC", [], render, function(tx,e){alert('tblAppVersion select: '+ e.message);});	
    });
    
    var render = function(tx,rs){        
        if (rs.rows.length > 0) 
        {
           //read latest version and udpate
            app.CheckDropTable(rs.rows.item(0)["VersionNumber"]);
        }
        else
        {     
           //first time app user, no version, insert version number
 		  app.addversion(); 
        }        
    }    
}

app.addversion = function(){
    var db = app.db2;
	db.transaction(function(tx) {        
		tx.executeSql("INSERT INTO tblAppVersion (VersionNumber, CreationDate)  VALUES (1, DATETIME())", [], app.versioncheck, function(tx,e){alert('tblAppVersion add: '+ e.message);});	
    }); 
}

app.CheckDropTable = function(latestversion){
    if(latestversion < version){
        //alert('drop table');
        app.dropAppTable();
        app.dropLocationTable();
        app.dropDriverTable();
    }
    else{                
        //normal operation
        app.createtblApp();
        app.createtblAppLocation();
    	app.createtblDrivers();
    }    
}   

app.dropAppTable = function(){
    var db = app.db;
    db.transaction(function(tx){
        tx.executeSql("DROP TABLE IF EXISTS tblApp", [], app.createtblApp, function(tx,e){alert('tblAppVersion drop: '+ e.message);});    
    }); 
}

app.dropLocationTable = function(){
    var db = app.db3;
    db.transaction(function(tx){
        tx.executeSql("DROP TABLE IF EXISTS tblAppLocation", [], app.createtblAppLocation, function(tx,e){alert('tblLocation drop: '+ e.message);});    
    }
    );     
}

app.dropDriverTable = function(){
    var db = app.db_drivers;
    db.transaction(function(tx){
        tx.executeSql("DROP TABLE IF EXISTS tblDrivers", [], app.createtblDrivers, function(tx,e){alert('tblDrivers drop: '+ e.message);});    
    }
    );     
}

app.createtblApp = function() {
	var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("CREATE TABLE IF NOT EXISTS tblApp (ID INTEGER PRIMARY KEY ASC, City TEXT, ClientName TEXT, ClientEmail TEXT, ClientContactNumber TEXT, PostCode TEXT, Title TEXT, Barcode INTEGER, AssetType TEXT, AssetID INTEGER, ClientLocationID INTEGER, ContentsDescription TEXT, ClientLocation TEXT, Status TEXT, CurrentLocation TEXT, CurrentLocationID INTEGER, AssetClientID INTEGER, TransportOrderAssetID INTEGER, TransportOrderID INTEGER, TargetLocation TEXT, TOAStatus TEXT, CompletionStamp DATETIME, ClientID INTEGER, CompletionTimeStamp DATETIME, TOStatus TEXT, DriverName TEXT, PlannedDate DATETIME, PlannedTimeStart DATETIME, PlannedTimeEnd DATETIME, Notes TEXT, Sequence INTEGER, DriverAppPW TEXT, Destination TEXT)", [], 
        app.tblAppinsertJSON, function(tx,e){alert('tblApp create: '+ e.message);});
	});
}

app.tblAppinsertJSON = function(){    
    $.getJSON('http://storedapp.fruitfulserver.com/AppJSONPage2Generator').done(function(data){
        var db = app.db;           
        db.transaction(function(tx) {   
                tx.executeSql("DELETE FROM tblApp", [], [], app.onError);
                $.each(data, function(key,item) {   
                 tx.executeSql("INSERT INTO tblApp (City, ClientName, ClientEmail, ClientContactNumber, PostCode, Title, Barcode, AssetType, Destination, AssetID, ContentsDescription, ClientLocation, Status, ClientLocationID, CurrentLocation, CurrentLocationID, AssetClientID, TransportOrderAssetID, TransportOrderID, TargetLocation, TOAStatus, CompletionStamp, ClientID, CompletionTimeStamp, TOStatus, DriverName, PlannedDate, PlannedTimeStart, PlannedTimeEnd, Notes, Sequence, DriverAppPW) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
					  [item.City, item.ClientName, item.ClientEmail, item.ClientContactNumber, item.PostCode, item.Title, item.Barcode, item.AssetType, item.Destination, item.AssetID, item.ContentsDescription, item.ClientLocation, item.Status, item.ClientLocationID, item.Expr2,  item.CurrentLocationID, item.AssetClientID, item.TransportOrderAssetID, item.TransportOrderID, item.LocationName, item.TOAStatus, item.CompletionStamp, item.ClientID, item.CompletionTimeStamp, item.TOStatus, item.DriverName, item.PlannedDate, item.PlannedTimeStart, item.PlannedTimeEnd, item.Notes, item.Sequence, item.DriverAppPW], 
                    app.clearnull, function(tx,e){alert('tblApp JSON insert: '+ e.message);});
            });            
        });   
    }).fail(function(){alert('tblApp cannot insert JSON.');})    
}

app.clearnull = function(){  
    var db = app.db;
	db.transaction(function(tx) {
        //inner page
		tx.executeSql("UPDATE tblApp SET ContentsDescription='' WHERE (ContentsDescription = 'null' OR ContentsDescription IS NULL)", [], [], app.onError);					  
        tx.executeSql("UPDATE tblApp SET CompletionStamp='' WHERE (CompletionStamp ='null' OR CompletionStamp IS NULL)", [], [], app.onError);
        tx.executeSql("UPDATE tblApp SET AssetClientID='' WHERE (AssetClientID = 'null' OR AssetClientID IS NULL)", [], [], app.onError);
        
        //home page 
        tx.executeSql("UPDATE tblApp SET Notes='' WHERE (Notes = 'null' OR Notes IS NULL)", [], [], app.onError);
        tx.executeSql("UPDATE tblApp SET TOStatus='' WHERE (TOStatus = 'null' OR TOStatus IS NULL)", [], [], app.onError);
        tx.executeSql("UPDATE tblApp SET CompletionTimeStamp='' WHERE (CompletionTimeStamp ='null' OR CompletionTimeStamp IS NULL)", [], [], app.onError);
        tx.executeSql("UPDATE tblApp SET PostCode='' WHERE (PostCode = 'null' OR PostCode IS NULL)", [], app.refresh1, app.onError);          
	});    
}

app.createtblAppLocation = function(){
    var db = app.db3;
	db.transaction(function(tx) {        
		tx.executeSql("CREATE TABLE IF NOT EXISTS tblAppLocation (ID INTEGER PRIMARY KEY ASC, LocationID INTEGER, LocationClientID INTEGER)", [], 
        app.tblLocationinsertJSON, function(tx,e){alert('tblAppLocation create: '+ e.message);});	
    });      
}

app.tblLocationinsertJSON = function(){        
    $.getJSON('http://storedapp.fruitfulserver.com/AppJSONPage1Generator99').done(function(data){
        var db = app.db3;           
        db.transaction(function(tx) {   
                tx.executeSql("DELETE FROM tblAppLocation", [], [], app.onError);
                $.each(data, function(key,item) {   
                 tx.executeSql("INSERT INTO tblAppLocation (LocationID, LocationClientID) VALUES (?,?)",
					  [item.LocationID, item.LocationClientID], [], function(tx,e){alert('tblAppLocation JSON insert: '+ e.message);});
            });            
        });   
    }).fail(function(){alert('Location cannot insert JSON.');})    
}

app.createtblDrivers = function() {    
	var db = app.db_drivers;
	db.transaction(function(tx) {        
		tx.executeSql("CREATE TABLE IF NOT EXISTS tblDrivers (ID INTEGER PRIMARY KEY ASC, DriverAppPW TEXT, DriverAppID TEXT)", [], 
        app.InsertDriverJSON, function(tx,e){alert('tblDrivers create: '+ e.message);});	
    });    
}

app.InsertDriverJSON = function(){        
    $.getJSON('http://storedapp.fruitfulserver.com/GetDriverTableAsJSON').done(function(data){
        var db = app.db_drivers;           
        db.transaction(function(tx) {
            tx.executeSql("DELETE FROM tblDrivers;", [], [], app.onError);            
            $.each(data, function(key,item) {   
             tx.executeSql("INSERT INTO tblDrivers (DriverAppPW, DriverAppID) VALUES (?,?)", [item.DriverAppPW, item.DriverAppID], [], function(tx,e){alert('tblDrivers JSON insert: '+ e.message);});
            });            
        });   
    }).fail(function(){alert('Driver cannot insert JSON.');})    
}

//login & logout
function login(){   
    var db = app.db_drivers;
	db.transaction(function(tx) {
		tx.executeSql("SELECT DriverAppPW FROM tblDrivers WHERE DriverAppID=?", [$('#userName').val()], render, app.onError);
	});        
    
    var render = function (tx, rs){          
        var row = rs.rows.item(0); 
        var realpw = String(row.DriverAppPW); 
		if (realpw === String($('#pwd').val())){
                $('#login').hide();
	    		_login = true;
	    		$('#ffname').text($('#userName').val());		
        		$.mobile.changePage('#home', { transition: 'flip' });
            }
        else{ alert('Invalid Login Credentials.'); }
        app.refresh1();        
    }
}

function logout(){    
    $.mobile.changePage('#logon', { transition: 'flip' });
    _login = false;
    document.getElementById('pwd').value = '';    
}

//home page, load page, TOA page, unload page
app.refresh1 = function(){
    var driver = $('#userName').val();
    var planneddate = fnFormatDateTime(new Date()); 
    
    var db = app.db;
	db.transaction(function(tx) {
        var sqlString = "SELECT DISTINCT TransportOrderID, ClientLocation, PostCode, STRFTIME('%H:%M', PlannedTimeStart) AS PlannedTimeStart, STRFTIME('%H:%M', PlannedTimeEnd) AS PlannedTimeEnd, Notes, TOStatus, Sequence, CompletionTimeStamp, STRFTIME('%m/%d/%Y', PlannedDate) AS PlannedDate FROM tblApp WHERE (DriverName=? AND PlannedDate=?) ORDER by Sequence ASC";
        tx.executeSql(sqlString, [driver,planneddate], render, function(tx,e){alert('refresh1 error: '+ e.message);});	 
	});     
    
    var render = function (tx, rs){         
        table = "<table id='hometable' class='zebra'><thead><tr><th>Details</th><th>Fail</th><th>T/O ID</th><th>Planned Time Start</th><th>Planned Time End</th><th>Notes</th><th>T/O Status</th><th>Sequence</th><th>T/O Stamp</th><th>PostCode</th></tr></thead><tbody>";
        
        for (var i = 0; i < rs.rows.length; i++) {  
            var row = rs.rows.item(i);
            table += "<tr><td><a href='javascript:gotoAssetpage("+row.TransportOrderID+");'><img src='images/B.png'/></a></td><td><a href='javascript:failTO("+row.TransportOrderID+");'><img src='images/FAIL.png'/></a></td><td>" +row.TransportOrderID+ "</td><td>" +row.PlannedTimeStart+ "</td><td>"  +row.PlannedTimeEnd+ "</td><td>"  +row.Notes+ "</td><td>"  +row.TOStatus+ "</td><td>"  +row.Sequence+ "</td><td>"  + row.CompletionTimeStamp + "</td><td>" + row.PostCode + "</td></tr>"; 
        }  
        
        table += "</tbody></table>";
        
        var todoItems = document.getElementById("content");
        todoItems.innerHTML = table;        
    }
}

app.refresh2 = function(toid){    
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("SELECT DISTINCT TransportOrderAssetID, ClientID, AssetID, AssetType, TargetLocation, TOAStatus, CompletionStamp, Status, CurrentLocation, ContentsDescription, Barcode, Destination from tblApp WHERE TransportOrderID=? ORDER BY AssetID ASC", [toid],
					  render, function(tx,e){alert('refresh2 error: '+ e.message);});
	}); 
    
    var render = function (tx, rs){   
        var table = "<table id='page2table' class='zebra'><thead><tr><th>Next Action</th><th>Used?</th><th>Unused?</th><th>Asset Barcode</th><th>Asset Type</th><th>Target Location</th><th>Contents Description</th></tr></thead><tbody>";
        
        for (var i = 0; i < rs.rows.length; i++) {
            var row = rs.rows.item(i);
            table += "<tr><td>"  + row.Destination + "</td><td><a href='javascript: used("+row.TransportOrderAssetID+","+row.ClientID+");'><img src='images/YES.png'/></a></td><td><a href='javascript: unused("+row.TransportOrderAssetID+");'><img src='images/NO.png'/></a><td>" + row.Barcode+"</td><td>" + row.AssetType+"</td><td>" + row.TargetLocation + "</td><td>"+row.ContentsDescription+"</td></tr>"; 
        }
        
        table += "</tbody></table>";
        
        var todoItems = document.getElementById("content2");
        todoItems.innerHTML = table; 
        app.refresh2header(toid);
    }   
}

app.refresh2header = function(toid){
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("SELECT ClientName, ClientLocation, ClientEmail, ClientContactNumber, PostCode, Title, City from tblApp WHERE TransportOrderID=?", [toid],
					  render, function(tx,e){alert('refresh2header error: '+ e.message);});
	}); 
    
    var render = function(tx,rs){
        var table = "<table id='page2table' class='zebra'><thead><tr><th>Transport Order "+toid+" Client Information </th></tr></thead><tbody>";        
        var row = rs.rows.item(0);
        table += "<tr><td>Title: "+row.Title+"; Name: "+row.ClientName+"; Email: "+row.ClientEmail+"; Number: "+row.ClientContactNumber+"; Address: "+ row.ClientLocation + "; City: "+row.City+"; Postcode: "+row.PostCode+"</td></tr>"; 
        table += "</tbody></table>";
        var todoItems = document.getElementById("content999");
        todoItems.innerHTML = table;          
    }
}

app.refresh3 = function(){        
    var driver = $('#userName').val();
    var planneddate = fnFormatDateTime(new Date()); 
    
    var db = app.db;
    	db.transaction(function(tx) {
    		tx.executeSql("SELECT DISTINCT TransportOrderAssetID, TransportOrderID, ClientID, Barcode, AssetType, AssetID, TargetLocation, TOAStatus, CompletionStamp, CurrentLocation, ContentsDescription, Destination from tblApp WHERE (DriverName=? AND PlannedDate=? AND Status<>'Done' AND TOStatus<>'Cancelled') ORDER BY TransportOrderID ASC", [driver,planneddate],
    					  render, function(tx,e){alert('refresh3 error: '+ e.message);});
    	});    
    
    var render = function (tx, rs){   
        var table = "<table id='page2table' class='zebra'><thead><tr><th></th><th>T/O ID</th><th>Asset Barcode</th><th>Asset Type</th><th>Contents Description</th><th>Current Location</th></tr></thead><tbody>";
        $('#ffname11').text(rs.rows.length);	
        
        for (var i = 0; i < rs.rows.length; i++) {
            var row = rs.rows.item(i);
            table += "<tr><td><a href='javascript: load("+row.TransportOrderAssetID+");'><img src='images/Up.png'/></a></td><td>" + row.TransportOrderID + "</td><td>" + row.Barcode + "</td><td>" + row.AssetType + "</td><td>"+row.ContentsDescription+"</td><td>" + row.CurrentLocation +"</td></tr>"; 
        }        
        table += "</tbody></table>";
        
        var todoItems = document.getElementById("loaddd");
        todoItems.innerHTML = table;        
    }
}

app.refresh4 = function(){    
    var driver = $('#userName').val();
    var planneddate = fnFormatDateTime(new Date()); 
    
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("SELECT DISTINCT TransportOrderAssetID, TransportOrderID, ClientID, Barcode, AssetType, AssetID, TargetLocation, TOAStatus, CompletionStamp, CurrentLocation, ContentsDescription, Destination from tblApp WHERE (DriverName=? AND PlannedDate=? AND CurrentLocation='Exchange Area') ORDER BY TransportOrderID ASC", [driver,planneddate],
					  render, 
					  function(tx,e){alert('refresh4 error: '+ e.message);});
	}); 
    
    var render = function (tx, rs){   
        var table = "<table id='page2table' class='zebra'><thead><tr><th></th><th>T/O ID</th><th>Asset Barcode</th><th>Asset Type</th><th>Contents Description</th><th>Asset Status</th></tr></thead><tbody>";
        $('#ffname111').text(rs.rows.length);
        
        for (var i = 0; i < rs.rows.length; i++) {
            var row = rs.rows.item(i);
            table += "<tr><td><a href='javascript: unload("+row.TransportOrderAssetID+");'><img src='images/Down.png'/></a></td><td>" + row.TransportOrderID + "</td><td>" + row.Barcode + "</td><td>" + row.AssetType + "</td><td>"+row.ContentsDescription+"</td><td>" + row.Destination +"</td></tr>"; 
        }        
        table += "</tbody></table>";
        
        var todoItems = document.getElementById("unloaddd");
        todoItems.innerHTML = table;        
    }
}

//home page function
function gotoAssetpage(toid){    
    storeObject.TransportOrderID = toid;
    app.refresh2(storeObject.TransportOrderID);
    $.mobile.changePage('#assets', {transition: 'flip'} );
}

function gotoLoadPage(){
    app.refresh3();
    $.mobile.changePage('#load', { transition: 'flip' }); 
}

function gotoUnloadPage(){
    app.refresh4();
    $.mobile.changePage('#unload', { transition: 'flip' }); 
}

function failTO(toid) {
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("SELECT PlannedDate, Sequence, DriverName, TOStatus FROM tblApp WHERE TransportOrderID=?", [toid], 
					  render, 
					  app.onError);
	}); 
    
    var render = function (tx, rs){
        var row = rs.rows.item(0); 
        app.failedTO2(toid, row.PlannedDate, row.Sequence, row.DriverName, row.TOStatus);
    }      
}

app.failedTO2 = function(toid, planneddate, sequence, drivername, tostatus){ 
    var db = app.db;
	if(tostatus === null || tostatus === '')
    {           
        db.transaction(function(tx) {
            tx.executeSql("SELECT MAX(Sequence) FROM tblApp WHERE (DriverName=? AND PlannedDate=?)", [drivername, planneddate], render, app.onError);
        });
        
        var render = function(tx, rs) {
            var maxsequence = rs.rows.item(0)["MAX(Sequence)"];
            app.failedTO3(toid, maxsequence+1);
        }      
    }    
    else if (tostatus === 'Failedx1')
    {   
        db.transaction(function(tx) {
        tx.executeSql("UPDATE tblApp SET TOAStatus = 'Done', TOStatus='Failedx2' WHERE TransportOrderID=?", [toid],
					  app.refresh1,
					  app.onError);
        });  
    } 
}

app.failedTO3 = function(toid, newsequence){    
    var db = app.db;
    db.transaction(function(tx) {
        tx.executeSql("UPDATE tblApp SET Sequence=?, TOStatus='Failedx1' WHERE TransportOrderID=?", [newsequence, toid],
					  app.refresh1,
					  app.onError);
    });    
}

app.nextlocationcalculator = function(){
    var driver = $('#userName').val();
    var planneddate = fnFormatDateTime(new Date());  
    
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("SELECT MIN(Sequence) FROM tblApp WHERE (DriverName=? AND PlannedDate=? AND ([TOStatus] IS NULL OR [TOStatus] ='Failedx1' OR [TOStatus] = ''))", [driver,planneddate],
					  render, app.onError);
	});
    
    var render = function (tx, rs){
        //Journey incomplete, next sequence exists
        if (!(rs.rows.item(0)["MIN(Sequence)"] === '' || rs.rows.item(0)["MIN(Sequence)"] === null)){
        	app.nextlocationcalculator2(rs.rows.item(0)["MIN(Sequence)"]);
        }      
        //Day delivery completed, back to Warehouse
        else {
    		db.transaction(function(tx) {
    		tx.executeSql("UPDATE tblApp SET CurrentLocation = 'Exchange Area', CurrentLocationID=1 WHERE (DriverName=? AND PlannedDate=? AND Status<>'Done')", [driver,planneddate],
					  function(){ 
                          app.refresh1(); 
                          $('#fflocation').text('Exchange Area');
                          $('#ffTO999').text('Delivery Completed'); 
                      }, 
					  app.onError);
			});
        }
    }   
}

app.nextlocationcalculator2 = function(minsequence){
    var driver = $('#userName').val();
    var planneddate = fnFormatDateTime(new Date());  
    
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("SELECT ClientLocation,PostCode,ClientID,TransportOrderID FROM tblApp WHERE (DriverName=? AND PlannedDate=? AND Sequence=?)", [driver,planneddate,minsequence],
					  render, app.onError);
	});
    
    var render = function (tx, rs){
        app.nextlocationcalculator3(rs.rows.item(0)["ClientLocation"],rs.rows.item(0)["ClientID"],rs.rows.item(0)["PostCode"],rs.rows.item(0)["TransportOrderID"]);
    }
}

app.nextlocationcalculator3 = function(nextlocation,clientid,postcode,to){
    var db = app.db3;
	db.transaction(function(tx) {
		tx.executeSql("SELECT LocationID FROM tblAppLocation WHERE LocationClientID=?", [clientid], render, app.onError);
	}); 
    
    var render = function (tx, rs){ 
        setnextclientlocation(nextlocation,clientid,postcode,to,rs.rows.item(0)["LocationID"]);        
    }
}

function setnextclientlocation(nextlocation,clientid,postcode,to,nextlocationid){    
    var driver = $('#userName').val();
    var planneddate = fnFormatDateTime(new Date());  
    
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("UPDATE tblApp SET CurrentLocation=?, CurrentLocationID=? WHERE (DriverName=? AND PlannedDate=? AND Status<>'Done')", [nextlocation,nextlocationid,driver,planneddate],
					  render, app.onError);
	});
    
    var render = function() {
        $('#fflocation').text(nextlocation+" "+postcode); 
        $('#ffTO999').text(to); 
    }
} 

function statuscalculate(){
	var driver = $('#userName').val();
    var planneddate = fnFormatDateTime(new Date());  	
    
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("SELECT DISTINCT TransportOrderID FROM tblApp WHERE (DriverName=? AND PlannedDate=?)", [driver,planneddate],
					  render, app.onError);
	}); 
    
    var render = function (tx, rs){     
        for (var i = 0; i < rs.rows.length; i++) {  
            var row = rs.rows.item(i);
            statuscalculate2(row.TransportOrderID);
        }              
    }  
}

function statuscalculate2(toid){   
    //TOAStatus includes: Finished, JourneyCalculated, OutBound
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("SELECT TOAStatus, TransportOrderID FROM tblApp WHERE (TransportOrderID=? AND TOAStatus<>'Finished')", [toid],
					  render, app.onError);
	}); 
    
    var render = function (tx, rs){        
        if (rs.rows.length>0){            
            //TOAStatus other than Finished: JourneyCalculated, OutBound
            incomplete(toid);
           
        }
        else { 
            //TOAStatus = Finished
            complete(toid);
        }
    }          
} 

function incomplete(toid){    
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("SELECT TOStatus from tblApp WHERE TransportOrderID=?", [toid],
					  render, app.onError);
	}); 
    var render = function (tx,rs){        
		if(rs.rows.item(0)["TOStatus"] === 'Failedx1' || rs.rows.item(0)["TOStatus"]==='Failedx2' ||rs.rows.item(0)["TOStatus"]==='Cancelled' )
        {
            //Do nothing
            
        }
        else
        {            
            db.transaction(function(tx) {
			tx.executeSql("UPDATE tblApp SET TOStatus='Incomplete', CompletionTimeStamp=DATETIME() WHERE TransportOrderID=?", [toid],
					  function(){refresh();}, app.onError);
			});        
        }
    }
}

function complete(toid){
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("UPDATE tblApp SET TOStatus='Completed', CompletionTimeStamp=DATETIME() WHERE TransportOrderID=?", [toid],
					  function(){refresh();}, 
					  app.onError);
	});           
}

//TOA page function
function unused(toaid){    
    if(confirm('Asset unused?')){
        
        var db=app.db;
    	db.transaction(function(tx) {
    		tx.executeSql("UPDATE tblApp SET Destination='Unused', TOStatus='ClientServed' WHERE TransportOrderAssetID=?", [toaid],
    					  function(){app.refresh1();app.refresh2(storeObject.TransportOrderID);}, 
    					  app.onError);
    	}); 
        
    }else{}
}

function used(toaid,clientid){      
    
    if(confirm('Asset checked?')){        
        var db = app.db;
    	db.transaction(function(tx) {
    		tx.executeSql("SELECT Status, TOAStatus, TargetLocation, Destination FROM tblApp WHERE TransportOrderAssetID=?", [toaid],
    					  render, 
    					  app.onError);
	    }); 
        
        var render = function (tx,rs){                        
        	var row = rs.rows.item(0);
        
            if (row.TOAStatus === 'JourneyCalculated' || row.TOAStatus === 'OutBound')            
             {
				//collect from client
                if (row.Status === 'Done')
                {	setused(toaid,1,clientid);    }
                                  
                //return trip stroage
                else if (row.Status === 'Intransition' && row.TargetLocation === 'Exchange Area')
                {	setused(toaid,2,clientid);	}        
                 
                //asset stay with client
                else 
                {	setused(toaid,3,clientid);	}
            }
            else
            {
                //Do nothing to Finished TOA
            }
       }
    }else{}    
}

function setused(toaid,checknumber,clientid){  
    var db = app.db;  
    //collect from client
    if (checknumber === 1)
    {        
		db.transaction(function(tx) {		
            tx.executeSql("SELECT TransportOrderID from tblApp WHERE TransportOrderAssetID=?", [toaid], render, app.onError);
        });
        
        var render = function (tx, rs){
            var row = rs.rows.item(0);
            var toid = row.TransportOrderID;
            tx.executeSql("UPDATE tblApp SET TOStatus='ClientServed', CompletionTimeStamp=DATETIME() WHERE TransportOrderID=?", [toid],
					  app.refresh1, app.onError);
            tx.executeSql("UPDATE tblApp SET Status='Intransition', TOAStatus='Finished', Destination ='Collected', CompletionStamp=DATETIME() WHERE TransportOrderAssetID=?", [toaid],
					  app.refresh2(storeObject.TransportOrderID), app.onError);
        }
    }
    //return storage
    else if (checknumber === 2)
    {
		db.transaction(function(tx) {            
            tx.executeSql("SELECT TransportOrderID from tblApp WHERE TransportOrderAssetID=?", [toaid], render2, app.onError);
        });
                
        var render2 = function(tx,rs){            
            var row2 = rs.rows.item(0);            
            var toid2 = row2.TransportOrderID;            
            
    		db.transaction(function(tx) {
                tx.executeSql("UPDATE tblApp SET TOStatus='ClientServed', CompletionTimeStamp=DATETIME() WHERE TransportOrderID=?", [toid2],
    					  app.refersh1, 
    					  app.onError);
                tx.executeSql("UPDATE tblApp SET  Destination='Packed and Collected', TOAStatus='Finished', AssetClientID=?, CompletionStamp=DATETIME() WHERE TransportOrderAssetID=?", [clientid,toaid],
    					  app.refresh2(storeObject.TransportOrderID), 
    					  app.onError);
    		}); 
        }
    }
    //asset packed with client
    else if (checknumber === 3)
    {
        var db2 = app.db;
		db2.transaction(function(tx) {            
            tx.executeSql("SELECT TransportOrderID from tblApp WHERE TransportOrderAssetID=?", [toaid], render3, app.onError);
        });
        
        var render3 = function(tx,rs){
            var row3 = rs.rows.item(0);
            var toid3 = row3.TransportOrderID;
    		db2.transaction(function(tx) {
                tx.executeSql("UPDATE tblApp SET TOStatus='ClientServed', CompletionTimeStamp=DATETIME() WHERE TransportOrderID=?", [toid3],
    					  app.refersh1, 
    					  app.onError);
                tx.executeSql("UPDATE tblApp SET Status='Done', Destination='Done', TOAStatus='Finished', AssetClientID=?, CompletionStamp=DATETIME() WHERE TransportOrderAssetID=?", [clientid,toaid],
    					  app.refresh2(storeObject.TransportOrderID), 
    					  app.onError);
    		}); 
        }
    }
}

//load page function
function load(toaid){    
    if(confirm('Load asset?')){
    	var db = app.db;
	    db.transaction(function(tx) {
       	tx.executeSql("SELECT CurrentLocation from tblApp WHERE TransportOrderAssetID=?", [toaid], render, app.onError);
        });
        
        var render = function(tx,rs){            
        	if (rs.rows.item(0)["CurrentLocation"] === 'Exchange Area'){
            
                var db = app.db;
            	db.transaction(function(tx) {
            		tx.executeSql("UPDATE tblApp SET TOAStatus = 'OutBound',CurrentLocationID=2, CurrentLocation='Van' WHERE TransportOrderAssetID=?", [toaid],
            					  app.refresh3, app.onError);
            		
                    });
            }            
       	 else if (rs.rows.item(0)["CurrentLocation"] === 'Warehouse'){alert('Asset is still in warehouse.');}
        	else if (rs.rows.item(0)["CurrentLocation"] === 'Van'){alert('Asset already on van.');}
            else{alert('Asset is with client.');}
        }
	}else{}
}

//unload page function
function unload(toaid){if(confirm('Unload asset?')){
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("UPDATE tblApp SET Destination='ReadyForWorker' WHERE TransportOrderAssetID=?", [toaid], app.refresh4, app.onError);
	});
}else{}}

//Synchronisation
refresh= function(){
    app.synchronise();
    app.refresh1();
    app.refresh2(storeObject.TransportOrderID);
    app.refresh3();
    app.refresh4();
}

app.synchronise = function(){    
     var driver = $('#userName').val();
     var planneddate = fnFormatDateTime(new Date());  
    
     var render = function (tx, rs){                
        for (var i = 0; i < rs.rows.length; i++) {   
            
            var row = rs.rows.item(i);
            //TOA update
            var A = row.TransportOrderAssetID;            
            var B = row.TOAStatus;
            var C = Date.parse(row.CompletionStamp);  
            //var X = row.Destination; //Contain space, need to modify into integer system 
			
            //Assset update
            var H = row.AssetID;
            //var D = row.ContentsDescription; //Not implemented yet
            var E = row.Status;
            var F = row.CurrentLocationID;
            var G = row.AssetClientID;  
            
            //TO update
            var L = row.TransportOrderID;
            var I = Date.parse(row.CompletionTimeStamp);         
            var J = row.TOStatus;
            var K = row.Sequence;
            
            //All null
            if ((row.CompletionStamp === '' || row.CompletionStamp === null)&&(row.CompletionTimeStamp === '' || row.CompletionTimeStamp === null))
            {
                console.log('http://storedapp.fruitfulserver.com/appjsonpage1receptor?TransportOrderAssetID='+A+'&TOAStatus='+B+'&CompletionStamp=');                
                console.log('http://storedapp.fruitfulserver.com/appjsonpage1receptor2?AssetID='+H+'&Status='+E+'&CurrentLocationID='+F+'&AssetClientID='+G);
                console.log('http://storedapp.fruitfulserver.com/appjsonpage1receptor3?TransportOrderID='+L+'&TOStatus='+J+'&Sequence='+K+'&CompletionTimeStamp=');
                
                $('#content3').load('http://storedapp.fruitfulserver.com/appjsonpage1receptor?TransportOrderAssetID='+A+'&TOAStatus='+B+'&CompletionStamp=');
                $('#content4').load('http://storedapp.fruitfulserver.com/appjsonpage1receptor2?AssetID='+H+'&Status='+E+'&CurrentLocationID='+F+'&AssetClientID='+G);
                $('#content5').load('http://storedapp.fruitfulserver.com/appjsonpage1receptor3?TransportOrderID='+L+'&TOStatus='+J+'&Sequence='+K+'&CompletionTimeStamp=');
            }            
            //TimeStamp is null && Stamp is not
            else if ((!(row.CompletionStamp === '' || row.CompletionStamp === null))&&(row.CompletionTimeStamp === '' || row.CompletionTimeStamp === null))
            {
                console.log('http://storedapp.fruitfulserver.com/appjsonpage1receptor?TransportOrderAssetID='+A+'&TOAStatus='+B+'&CompletionStamp='+C);
                console.log('http://storedapp.fruitfulserver.com/appjsonpage1receptor2?AssetID='+H+'&Status='+E+'&CurrentLocationID='+F+'&AssetClientID='+G);
                console.log('http://storedapp.fruitfulserver.com/appjsonpage1receptor3?TransportOrderID='+L+'&TOStatus='+J+'&Sequence='+K+'&CompletionTimeStamp=');
                
                $('#content3').load('http://storedapp.fruitfulserver.com/appjsonpage1receptor?TransportOrderAssetID='+A+'&TOAStatus='+B+'&CompletionStamp='+C);
                $('#content4').load('http://storedapp.fruitfulserver.com/appjsonpage1receptor2?AssetID='+H+'&Status='+E+'&CurrentLocationID='+F+'&AssetClientID='+G);
                $('#content5').load('http://storedapp.fruitfulserver.com/appjsonpage1receptor3?TransportOrderID='+L+'&TOStatus='+J+'&Sequence='+K+'&CompletionTimeStamp=');
            }
            //TimeStamp is not && Stamp is null
            else if ((row.CompletionStamp === '' || row.CompletionStamp === null)&&(!(row.CompletionTimeStamp === '' || row.CompletionTimeStamp === null)))
            {
                console.log('http://storedapp.fruitfulserver.com/appjsonpage1receptor?TransportOrderAssetID='+A+'&TOAStatus='+B+'&CompletionStamp=');
                console.log('http://storedapp.fruitfulserver.com/appjsonpage1receptor2?AssetID='+H+'&Status='+E+'&CurrentLocationID='+F+'&AssetClientID='+G);
                console.log('http://storedapp.fruitfulserver.com/appjsonpage1receptor3?TransportOrderID='+L+'&TOStatus='+J+'&Sequence='+K+'&CompletionTimeStamp='+I);
                
                $('#content3').load('http://storedapp.fruitfulserver.com/appjsonpage1receptor?TransportOrderAssetID='+A+'&TOAStatus='+B+'&CompletionStamp=');
                $('#content4').load('http://storedapp.fruitfulserver.com/appjsonpage1receptor2?AssetID='+H+'&Status='+E+'&CurrentLocationID='+F+'&AssetClientID='+G);
                $('#content5').load('http://storedapp.fruitfulserver.com/appjsonpage1receptor3?TransportOrderID='+L+'&TOStatus='+J+'&Sequence='+K+'&CompletionTimeStamp='+I);
            }
            //No null
            else
            {
                console.log('http://storedapp.fruitfulserver.com/appjsonpage1receptor?TransportOrderAssetID='+A+'&TOAStatus='+B+'&CompletionStamp='+C);
                console.log('http://storedapp.fruitfulserver.com/appjsonpage1receptor2?AssetID='+H+'&Status='+E+'&CurrentLocationID='+F+'&AssetClientID='+G);
                console.log('http://storedapp.fruitfulserver.com/appjsonpage1receptor3?TransportOrderID='+L+'&TOStatus='+J+'&Sequence='+K+'&CompletionTimeStamp='+I);
                
               $('#content3').load('http://storedapp.fruitfulserver.com/appjsonpage1receptor?TransportOrderAssetID='+A+'&TOAStatus='+B+'&CompletionStamp='+C);
                $('#content4').load('http://storedapp.fruitfulserver.com/appjsonpage1receptor2?AssetID='+H+'&Status='+E+'&CurrentLocationID='+F+'&AssetClientID='+G);
                $('#content5').load('http://storedapp.fruitfulserver.com/appjsonpage1receptor3?TransportOrderID='+L+'&TOStatus='+J+'&Sequence='+K+'&CompletionTimeStamp='+I);
            }           
        }        
    }
    
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("SELECT * FROM tblApp WHERE (DriverName = ? AND PlannedDate=?)", [driver,planneddate], 
					  render, 
					  app.onError);
	});   
}

app.onError = function(tx, e) {
	console.log("Error: " + e.message);
    alert("Generic error: " + e.message);
} 

/*
function nextlocationcheck(){
    var driver = $('#userName').val();
    var planneddate = fnFormatDateTime(new Date());  
        
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("SELECT TOStatus FROM tblApp WHERE (DriverName=? AND PlannedDate=? AND (TOStatus<>null OR TOStatus<>''))", [driver,planneddate], render, app.onError);
	});
    
    var render = function (tx, rs){
        if (rs.rows.length>0){   
            //non-null Transport Order exists         	
    		locationchecker(1);
        }
        else { 
            //initial state: all null TOStatus
    		locationchecker(0);
        }
    }
}

function locationchecker(tocount){    
    var driver = $('#userName').val();
    var planneddate = fnFormatDateTime(new Date());  
    
    var db = app.db;
	db.transaction(function(tx) {
		tx.executeSql("SELECT CurrentLocation FROM tblApp WHERE (DriverName=? AND PlannedDate=? AND Status<>'Done') ORDER BY Sequence ASC", [driver,planneddate], render, app.onError);
	});   
    
    var render = function (tx,rs){
        //all null TOStatus
        if (rs.rows.item(0)["CurrentLocation"] === 'Exchange Area' && tocount === 0){            
            /*var db2 = app.db;
        	db2.transaction(function(tx) {
        		tx.executeSql("UPDATE tblApp SET TOAStatus='OutBound', CurrentLocationID=2, CurrentLocation='Van' WHERE (DriverName=? AND PlannedDate=? AND Status<>'Done' AND CurrentLocationID=2)", [driver,planneddate],
        					  render2, 
        					  app.onError);
        	});             
            var render2 = function() {
                $('#fflocation').text('Van');
            } */  
        //}        
        //calculate journey
/*       
else
        {            
            app.nextlocationcalculator();
        }
    }   
}*/

