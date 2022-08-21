<b> RESTful Data API <br></b>
A technical guide for API component.This repository contains all the javascript files which are required to create and test the endpoints which can be used by the app repository to develop the app for assest creation and asset condition survey. It also contains the file to start the node server. <br>

<b> Table of Contents </b>
1. System Requirement
2. Deployment
3. Testing
4. File Description
5. Code Reference

<b> 1. System Requirements </b> <br>

* To check the endpoints, it requires to make connections to a Ubuntu Server (Virtual Machine). You could use BitVise, Pycharm (Version 2018.3.5 Professional Edition) or other SSH software to connect to the Ubuntu Server.

* If you are going to check the endpoints outside the UCL campus (not connected to Eduroam), make sure you are connected to UCL VPN by following the instructions
at https://www.ucl.ac.uk/isd/services/get-connected/remote-working-services/ucl-virtualprivate-network-vpn.

* To test the POST Endpoints, you need to  download Postman from https://www.postman.com/downloads and create an account. Make sure you are connected to VPN while doing this. To test the POST endpoints, you may also use PG Admin 4v6 to cross verify. 

<b> 2. Deployment </b>
 
* Clone the source code of API from Github to sever at home/studentuser/code by typing in the commnad line (terminal) window for Ubuntu:  <br>

cd /home/studentuser/code <br>
git clone https://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@github.com/ucl-geospatial-21-22/cege0043-api-21-22-pratibha1708.git -b master

* After cloning the code, make sure that you are in correct repository.

* Ensure that the express and pg is installed. If not, install it by typing the following in the terminal: <br>

npm install express <br>
npm install pg <br>

* After installing, start the Node JS Server by following the following: <br>
node dataAPI.js

<b> 3. Testing: </b> <br>
* Make sure your device is connected to UCL Wifi or UCL VPN. 

* Make sure the Node JS server is active.

* <b>GET Request Endpoints:</b> <br>
-- To test the Get Endpoints, type the URL in the browser and the desired output will be returned. <br>
For eg:  To check the userRanking endpoint, type the following in the browser: <br>
https://cege0043-2022-35.cs.ucl.ac.uk/api/userRanking/523 <br>
Similiarly other GET endpoints can be tested from the browser. <br>

* <b> POST Request Endpoints: </b> <br>
-- These endpoints can only be called from AJAX. Use Postman to test the POST endpoints. For a POST call you will need to enter the parameters – as BODY > x-www-form-unencoded. <br>
-- If you don't get a result, test with the SSL option switched off. <br>
-- If the endpoint is working correctly, you will see get the message that data has been inserted into the database. <br>
-- Other way to check this, by login into PG Admin and checking if data is inserted correctly or not.   <br>

* While testing the functionality of this repository, use of Inspect or Developer mode of the browser to see if any error occurs.
  
<b> 4. File Description </b> <br>

<b> 4.1 dataAPI.js </b> <br>
dataAPI.js file is used to start the node server. It uses https/http server to serve the files. It has functionality that allows cross-domain queries.It offer the functionality to log the requests. 


<b> 4.2 geojson.js </b> <br>
Apart from various endpoints, it conatins database login details. All of the following endpoints are GET requests and therefore can be accessed from browser URL.<br>

* Endpoints:

| ID     | Endpoint                | Decsription
| ------ | ----------------------- | -------------------------------------|
| 1.     | geoJSONUserId/:user_id  | This endpoint takes user_id as an input and returns geoJson containing asset_id, asset_name, installation_date, latest_condition_report_date, condition_description and geometry of that particular user |
| 2.     | userConditionReports/:user_id | This endpoint takes user_id as input and returns the number of reports submitted by that user |
| 3. | userRanking/:user_id | This endpoint takes user_id as input and returns the user ranking based on the number of reports the user has submitted |
| 4. | assetsInGreatCondition | This endpoint returns the JSON list of assets which are in great condition i.e. they have condition value of 1: "Element is in very good condition" atleast once.|
| 5. | dailyParticipationRates | This endpoint returns array to json which contains daily reporting rate for past week by all the users.It gives count of total number of reports submitted and count of assets which are not working i.e. have condition value of 4 or 5:Not working and maintenance must be done as soon as reasonably possible or Not working and needs immediate, urgent maintenance
| 6. | fiveClosestAssets/:latitude/:longitude | This endpoint takes latlong of user's position as input to calculate the five closest assets from user's location. and returns the array_to_json of five closest assets 
| 7. | lastFiveConditionReports/:user_id |This endpoint takes user_id as input and returns the lastFiveConditionReport submitted by the specific user and it returns a geojson containing geometry and properties of assets (id, user_id, asset_name, condition_description)
| 8. | conditionReportMissing/:user_id |It takes user_id as input and returns assets that the user hasn’t already given a condition report for in the last 3 days. It returns a geoJson

<b> 4.3 crud.js </b>
Apart from various endpoints, it conatins database login details. It has both GET and POST requests. <br>
* Endpoints:

| ID   | Endpoint                  | Description
|------|---------------------------|----------------------------|
| 1.   | getUserId    | This endpoint is used to get the user_id from user_name |
| 2. | insertAssetPoint | It is post request as it is used to insert the data into database. It is used to insert the asset information such as asset_name , installation_date, latitude, longitude into the database. |
| 3. | insertConditionInformation | It is post request as it is used to insert the data into database. It is used to insert condition information into the database. 



<b> 5. Code Reference </b> <br>
* All the codes are adapted from the github of CEGE0043 Web Mobile and GIS by Claire Ellul to create all the endpoints. The SQL scripts used was also taken from Claire Ellul. 

* To create the required geoJSON format using a query was adapted from here:
http://www.postgresonline.com/journal/archives/267-Creating-GeoJSON-Feature-Collections-with-JSON-and-PostGIS-functions.html, accessed 4th January 2018



  
  
  


  
  

