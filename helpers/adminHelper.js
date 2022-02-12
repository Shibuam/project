var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const async = require('hbs/lib/async')
var objectId = require('mongodb').ObjectId
const { reject, promise } = require('bcrypt/promises')
const { ObjectId } = require('mongodb')
const res = require('express/lib/response')
module.exports = {
    addProduct: (proDetails) => {
        proDetails.mrp = parseInt(proDetails.mrp)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCTS).insertOne(proDetails).then((dataId) => {
                resolve(dataId)
            })
        })
    },
    viewProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCTS).find().toArray()
            resolve(products)
        })
    },
    deleteProduct: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCTS).deleteOne({ _id: ObjectId(productId) })
            resolve(productId)
        })
    },
    editProducts: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCTS).findOne({ _id: ObjectId(productId) }).then((data) => {
                resolve(data)
            })
        })
    },
    updateProduct: (proId, proData) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCTS).updateOne({ _id: ObjectId(proId) }, {
                $set: {
                    name: proData.name,
                    category:proData.category,
                    SubCategory:proData.SubCategory,
                    text: proData.Size,
                    lanCost: proData.lanCost,
                    mrp: proData.mrp,
                    colour: proData.colour,
                    qty: proData.qty
                }
            }
            ).then((data) => {
                resolve(data)
            })

        })
    },
    adminLogin: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADMIN).findOne().then((data) => {
                resolve(data)
            })
        })
    },
    addCategory: (category) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).insertOne(category).then(() => {
                resolve()
            })
        })
    },
    viewCategory: () => {
        return new Promise((resolve, reject) => {
            let category = db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
            resolve(category)

        })
    },
    addSubCategory: (categorydetails) => {
        return new Promise((resolve, reject) => {
            console.log(categorydetails.category);
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ category: categorydetails.category }, { $push: { subCategory: categorydetails.subCategory } }).then(() => {
                resolve()
            })  
        })
    },
    viewSubCategory: (id) => {
        return new Promise(async (resolve, reject) => {
            let Subcategory = await db.get().collection(collection.SUB_CATEGORY_COLLECTION).find({category:id}).toArray()
            resolve(Subcategory)

        })
    },

    Subcategory:()=>{
            return new Promise((resolve,reject)=>{
                let sub=db.get().collection(collection.SUB_CATEGORY_COLLECTION).find().toArray()
                resolve(sub)
            })
    },

    deleteSubCategory: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.SUB_CATEGORY_COLLECTION).deleteOne({ _id: ObjectId(id) }).then((result) => {
                resolve(result)
            })
        })
    },
    deleteCategory: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ _id: ObjectId(id) }).then((result) => {
                resolve(result)
            })
        })
    },
    addingSubCategory:(addingSubCat)=>{
        return new Promise((resolve,reject)=>{
                db.get().collection(collection.SUB_CATEGORY_COLLECTION).insertOne(addingSubCat)
        })
    },
    viewProductsDetails:(ProId)=>{
        return new Promise((resolve,reject)=>{
         let   proDetails=db.get().collection(collection.PRODUCTS).findOne({_id:ObjectId(ProId)})
         resolve(proDetails)
        })
    },
    orderMng:()=>{
        return new Promise(async(resolve,reject)=>{
          let  orderList=await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            resolve(orderList)
        })
    },
    addBanner:(banner)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.BANNER_COLLECTION).insertOne(banner).then((bannerId)=>{
               
                resolve(bannerId)
            })
        })
    },
    updateStatus:(status,id)=>{
        return new  Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(id)},{$set:{status:status}}).then(()=>{
                resolve()
            })
        
        })
    },
    addOffer:(offer)=>{
        offer.percentage=parseFloat(offer.percentage)
        return new Promise(async(resolve,reject)=>{
           await db.get().collection(collection.OFFER_COLLECTION).insertOne(offer)
           resolve()
        })
    },
    viewOffer:()=>{
        return new Promise(async(resolve,reject)=>{
        let offer=    await db.get().collection(collection.OFFER_COLLECTION).find().toArray()
        resolve(offer)
        })
    }
}
   