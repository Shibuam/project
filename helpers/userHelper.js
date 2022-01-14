var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
const async = require('hbs/lib/async')
const { ObjectId } = require('mongodb')
const { reject, promise } = require('bcrypt/promises')
module.exports={
        doSignUp:(userData)=>{
            return new Promise(async(resolve,reject)=>{
                userData.isblock=false;
                userData.password=await bcrypt.hash(userData.password,10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data)
            })
            })
           
        },
        doLogin:(userData)=>{
                        return new Promise(async(resolve,reject)=>{
                            let loginStatus=false
                            let response={}
              let user= await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
              if(user){
                  bcrypt.compare(userData.password,user.password).then((status)=>{
                      if(status){
                         
                          response.user=user
                          response.status=true
                         resolve(response)
                        
                      }
                      else{
                        
                          resolve({status:false})
                      }
                  })
              }
              else{
               
                  resolve({status:false})
              }

            })
        },
        doUser:()=>{
            return new Promise(async(resolve,reject)=>{
                let userDetails=await db.get().collection(collection.USER_COLLECTION).find().toArray()
                resolve(userDetails)
            })
        },
        viewProduct:()=>{
            return new Promise((resolve,reject)=>{
                let products=db.get().collection(collection.PRODUCTS).find().toArray()
                resolve(products)
            })
            
        },
        findContact:(phoneNumber)=>{
            return new Promise((resolve,reject)=>{
              let contact=  db.get().collection(collection.USER_COLLECTION).findOne({phone:phoneNumber.phone})
              if(contact){
                  resolve(contact)
              }
            })

        },
        block:(id)=>{
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(id)},{$set:{isblock:true}}).then((data)=>{
                    resolve(data)
                })
            })
        },
        unblock:(id)=>{
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(id)},{$set:{isblock:false}}).then((data)=>{
                    resolve(data)
                })
                
            })
        },
  }