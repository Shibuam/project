const { get } = require('express/lib/response')
const mongodb = require('mongodb')
const MongoClient = mongodb.MongoClient
const state = {
    db: null
}
<<<<<<< HEAD
module.exports.connection = function (done) {
    //  const url='mongodb://127.0.0.1:27017'    
    const dbname = 'eCommerce'
    MongoClient.connect(process.env.MONGO_URL, { useNewUrlParser: true }, (err, data) => {
        if (err) return done(err)
        state.db = data.db(dbname)
        done()
=======
module.exports.connection=function(done){
   const url='mongodb+srv://shibu:123@cluster0.jxuep.mongodb.net/eCommerce?retryWrites=true&w=majority'
    const dbname='eCommerce'
MongoClient.connect(url,{useNewUrlParser:true},(err,data)=>{
  if(err)return done (err)
 state.db=data.db(dbname)
   done()
>>>>>>> 2cd0c5795dd03f0e963cc565eb5f2f8c21deb4d5

    })
}
module.exports.get = () => {
    return state.db
}

