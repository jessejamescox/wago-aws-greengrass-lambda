/*global require,console,setTimeout */
var opcua = require("node-opcua");
var async = require("async");

var AWS = require('aws-sdk');
var iotdata = new AWS.IotData({endpoint: 'a149vimaq58p1y-ats.iot.us-west-2.amazonaws.com'});

var client = new opcua.OPCUAClient();
//var endpointUrl = 'opc.tcp://10.6.10.16:4840';
var endpointUrl = process.env.opcuaserver;
var subNodeId = process.env.subNodeId;
var pubNodeId = process.env.pubNodeId;

var writeData = 0;
var oldData = 0;

var the_session, the_subscription;
async.series([

    // step 1 : connect to
    function(callback)  {
        client.connect(endpointUrl,function (err) {
            if(err) {
                console.log(" cannot connect to endpoint :" , endpointUrl );
            } else {
                console.log("Step 1 connected !");
            }
            callback(err);
        });
    },

    // step 2 : createSession
    function(callback) {
        client.createSession( function(err,session) {
            if(!err) {
                the_session = session;
                console.log("Step 2 : Created session");
            }
            callback(err);
        });
    },
    // step 3 : browse
    function(callback) {
       the_session.browse("RootFolder", function(err,browse_result){
           if(!err) {
               browse_result[0].references.forEach(function(reference) {
                   console.log("Step 3" + reference.browseName.toString());
               });
           }
           callback(err);
       });
    },
    // subscribe to a tag indefinitely
    function(callback) {

       the_subscription =new opcua.ClientSubscription(the_session,{
           requestedPublishingInterval: 100,
           requestedLifetimeCount: 10,
           requestedMaxKeepAliveCount: 2,
           maxNotificationsPerPublish: 10,
           publishingEnabled: true,
           priority: 10
       });

       the_subscription.on("started",function(){
            console.log("subscription started for 2 seconds - subscriptionId=" + the_subscription.subscriptionId);
          }).on("keepalive",function(){
            console.log("keepalive");
          }).on("terminated",function(){
            callback();
        });
       // install monitored item
       var monitoredItem  = the_subscription.monitor({
           //nodeId: opcua.resolveNodeId("ns=4;s=|var|WAGO 750-8216 PFC200 G2 2ETH RS CAN DPS.Application.GVL.rTempF"),
           nodeId: opcua.resolveNodeId(subNodeId),
           attributeId: opcua.AttributeIds.Value
       },
       {
           samplingInterval: 100,
           discardOldest: true,
           queueSize: 10
       },
       opcua.read_service.TimestampsToReturn.Both
       );
       console.log('Attribute ID: ' + JSON.stringify(opcua.AttributeIds.value));
       console.log("-------------------------------------");

       monitoredItem.on("changed",function(dataValue){
          console.log("variable 1 = " + dataValue.value.value);
          console.log("variable 1 = " + dataValue);
            writeData = ((dataValue.value.value * 1.8) + 32);
            var nodesToWrite = [{
                //nodeId: "ns=4;s=|var|WAGO 750-8216 PFC200 G2 2ETH RS CAN DPS.Application.GVL.rDesiredTemp",
                nodeId: pubNodeId,
                attributeId: opcua.AttributeIds.Value,
                indexRange: null,
                value: { 
                    value: { 
                        dataType: opcua.DataType.Float,
                         value: writeData
                    }
                }
            }];
            if (writeData != oldData)  {
              the_session.write(nodesToWrite, function(err,statusCode,diagnosticInfo) {
                if (!err) {
                    console.log(" write ok" );
                    console.log(diagnosticInfo);
                    console.log(statusCode);
                    oldData = writeData;
                }
                var shadowObj = {state: 
                                    {reported: 
                                        {wagoPLC:
                                            {   temp_f: writeData,
                                                temp_c: dataValue.value.value,
                                            }
                                        }
                                    }
                };
                // send to the GGC Thing Shadow change
                var params = {
                    topic: '$aws/things/Wago_GG_Test_Group_Core/shadow/update',
                    payload: JSON.stringify(shadowObj),
                    qos: 0
                };
                iotdata.publish(params, function(err, data){
                    if(err){
                        console.log(err);
                    }
                    else{
                        console.log("success?");
                    }
                });
                    //callback(err);
                  });
                } 
               });
    },

    // close session
    function(callback) {
        the_session.close(function(err){
            if(err) {
                console.log("session closed failed ?");
            }
            callback();
        });
    }

],
function(err) {
    if (err) {
        console.log(" failure ",err);
    } else {
        console.log("done!");
    }
    client.disconnect(function(){});
}) ;

exports.handler = async (event) => {
    // TODO implement
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};
