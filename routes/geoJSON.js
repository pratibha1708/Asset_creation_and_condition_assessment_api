var express = require('express');
var pg = require('pg');
var geoJSON = require('express').Router();
var fs = require('fs');
// get the username - this will ensure that we can use the same code on multiple machines
var os = require('os');
const userInfo = os.userInfo();
const prapatel = userInfo.username;
console.log(prapatel);
// locate the database login details
var configtext = ""+fs.readFileSync("/home/"+prapatel+"/certs/postGISConnection.js");

// now convert the configuration file into the correct format -i.e. a name/value pair array
var configarray = configtext.split(",");
var config = {};
for (var i = 0; i < configarray.length; i++) {
var split = configarray[i].split(':');
config[split[0].trim()] = split[1].trim();
}
var pool = new pg.Pool(config);
console.log(config);

geoJSON.route('/testGeoJSON').get(function (req,res) {
res.json({message:req.originalUrl});
});


// Code to get only the geoJSON asset locations for a specific user_id
// geoJSON.get(/geoJSONUserId/:user_id, ...

geoJSON.get('/geoJSONUserId/:user_id', function(req,res)
{
    pool.connect(function(err,client,done)
    {
        if(err)
            {console.log("Not able to get connection " + err);
                res.status(400).send(err);}
        
        var user_Id = req.params.user_id; 
        var colnames = "asset_id, asset_name, installation_date, latest_condition_report_date, condition_description";
      

        // now use the inbuilt geoJSON functionality
          // and create the required geoJSON format using a query adapted from here:
          // http://www.postgresonline.com/journal/archives/267-Creating-GeoJSON-Feature-Collections-with-JSON-and-PostGIS-functions.html, accessed 4th January 2018
         
        
          // note that query needs to be a single string with no line breaks so built it up bit by bit
         var querystring = " SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features  FROM ";
          querystring += "(SELECT 'Feature' As type     , ST_AsGeoJSON(lg.location)::json As geometry, ";
          querystring += "row_to_json((SELECT l FROM (SELECT "+colnames + " ) As l      )) As properties";
          querystring += "   FROM cege0043.asset_with_latest_condition As lg ";
         querystring += " where user_id = $1 limit 100  ) As f ";
        
        console.log(querystring);
        console.log(user_Id);
        client.query(querystring,[user_Id], function(err, result)
            { done();
                if(err)
                    {console.log(err);
                        res.status(400).send(err);}
                 res.status(200).send(result.rows);


                 
             });
    });
});


//Condition App: user is told how many condition reports they have saved, when they add a new condition report (xxxx is the user_id of the particular person)
//$1 is the user_id parameter passed to the query

//ENDPOINT
//geoJSON.get(/userConditionReports/:user_id, ...

geoJSON.get('/userConditionReports/:user_id', function(req,res)
{
    pool.connect(function(err,client,done)
    {
        if(err)
            {console.log("Not able to get connection " + err);
                res.status(400).send(err);}
        
        var user_Id = req.params.user_id; 

        var querystring = "select array_to_json (array_agg(c))";
        querystring += "from";
        querystring += "(SELECT COUNT(*) AS num_reports from cege0043.asset_condition_information where user_id = $1) c";

        console.log(querystring);
        console.log(user_Id);
        client.query(querystring,[user_Id], function(err, result)
            { done();
                if(err)
                    {console.log(err);
                        res.status(400).send(err);}
                 res.status(200).send(result.rows);


                 
             });
    });
});



// Condition App: user is given their ranking (based on condition reports, in comparison to all other users) (as a menu option)
//$1 is the user_id parameter passed to the query

// ENDPOINT
// geoJSON.get(/userRanking/:user_id, ...


geoJSON.get('/userRanking/:user_id', function(req,res)
{
    pool.connect(function(err,client,done)
    {
        if(err)
            {console.log("Not able to get connection " + err);
                res.status(400).send(err);}
        
        var user_Id = req.params.user_id; 

        var querystring = "select array_to_json (array_agg(hh)) ";
        querystring += "from ";
        querystring += "(select c.rank from (SELECT b.user_id, rank()over (order by num_reports desc) as rank ";
        querystring += "from (select COUNT(*) AS num_reports, user_id ";
        querystring += "from cege0043.asset_condition_information ";
        querystring += "group by user_id) b) c "; 
        querystring += "where c.user_id = $1) hh";

        console.log(querystring);
        console.log(user_Id);
        client.query(querystring,[user_Id], function(err, result)
            { done();
                if(err)
                    {console.log(err);
                        res.status(400).send(err);}
                 res.status(200).send(result.rows);


                 
             });
    });
});


// Asset Location App: list of all the assets with at least one report saying that they are in the best condition  (via a menu option) 
// Return result as a JSON list

// ENDPOINT
// geoJSON.get(/assetsInGreatCondition, ... 

