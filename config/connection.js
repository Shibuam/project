const { get } = require('express/lib/response')
const mongodb=require('mongodb')
const MongoClient=mongodb.MongoClient
const state={
    db:null
}
module.exports.connection=function(done){
   const url='mongodb+srv://shibu:123@cluster0.jxuep.mongodb.net/eCommerce?retryWrites=true&w=majority'
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

