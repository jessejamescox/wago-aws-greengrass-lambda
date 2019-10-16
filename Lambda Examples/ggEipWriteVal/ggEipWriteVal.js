exports.handler = async (event) => {
    console.log(JSON.stringify(event));
    console.log("Message Value : " + event.value);
    // TODO implement
        const { Controller, Tag, EthernetIP } = require("ethernet-ip");
        const { DINT, BOOL } = EthernetIP.CIP.DataTypes.Types;
         
        const PLC = new Controller();
         
        // Create Tag Instances here
        const dummyTag = new Tag("dummyTag", null, DINT); // Controller Scope Tag
         
        PLC.connect("10.6.10.213", 0).then(async () => {
         
            // First way to write a new value
            dummyTag.value = event.value;
            await PLC.writeTag(dummyTag);
         
            // Second way to write a new value
            await PLC.writeTag(dummyTag);
         
            console.log(dummyTag.value);
        });
    return;
};
