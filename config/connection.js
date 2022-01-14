const { get } = require('express/lib/response')
const mongodb=require('mongodb')
const MongoClient=mongodb.MongoClient
const state={
    db:null
}
module.exports.connection=function(done){
    const url='mongodb://127.0.0.1:27017'
    const dbname='eCommerce'
MongoClient.connect(url,{useNewUrlParser:true},(err,data)=>{
  if(err)return done (err)
 state.db=data.db(dbname)
   done()

})
}
module.exports.get=()=>{
    return state.db
    }