geoJSON.get('/assetsInGreatCondition', function(req,res)
{
    pool.connect(function(err,client,done)
    {
        if(err)
            {console.log("Not able to get connection " + err);
                res.status(400).send(err);}

        var querystring = "select array_to_json (array_agg(d)) from ";
        querystring += "(select c.* from cege0043.asset_information c ";
        querystring += "inner join ";
        querystring += "(select count(*) as best_condition, asset_id from cege0043.asset_condition_information ";
        querystring += "where ";
        querystring += "condition_id in (select id from cege0043.asset_condition_options where "; 
        querystring += "condition_description like '%very good%') ";
        querystring += "group by asset_id ";
        querystring += "order by best_condition desc) b ";
        querystring += "on b.asset_id = c.id) d";

        console.log(querystring);
    
        client.query(querystring, function(err, result)
            { done();
                if(err)
                    {console.log(err);
                        res.status(400).send(err);}
                 res.status(200).send(result.rows);                 
             });
    });
});


// Asset App: graph showing daily reporting rates for the past week (how many reports have been submitted, and how many of these had condition as one of the two 'not working' options) (as a menu option)
// return data as JSON so that it can be used in D3
// For all users

// ENDPOINT
// geoJSON.get(/dailyParticipationRates, ...

geoJSON.get('/dailyParticipationRates', function(req,res)
{
    pool.connect(function(err,client,done)
    {
        if(err)
            {console.log("Not able to get connection " + err);
                res.status(400).send(err);}

        var day = req.params.day;
        var reports_submitted = req.params.reports_submitted;
        var not_working = req.params.not_working; 

        var querystring = "select  array_to_json (array_agg(c)) from ";
        querystring += "(select day, sum(reports_submitted) as reports_submitted, sum(not_working) as ";
        querystring += "reports_not_working ";
        querystring += "from cege0043.report_summary ";
        querystring += "group by day) c  ";

        console.log(querystring);
    
        client.query(querystring, function(err, result)
            { done();
                if(err)
                    {console.log(err);
                        res.status(400).send(err);}
                 res.status(200).send(result.rows);                 
             });
    });
});

//Assets App: map layer showing all the asset locations added in the last week (by any user).  The layer must be added and removed via a menu option
// Return result as GeoJSON for display purposes

// ENDPOINT
// geoJSON.get(/assetsAddedWithinLastWeek, ..

geoJSON.get('/assetsAddedWithinLastWeek', function(req,res)
{
    pool.connect(function(err,client,done)
    {
        if(err)
            {console.log("Not able to get connection " + err);
                res.status(400).send(err);}

        var querystring = "SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features  FROM  ";
        querystring += "(SELECT 'Feature' As type     , ST_AsGeoJSON(lg.location)::json As geometry,  ";
        querystring += "row_to_json((SELECT l FROM (SELECT id, asset_name, installation_date) As l  ";
        querystring += ")) As properties ";
        querystring += "FROM cege0043.asset_information  As lg  ";
        querystring += "where timestamp > NOW()::DATE-EXTRACT(DOW FROM NOW())::INTEGER-7  limit 100  ) As f  ";

        console.log(querystring);
    
        client.query(querystring, function(err, result)
            { done();
                if(err)
                    {console.log(err);
                        res.status(400).send(err);}
                 res.status(200).send(result.rows);                 
             });
    });
});


//Condition App: map layer showing the 5 assets closest to the user’s current location, added by any user.  The layer must be added/removed via a menu option
//Return result as GeoJSON for display purposes
//XXX and YYY are the lat/lng of the user
//note that as this is a geomfromtext situation you can't use the standard $1, $2 for these variables - instead build the query up using strings

//ENDPOINT
//geoJSON.get(/fiveClosestAssets/:latitude/:longitude, ...

geoJSON.get('/fiveClosestAssets/:latitude/:longitude', function(req,res)
{
    pool.connect(function(err,client,done)
    {
        if(err)
            {console.log("Not able to get connection " + err);
                res.status(400).send(err);}

        var latitude = req.params.latitude;
        var longitude = req.params.longitude;
        var location = req.params.location; 
        var user_Id = req.params.user_id;


        var querystring = "SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features  FROM ";
        querystring += "(SELECT 'Feature' As type     , ST_AsGeoJSON(lg.location)::json As geometry,  ";
        querystring += "row_to_json((SELECT l FROM (SELECT id, asset_name, installation_date) As l  ";
        querystring += ")) As properties ";
        querystring += "FROM   (select c.* from cege0043.asset_information c  ";
        querystring += "inner join (select id, st_distance(a.location, st_geomfromtext('POINT("+longitude+" "+latitude+")',4326)) ";
        querystring += "as distance ";
        querystring += "from cege0043.asset_information a ";
        querystring += "order by distance asc ";
        querystring += "limit 5) b ";
        querystring += "on c.id = b.id ) as lg) As f ";

        console.log(querystring);
    
        client.query(querystring,  function(err, result)
            { done();
                if(err)
                    {console.log(err);
                        res.status(400).send(err);}
                 res.status(200).send(result.rows);                 
             });
    });
});


