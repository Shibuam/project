var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const async = require('hbs/lib/async')

const { ObjectId } = require('mongodb')
const { reject, promise } = require('bcrypt/promises')
const { response } = require('express')
var Razorpay = require('razorpay')
const crypto = require('crypto')
const { resolve } = require('path')
const { log } = require('console')

var instance = new Razorpay({
    key_id: 'rzp_test_LmbUUpofYaXAqd',
    key_secret: 'XZaQuRjHmlfN39K9lqL56ycV',
});
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
    viewProduct: (category) => {
        console.log(category);
        
        return new Promise(async(resolve, reject) => {
            if(category=='all'){
          let products=await db.get().collection(collection.PRODUCTS).find({}).toArray()
          console.log(products);
          resolve(products)
            }
            else{
            let products =await db.get().collection(collection.PRODUCTS).find({category:category}).toArray()
            console.log(products);
        
            resolve(products)
            }
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
    //add to cart.............................................................................................................................................................
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
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(userId), 'products.item': ObjectId(prodId) },
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

    // add to wish list..............................................................................................................................................
    addToWishlist: (proId, userId) => {


        let proObj = {
            item: ObjectId(proId),

        }
        return new Promise(async (resolve, reject) => {
            let wishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: ObjectId(userId) })
            //checking is there any wish list......................................................................................................          
            if (wishlist) {

                let proExist = wishlist.products.findIndex(product => product.item == proId)
                console.log("position of data", proExist)
                //checking same product alredy in wish list?................................................................................................
                if (proExist == -1) {
                    await db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: ObjectId(userId) }, { $push: { products: proObj } }).then(() => {
                
                   resolve({productAddedToWishList:true})
                    })
                }
                else{
                    resolve({ProductAllreadyInWishList:true})
                }
             
            }

//    corrently there is no wish list.............................................
            else {
             
                let wishlistObj = {
                    user: ObjectId(userId),
                    products: [proObj]
                }
                await db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishlistObj).then(() => {
                
                    resolve({newWishListCollectionCreated:true})
                })
            }
        })

    },
 wishListCount:(userId)=>{
     
     return new Promise(async(resolve,reject)=>{
      let count=0
         let data=null
          data=await db.get().collection(collection.WISHLIST_COLLECTION).findOne({user:ObjectId(userId)})
          console.log(data)
         if(data){

             count=data.products.length


         }
         resolve(count)
     })

 },
 viewToWishList:(userId)=>{
    return new Promise(async(resolve,reject)=>{
    let wishList=    await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
            {
                $match:{user:ObjectId(userId)}
            },
            {
               $unwind:'$products' 
            },
            {
                $project:{
                    item:'$products.item',
                }
            },
            {
                $lookup:{
                    from:collection.PRODUCTS,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'
                }
            },
            {
                $project:{
                    item:1,product:{$arrayElemAt:['$product',0]}
                }
            }

        ]).toArray()
        resolve(wishList)
    })
 },
 removeFromWishList:(prodId,userId)=>{
return  new Promise(async(resolve,reject)=>{
await db.get().collection(collection.WISHLIST_COLLECTION).updateOne({user:ObjectId(userId)},{$pull:{products:{item:ObjectId(prodId)}}}).then((response)=>{
    resolve(response)
})

})
 },
 addToCartFromWishList:(userId,prodId)=>{
    let proObj = {
        item: ObjectId(prodId),
        quantity: 1,


    }
    return new Promise(async (resolve, reject) => {
        let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
        if (userCart) {
            let proExist = userCart.products.findIndex(product => product.item == prodId)
            if (proExist != -1) {
                db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(userId), 'products.item': ObjectId(prodId) },
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
    remProFromCart: (cartProId) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectId(cartProId.cart) },
                {
                    $pull: { products: { item: ObjectId(cartProId.product) } }
                }).then(() => {
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
                    $group: {
                        _id: null,

                        total: { $sum: { $multiply: ['$quantity', '$product.mrp'] } }
                    }
                },
            ]).toArray()





            resolve(total[0].total)
        })
    },
    cartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartPro = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            resolve(cartPro.products)
        })

    },
    placeOrder: (address, method, products, total) => {
        console.log(products)
        for (i = 0; i < products.length; i++) {
            products[i].status = method === 'COD' ? 'placed' : 'pending'
            products[i].cancel = false

        }
        console.log("after", products)
        return new Promise((resolve, reject) => {
            //       let status = method === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    name: address.name,
                    mobile: address.phone,
                    pincode: address.post,
                    state: address.state,
                    streetName: address.city,

                },
                userId: ObjectId(address.userId),
                method: method,

                products: products,
                total: total,
                date: new Date()
            }

            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                // if (order.status == 'placed') {
                //     db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectId(order.userId) })
                // }

                resolve(response.insertedId)
            })
        })
    },
    getuserOrders: (userId) => {
        return new Promise((resolve, reject) => {
            let orderItems = db.get().collection(collection.ORDER_COLLECTION).find({ userId: ObjectId(userId) }).toArray()
            resolve(orderItems)
        })
    },
    getOrderPro: (orderId) => {



        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectId(orderId) }
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
    cancelOrder: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) }, { $set: { status: "Canceled" } })
        })
    },
    viewBanner: () => {
        return new Promise(async (resolve, reject) => {
            let banner = await db.get().collection(collection.BANNER_COLLECTION).find().toArray()
            resolve(banner)
        })
    },
    women: () => {
        return new Promise((resolve, reject) => {
            let data = db.get().collection(collection.PRODUCTS).find({ category: "Ladies Shoes" }).toArray()
            resolve(data)
        })

    },
    men: () => {
        return new Promise((resolve, reject) => {
            let data = db.get().collection(collection.PRODUCTS).find({ category: "Men Shoes" }).toArray()
            resolve(data)
        })

    },
    kids: () => {
        return new Promise((resolve, reject) => {
            let data = db.get().collection(collection.PRODUCTS).find({ category: "Kids Shoes" }).toArray()
            resolve(data)
        })

    },
    generateRazorpay: (orderId, total) => {

        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,
                currency: "INR",
                receipt: "" + orderId

            };
            instance.orders.create(options, function (err, order) {

                resolve(order)
            });

        })
    },
    verifyPay: (data) => {
        return new Promise((resolve, reject) => {
            let hmac = crypto.createHmac('sha256', 'XZaQuRjHmlfN39K9lqL56ycV')
            hmac.update(data['payment[razorpay_order_id]'] + '|' + data['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if (hmac == data['payment[razorpay_signature]']) {
                resolve()
            }
            else {
                reject()
            }
        })
    },
    // changeOrderStatus: (orderId) => {
    //     return new Promise((resolve, reject) => {
    //         db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) }, { $set: { status: 'placed' } }).then(() => {
    //             resolve()
    //         })

    //     })
    // },
    productRemoveFromCart: (userId, orderid) => {

        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderid) }, { $set: { status: 'placed' } }).then(() => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectId(userId) }).then(() => {
                    resolve()
                })
            })
        })
    },
    updateProfile: (userId, updatedData) => {
        return new Promise((resolve, reject) => {
            let update = db.get().collection(collection.USER_COLLECTION).
                updateOne({ _id: ObjectId(userId) }, {
                    $set:
                    {
                        firstname: updatedData.firstname,
                        gender: updatedData.gender,
                        email: updatedData.email,
                        phone: updatedData.phone
                    }
                })
            resolve(update)
        })
    },
    PasswordChecking: (data, user) => {
        return new Promise(async (resolve, reject) => {

            let result = await bcrypt.compare(data, user.password)
            console.log(result);
            resolve(result)



        })
    },
    updatePassword: (password, userId) => {

        return new Promise(async (resolve, reject) => {
            password = await bcrypt.hash(password, 10)
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, { $set: { password: password } }).then(() => {
                resolve()
            })

        })
    },
    addAddress: (address) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).insertOne(address).then(() => {
                resolve()
            })
        })
    },


    viewAddress: (userId) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.ADDRESS_COLLECTION).find({ userId: userId }).toArray()
            resolve(address)
        })
    },
    deleteAddress: (addressId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).deleteOne({ _id: ObjectId(addressId) }).then(() => {
                resolve()
            })
        })
    },
    findAddress: (addressId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADDRESS_COLLECTION).findOne({ _id: ObjectId(addressId) }).then((data) => {
                resolve(data)
            })
        })
    },
    editAddress: (data, id) => {
        db.get().collection(collection.ADDRESS_COLLECTION).updateOne({ _id: ObjectId(id) }, {
            $set:
            {
                userId: data.userId,
                name: data.name,
                phone: data.phone,
                city: data.city,
                state: data.state,
                post: data.post,
                addressType: data.addressType


            }
        }).then(() => {
            resolve()
        })
    },
    findOneAddress: (addressId) => {
        console.log(addressId, "adddrewrfetgwegerg")
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.ADDRESS_COLLECTION).findOne({ _id: ObjectId(addressId) }).then((address) => {
                console.log(address)
                resolve(address)
            })

        })
    }

}