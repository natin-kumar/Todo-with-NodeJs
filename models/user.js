const mongoose= require('mongoose');
const userSchema= new mongoose.schema({
    name:String,
    mail:String,
    password:String
});
const userData = mongoose.model('userData',userSchema);
module.exports=userData