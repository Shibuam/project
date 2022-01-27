var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const async = require('hbs/lib/async')

 const { ObjectId } = require('mongodb')
const { reject, promise } = require('bcrypt/promises')
const { response } = require('express')
module.exports = {
    doSignUp: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.isblock = false;
            userData.password = await bcrypt.hash(userData.password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data)
            })
        })

    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {

                        response.user = user
                        response.status = true
                        resolve(response)

                    }
                    else {

                        resolve({ status: false })
                    }
                })
            }
            else {

                resolve({ status: false })
            }

        })
    },
    doUser: () => {
        return new Promise(async (resolve, reject) => {
            let userDetails = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(userDetails)
        })
    },
    viewProduct: () => {
        return new Promise((resolve, reject) => {
            let products = db.get().collection(collection.PRODUCTS).find().toArray()
            resolve(products)
        })

    },
    findContact: (phoneNumber) => {
        return new Promise((resolve, reject) => {
            let contact = db.get().collection(collection.USER_COLLECTION).findOne({ phone: phoneNumber.phone })
            if (contact) {
                resolve(contact)
            }
        })

    },
    block: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(id) }, { $set: { isblock: true } }).then((data) => {
                resolve(data)
            })
        })
    },
    unblock: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(id) }, { $set: { isblock: false } }).then((data) => {
                resolve(data)
            })

        })
    },
    // viewProductMen:()=>{
    //     return new Promise((resolve,reject)=>{
    //         let productsMen=db.get().collection(collection.PRODUCTS).find({category:"Men Shoes"}).toArray()
    //         resolve(productsMen)
    //     })

    // },
    addToCart: (prodId, userId) => {
        let proObj = {
            item: ObjectId(prodId),
            quantity: 1,


        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == prodId)
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({user:ObjectId(userId), 'products.item': ObjectId(prodId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }).then(() => {
                            resolve()
                        })
                } else {




                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(userId) },
                        {
                            $push: {
                                products: proObj
                            }
                        }).then((response) => {
                            resolve()
                        })
                }
            }
            else {

                let cartObj = {
                    user: ObjectId(userId),
                    products: [proObj]

                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    viewToCart: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCTS,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()

            resolve(cartItems)
        })
    },
    cartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuntity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)


        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION).
                    updateOne({ _id: ObjectId(details.cart) },
                        {
                            $pull: { products: { item: ObjectId(details.product) } }
                        }).then((response) => {
                            resolve({ removeProduct: true })
                        })
            }
            else {
                db.get().collection(collection.CART_COLLECTION).
                    updateOne({ _id: ObjectId(details.cart), 'products.item': ObjectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }).then((response) => {
                            resolve(true)
                        })
            }
        })
    },
    remProFromCart:(cartProId)=>{
     
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION).updateOne({_id:ObjectId(cartProId.cart)},
            {
                $pull:{products:{item:ObjectId(cartProId.product)}}
            }).then(()=>{
                resolve({ removeProduct: true })
            })
        })
    },



    getTotal: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',

                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCTS,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
               
                
                {
                    $group:{
                        _id:null,
                        
                        total:{$sum:{$multiply:['$quantity','$product.mrp']}}
                    }
                },
            ]).toArray()

           
       
        

            resolve(total[0].total)
        })
    },
    cartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let  cartPro=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
            resolve(cartPro.products)
        })
        
     },
     placeOrder:(order,products,total)=>{
         return new Promise((resolve,reject)=>{
            let status=order.method==='COD'?'placed':'pending'
            let orderObj={
                deliveryDetails:{
                    mobile:order.phone,
                    pincode:order.postcode,
                    state:order.state,
                    streetName:order.streetName,
                   
                },
                userId:ObjectId(order.userId),
                method:order.method,
                status:status,
                products:products,
                total:total,
                date:new Date()
            }

            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collection.CART_COLLECTION).deleteOne({user:ObjectId(order.userId)})
                resolve()
            })
         })
     },
     getuserOrders:(userId)=>{
         return new Promise((resolve,reject)=>{
             let orderItems=db.get().collection(collection.ORDER_COLLECTION).find({userId:ObjectId(userId)}).toArray()
             resolve(orderItems)
         })
     },
     getOrderPro:(orderId)=>{
         
        

         return new Promise(async(resolve,reject)=>{
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {_id:ObjectId(orderId)}
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCTS,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()

            resolve(orderItems)

         })
     },
     cancelOrder:(orderId)=>{
         return new Promise((resolve,reject)=>{
             db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(orderId)},{$set:{status:"Canceled"}})
         })
     }
}