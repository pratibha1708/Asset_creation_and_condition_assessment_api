var express = require('express');
var pg = require('pg');
var crud = require('express').Router();
var fs = require('fs');
var os = require('os');
const userInfo = os.userInfo();
const prapatel = userInfo.username;
console.log(prapatel);
// locate the database login details
var configtext = ""+fs.readFileSync("/home/"+prapatel+"/certs/postGISConnection.js");
var user_id;

// now convert the configruation file into the correct format -i.e. a name/value pair array
var configarray = configtext.split(",");
var config = {};
for (var i = 0; i < configarray.length; i++) {
var split = configarray[i].split(':');
config[split[0].trim()] = split[1].trim();
}
var pool = new pg.Pool(config);
console.log(config);

//add data parser functionality to the API – this is required so that the NodeJS
//code can read through the individual name/value pairs that are posted by the form

const bodyParser = require('body-parser');
crud.use(bodyParser.urlencoded({ extended: true }));

// test endpoint for GET requests (can be called from a browser URL or AJAX)
crud.get('/testCRUD',function (req,res) {
res.json({message:req.originalUrl+" " +"GET REQUEST"});
});
// test endpoint for POST requests - can only be called from AJAX
crud.post('/testCRUD',function (req,res) {
res.json({message:req.body});
});

// crud to get user_id
crud.get('/getUserId', function(req,res)
{
	pool.connect(function(err,client,done)
	{
		if(err)
			{console.log("not able to get connection" + err);
				res.status(400).send(err);}

		// var user_id = req.params.user_id; 

		var querystring = "select user_id from ucfscde.users where user_name = current_user";
		console.log(querystring)
		client.query(querystring, function(err, result)
			{ done();
				if(err)
					{res.status(400).send(err);}
			     res.status(200).send(result.rows[0]);
			     var user_id = result.rows[0].user_id;
			     console.log(user_id);
			 });
	});
});

// post: insertAssetPoint 
crud.post('/insertAssetPoint', function(req,res)
{
	
	pool.connect(function(err,client,done)
	{
		if(err)
			{
				console.log("Not able to connection " +err);
				res.status(400).send(err);}

	var asset_name = req.body.asset_name;
	var installation_date = req.body.installation_date;
	var latitude = req.body.latitude;
	var longitude = req.body.longitude;
	var location = req.body.location; 


	    var geometrystring = "st_geomfromtext('POINT("+req.body.longitude+ " "+req.body.latitude +")',4326)";
      	var querystring = "INSERT into cege0043.asset_information (asset_name,installation_date, location) values ";
      	querystring += "($1,$2,";
      	querystring += geometrystring + ")";
		
		console.log(querystring);
		client.query(querystring,[asset_name, installation_date], function(err, result)
			{ 
				done();
				if(err)
					{  
						res.status(400).send(err);

						
					}
					
	
					
						
			     res.status(200).send("Asset:  "+ req.body.asset_name +  " has been inserted!");
			 });
	});
})


//post: insertConditionInformation 
crud.post('/insertConditionInformation', function(req,res)
{ console.log(req.body);
	
	pool.connect(function(err,client,done)
	{
		if(err)
			{
				console.log("Not able to connection " +err);
				res.status(400).send(err);}

	var asset_name = req.body.asset_name;
	var condition = req.body.condition;
	var condition_description = req.body.condition_description;
	var asset_id = req.body.asset_id;
         
         var querystring = "INSERT into cege0043.asset_condition_information (asset_id, condition_id) values (";
		querystring += "(select id from cege0043.asset_information where asset_name = $1),(select id from cege0043.asset_condition_options where condition_description = $2))";
		console.log(querystring);
		client.query(querystring,[asset_name, condition_description], function(err, result)
			{ 
				done();
				if(err)
					{
						console.log(err);
						res.status(400).send(err);}
			     res.status(200).send("Condition Report for  " + req.body.asset_name + " has been submitted. ");
			 });
	});
});


// Add the following line of code to the end of the file
module.exports = crud;