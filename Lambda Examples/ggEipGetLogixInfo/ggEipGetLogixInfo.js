exports.handler = async (event) => {
    var AWS = require('aws-sdk');
    var iotdata = new AWS.IotData({endpoint: 'a149vimaq58p1y-ats.iot.us-west-2.amazonaws.com'});
    
    // include the EIP libs and create an instance of the controller
    const { Controller } = require("ethernet-ip");
    const PLC = new Controller();
 
    // Controller.connect(IP_ADDR[, SLOT]) ** NOTE: SLOT = 0 (default) - 0 if CompactLogix
    PLC.connect("10.6.10.213", 0).then(() => {
        //var plcObj = JSON.parse(PLC.properties);
        var shadowObj = {state: 
                            {reported: 
                                {logixPLC:
                                    {
                                        name: PLC.properties.name,
                                        serial_number: PLC.properties.serial_number, 
                                        slot: PLC.properties.slot,
                                        time: PLC.properties.time, // last read controller WallClock datetime
                                        version: PLC.properties.version, // eg "30.11"
                                        faulted: PLC.properties.faulted,  // will be true if any of the below are true
                                        minorRecoverableFault: PLC.properties.minorRecoverableFault,
                                        minorUnrecoverableFault: PLC.properties.minorUnrecoverableFault,
                                        majorRecoverableFault: PLC.properties.majorRecoverableFault,
                                        majorUnrecoverableFault: PLC.properties.majorUnrecoverableFault,
                                        io_faulted: Boolean
                                    }
                                }
                            }
        };
        // send to the GGC Thing Shadow
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
    console.log(PLC.properties);
    });
};
