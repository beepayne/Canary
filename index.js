//-----------------------------------------------------------------------------
// Importing Required modules
//-----------------------------------------------------------------------------

// Loading MQTT module 
var mqtt = require('mqtt');
// Connecting to MQTT broker server - mosquitto
var options = {
    host: 'infiniteattempts.summerstudio.xyz',
    port: 5269,
    clientId: 'avis'
}
var client = mqtt.connect(options);

// Loading assert module - Error Checking
const assert = require('assert');

// Loading moment module - To get time stamp
// var moment = require('moment');

// Loading MongodB Client module
var MongoClient = require('mongodb').MongoClient;
// MongoDB database name 
const dbName = 'Canary';
// MongoDB connection url 
var MongoDB_url = "mongodb://bananas_and_dingoes.summerstudio.xyz:27017";


//-----------------------------------------------------------------------------
// Connecting to the Database and selecting topic/data
//-----------------------------------------------------------------------------

// Use connect method to connect to the server 
MongoClient.connect(MongoDB_url, {useNewUrlParser: true}, function(error, initialisedDatabase) {
	// Error check 
	assert.equal(null, error);

	// Report success to console 
	console.log("Connected successfully to server");

	// Trunkading function
	const db = initialisedDatabase.db(dbName);

	// Get the documents collection
	const Chair_Mon_Collection  = db.collection('Chair_Monitor'); 	// Bradens Collection 
	const TheBat_Collection     = db.collection('TheBat');        	// Joes Collection
	const Asset_Man_Collection  = db.collection('Asset_Manager');	// Wills Collection
	const Ibis_collection    	= db.collection('Ibis');			// Rachels Collection

	// When message recieved via topic, excute function
	client.on('message', function (topic, message) {
		// Message received over Canary subscription
		var Cdata = Buffer.from(message);
		// Convert message to string
		var CdataString = Cdata.toString();
		
		// Count how many parameters there are
		var parameterCount = CdataString.split(",").length;
		// Split the parameters into their own strings
		var parameters = CdataString.split(",");
	
		// Declaring bool logic for packet being sent to database
		var CMBuilt = false;

		// Selection from various topic
		switch(topic) {
			case ('Canary/ChairMon'):
				buildPacket(parameterCount, parameters, Chair_Mon_Collection);
				CMBuilt = true;
				break;
			case ("Canary/TheBat"):
				buildPacket(parameterCount, parameters, TheBat_Collection);
				break;
			case ("Canary/AssetMon"):
				buildPacket(parameterCount, parameters, Asset_Man_Collection);
				break;
			case ("Canary/Ibis"):
				buildPacket(parameterCount, parameters, Ibis_collection);
				break;
			case ("Canary/AirMon"):
				console.log(parameters);
				break;
		}
		
		// Chair monitor publishing to defive to tell it to sleep
		if(CMBuilt == true){

			// getting number of hours
			var today = new Date().getHours();
		
			// setting time between 10 pm and 6 am so that device will sleep for an hour.
			if ((today +11) >= 22 && (today+ 11) < 6) {
				
			client.publish('ChairMon/Return', "LateRecieved");
			} 
			
			//Any other time, device will sleep for 5 min.
			else {
				client.publish('ChairMon/Return', "Recieved");
			}
		}

	});
});


//-----------------------------------------------------------------------------
// Connecting to Topic
//-----------------------------------------------------------------------------

// When connected subscribe to desired topic. Currently to Canary/+
client.on('connect', function () {

	console.log("Connected to the MQTT Broker");
	client.subscribe('Canary/+', function (error) {	
	
	if (!error)
		console.log("Subscribed to Canary/+ Topic ");
	else
		console.log("Cannot subscribe, server won't allow");

	});
});

//-----------------------------------------------------------------------------
//  Building the packets
//-----------------------------------------------------------------------------

// Function for building the packet. 
function buildPacket(parameterCount, parameters, collection) {
	
	// Get time in Linux format
    var time = new Date();

	// Create an object for the packets to be added to.
	var packetObj = {
		Date: time,
		DeviceID: parameters[0]
	};

	// Renaming type code for easier splitting
	var Types = parameters[1];
	// Splitting the type code
	var dataTypes = Types.split(".");

	// Running through all type codes to put values in packetObj
	for (var i = 2; i < parameterCount ; i++) {
		// Switching between the type codes
		switch(dataTypes[i-2]) {
            case ("Bu"):
                var paraint = parseFloat(parameters[i]);  // Used to change the string to a float
				packetObj["Button"] = paraint;              // Maybe change this to an additional function...
				break;
            case ("Di"):
                var paraint = parseFloat(parameters[i]);
        		packetObj["Distance"] = paraint;
				break;
			case ("Hu"):
				var paraint = parseFloat(parameters[i]);
				packetObj["Humidity"] = paraint;
				break;
            case ("Li"):
                var paraint = parseFloat(parameters[i]);
				packetObj["Light"] = paraint;
				break;
            case ("Lo"):
                var paraint = parseFloat(parameters[i]);
				packetObj["Load"] = paraint;
				break;
            case ("Qu"):
                var paraint = parseFloat(parameters[i]);
				packetObj["Quantity"] = paraint;
				break;
            case ("So"):
                var paraint = parseFloat(parameters[i]);
				packetObj["Sound"] = paraint;
				break;
			case ("Te"):
				var paraint = parseFloat(parameters[i]);
				packetObj["Temperature"] = paraint;
				break;
		};
	};
	// Inserting the data into the selected collection within the database
	collection.insertOne(packetObj);


};
