var request = require('request');
var http = require('http');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');



// before using these, you need to make sure the relevant environment variables are set in your env
secret = process.env.PC_API_SECRET;
id = process.env.PC_API_ID;


contactListId = '';
tokentemp= '';


global.stoken_type = "";
global.saccess_token = "";


app.use(bodyParser.json());
app.use(express.static(__dirname));

var sessionMap = {};

// Simple function to test that the server is up and reachable
app.get("/", function(req, res){
    console.log("GET /");
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('Nothing here');
})

//This and the following calls correspond to the Bridge Actions
app.post("/GetContactByPhoneNumber", function(req, res){
    console.log("POST /GetContactByPhoneNumber");
    sNumber = req.body.PhoneNumber;
    sListID = req.body.CustomAttribute;
    console.log(sNumber);
    insertIntoList(null, sListID, sNumber);
    }
)


app.post("/GetMostRecentOpenCaseByContactId", function(req, res) {
    console.log("GET /GetMostRecentOpenCaseByContactId");
    sCaseID = req.body.ContactId;
    console.log(sCaseID);

//temporarily hardcoded response for all cases
    res.json({

              "Case": {
                "AssigneeId": "Assignee",
                "ContactId": "14000874423",
                "ContactName": "Rachel",
                "Id": "14000509130",
                "Status": "Ready for pickup",
                "Subject": "Woohoo.. Your Freshdesk Test Mail"
                }
              
    });

})



function insertIntoList(error, sListID, sNumber){    

    var added = false;
    
    var contactData = [
    {
        "contactListId": sListID,
        "data": {
            "Name": 'IVRcaller',
            "Number": sNumber
        },
        "callable": true
    }
    ];

    request.post({
        url: 'https://api.mypurecloud.com.au/api/v1/outbound/contactlists/'
                                                            +sListID+'/contacts',
        headers: {
            'Authorization': global.stoken_type + " " + global.saccess_token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactData)}, 
        function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(JSON.stringify(JSON.parse(body), null, 2)+'worked'
                                            +global.stoken_type+ ' '+global.saccess_token);
            
        }else{
            console.log(error + ' error, ' + response.statusCode + JSON.stringify(JSON.parse(body)));
            
            renewToken(insertIntoList, sListID, sNumber);
            return error;
        }

        
    });
    
}


function handleTokenCallback(body){

    global.stoken_type = body.token_type;
    global.saccess_token = body.access_token;


    var options = {
      url: 'https://api.mypurecloud.com.au/api/v1/authorization/roles',

      headers: {
        'Authorization': body.token_type + " " + body.access_token
        },
      };

}

// Authentication - receive response and handle token in another function

function renewToken(callback, sListID, sNumber){

    request.post({
        url:'https://login.mypurecloud.com.au/token', 
        form: {grant_type:'client_credentials'}}, 
        function(err,httpResponse,body){
            if(err == null){
                handleTokenCallback(JSON.parse(body));
                console.log("No err: ", JSON.parse(body));
                callback(null, sListID, sNumber);
            }
            else {
                console.log("Error: ", err);
            }
    }).auth(id,secret,true);

}


var httpServer = http.createServer(app);
httpServer.listen('8085');