//Condition App: map showing the last 5 reports that the user created (colour coded depending on the conditition rating)
//Return result as GeoJSON
// $1 is the user_id

//ENDPOINT
//geoJSON.get(/lastFiveConditionReports/:user_id, ... 

geoJSON.get('/lastFiveConditionReports/:user_id', function(req,res)
{
    pool.connect(function(err,client,done)
    {
        if(err)
            {console.log("Not able to get connection " + err);
                res.status(400).send(err);}

        var asset_name = req.params.asset_name;
        var condition_description = req.params.condition_description;
        var user_Id = req.params.user_id; 

        var querystring = "SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features  FROM  ";
        querystring += "(SELECT 'Feature' As type     , ST_AsGeoJSON(lg.location)::json As geometry,  ";
        querystring += "row_to_json((SELECT l FROM (SELECT id, user_id,asset_name, condition_description) As l  ";
        querystring += ")) As properties ";
        querystring += "FROM ";
        querystring += "(select * from cege0043.condition_reports_with_text_descriptions where user_id = $1 ";
        querystring += "order by timestamp desc ";
        querystring += "limit 5) as lg) As f ";
        console.log(querystring);
    
        client.query(querystring,[user_Id], function(err, result)
            { done();
                if(err)
                    {console.log(err);
                        res.status(400).send(err);}
                 res.status(200).send(result.rows);                 
             });
    });
});


// Condition App: App only shows assets and calculates proximity alerts for assets that the user hasn’t already given a condition report for in the last 3 days
//so generate a list of the user's assets for which no condition report exists
//return as GeoJSON
//$1 and $2 are the user_id for the user


// ENDPOINT
// geoJSON.get(/conditionReportMissing/:user_id, ... 

geoJSON.get('/conditionReportMissing/:user_id', function(req,res)
{   console.log(req.params);
    pool.connect(function(err,client,done)
    {
        if(err)
            {console.log("Not able to get connection " + err);
                res.status(400).send(err);}

        var user_Id = req.params.user_id; 

        var querystring = "SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features  FROM  ";
        querystring += "(SELECT 'Feature' As type     , ST_AsGeoJSON(lg.location)::json As geometry,  ";
        querystring += "row_to_json((SELECT l FROM (SELECT asset_id, asset_name, installation_date, latest_condition_report_date, condition_description) As l  ";
        querystring += ")) As properties ";
        querystring += "FROM ";
        querystring += "(select * from cege0043.asset_with_latest_condition ";
        querystring += "where asset_id not in ( ";
        querystring += "select asset_id from cege0043.asset_condition_information ";
        querystring += "where user_id = $1 and ";
        querystring += "timestamp > NOW()::DATE-EXTRACT(DOW FROM NOW())::INTEGER-3)  ) as lg) As f ";

        console.log(querystring);
    
        client.query(querystring,[user_Id], function(err, result)
            { done();
                if(err)
                    {console.log(err);
                        res.status(400).send(err);}
                 res.status(200).send(result.rows);                 
             });
    });
});

//Condition App: graph showing top 5 scorers in terms of the number of reports created (as a menu option)
//no need for parameters in this case
//data is returned as JSON so that it can be used in a D3 graph

//ENDPOINT
//geoJSON.get(/topFiveScorers, ..

geoJSON.get('/topFiveScorers/', function(req,res)
{ console.log(req.params);
    pool.connect(function(err,client,done)
    {
        if(err)
            {console.log("Not able to get connection " + err);
                res.status(400).send(err);}


        var querystring = "select array_to_json (array_agg(c)) from ";
        querystring += "(select rank() over (order by num_reports desc) as rank , user_id  ";
        querystring += "from (select COUNT(*) AS num_reports, user_id  ";
        querystring += "from cege0043.asset_condition_information ";
        querystring += "group by user_id) b limit 5) c ";
    
        console.log(querystring);
    
        client.query(querystring, function(err, result)
            { done();
                if(err)
                    {console.log(err);
                        res.status(400).send(err);}
                 res.status(200).send(result.rows);                 
             });
    });
});

//Asset App: user is told how many assets have been created by them
//$1 is the user_id parameter passed to the query

//ENDPOINT
//geoJSON.get(/userAssetCreated/:user_id, ...

geoJSON.get('/userAssetCreated/:user_id', function(req,res)
{
    pool.connect(function(err,client,done)
    {
        if(err)
            {console.log("Not able to get connection " + err);
                res.status(400).send(err);}
        
        var user_Id = req.params.user_id; 

        var querystring = "select array_to_json (array_agg(c))";
        querystring += "from";
        querystring += "(SELECT COUNT(*) AS num_assets from cege0043.asset_information where user_id = $1) c";

        console.log(querystring);
        console.log(user_Id);
        client.query(querystring,[user_Id], function(err, result)
            { done();
                if(err)
                    {console.log(err);
                        res.status(400).send(err);}
                 res.status(200).send(result.rows);


                 
             });
    });
});


module.exports = geoJSON;