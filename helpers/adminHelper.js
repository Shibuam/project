var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const async = require('hbs/lib/async')
var objectId = require('mongodb').ObjectId
const { reject, promise } = require('bcrypt/promises')
const { ObjectId } = require('mongodb')
const res = require('express/lib/response')
const { cookie } = require('express/lib/response')
module.exports = {
    addProduct: (proDetails) => {
        proDetails.mrp = parseInt(proDetails.mrp)
        proDetails.offer = false
        proDetails.ProductOffer = true
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
                    category: proData.category,
                    SubCategory: proData.SubCategory,
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

            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({ category: categorydetails.category }, { $push: { subCategory: categorydetails.subCategory } }).then(() => {
                resolve()
            })
        })
    },
    viewSubCategory: (id) => {
        return new Promise(async (resolve, reject) => {
            let Subcategory = await db.get().collection(collection.SUB_CATEGORY_COLLECTION).find({ category: id }).toArray()
            resolve(Subcategory)

        })
    },

    Subcategory: () => {
        return new Promise((resolve, reject) => {
            let sub = db.get().collection(collection.SUB_CATEGORY_COLLECTION).find().toArray()
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
    addingSubCategory: (addingSubCat) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.SUB_CATEGORY_COLLECTION).insertOne(addingSubCat)
        })
    },
    viewProductsDetails: (ProId) => {
        return new Promise((resolve, reject) => {
            let proDetails = db.get().collection(collection.PRODUCTS).findOne({ _id: ObjectId(ProId) })
            resolve(proDetails)
        })
    },
    orderMng: () => {
        return new Promise(async (resolve, reject) => {
            let orderList = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            resolve(orderList)
        })
    },
    addBanner: (banner) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.BANNER_COLLECTION).insertOne(banner).then((bannerId) => {

                resolve(bannerId)
            })
        })
    },
    updateStatus: (status, id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(id) }, { $set: { status: status } }).then(() => {
                resolve()
            })

        })
    },
    addOffer: (offer) => {

        offer.percentage = parseFloat(offer.percentage)
        return new Promise(async (resolve, reject) => {


            let exist = await db.get().collection(collection.OFFER_COLLECTION).findOne({ category: offer.category })

            if (exist == null) {
                await db.get().collection(collection.OFFER_COLLECTION).insertOne(offer).then(async (offerId) => {
                    let offerData = await db.get().collection(collection.OFFER_COLLECTION).findOne({ _id: offerId.insertedId })

                    let id = offerData._id
                    let percentage = offerData.percentage
                    let category = offerData.category
                    let expireDate = offerData.expireDate

                    let product = await db.get().collection(collection.PRODUCTS).aggregate([
                        {
                            $match: { $and: [{ category: category }, { offer: false }] }
                        }]).toArray()
                    await product.map(async (pro) => {

                        let productPrice = pro.mrp
                        let offerPrice = productPrice - ((productPrice * percentage) / 100)
                        offerPrice = parseInt(offerPrice.toFixed(2))
                        let proId = pro._id + ''
                        db.get().collection(collection.PRODUCTS).update({ _id: objectId(proId) },
                            {
                                $set: {
                                    mrp: offerPrice,
                                    offer: true,
                                    OldPrice: productPrice,
                                    offerPercentage: parseInt(percentage)

                                }
                            })
                    })


                })
                resolve({ data: '*Offer added successfully' })
            }
            else {
                resolve({ data: '*This category offer already exist' })
            }
        })

    },
    viewOffer: () => {
        return new Promise(async (resolve, reject) => {
            let offer = await db.get().collection(collection.OFFER_COLLECTION).find().toArray()
            resolve(offer)
        })
    },
    cancelOffer: (category) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.OFFER_COLLECTION).deleteOne({ category: category })
            let data = await db.get().collection(collection.PRODUCTS).find({ category: category }).toArray()

            await data.map(async (eachField) => {
                await db.get().collection(collection.PRODUCTS).update({ category: category },
                    {
                        $set: {
                            mrp: eachField.OldPrice,
                            offer: false,
                            offerPercentage: '',

                        }
                    })

            })
            resolve({ data: 'Offer cancel Successfully' })
        })

    },
    addOfferProduct: (offer) => {
        offer.percentage = parseFloat(offer.percentage)
        return new Promise(async (resolve, reject) => {


            let exist = await db.get().collection(collection.OFFER_COLLECTION).findOne({ product: offer.product })

            if (exist == null) {
                await db.get().collection(collection.OFFER_COLLECTION).insertOne(offer).then(async (offerId) => {
                    let offerData = await db.get().collection(collection.OFFER_COLLECTION).findOne({ _id: offerId.insertedId })

                    let id = offerData._id
                    let percentage = offerData.percentage
                    let product = offerData.product
                    let expireDate = offerData.expireDate

                    let products = await db.get().collection(collection.PRODUCTS).aggregate([
                        {
                            $match: { $and: [{ name: product }, { productOffer: false }] }
                        }]).toArray()
                    await products.map(async (pro) => {

                        let productPrice = pro.mrp
                        let offerPrice = productPrice - ((productPrice * percentage) / 100)
                        offerPrice = parseInt(offerPrice.toFixed(2))
                        let proId = pro._id + ''
                        db.get().collection(collection.PRODUCTS).update({ _id: objectId(proId) },
                            {

                                $set: {
                                    mrp: offerPrice,
                                    productOffer: true,
                                    OldPrice: productPrice,
                                    offerPercentage: parseInt(percentage)

                                }
                            })
                    })


                })
                resolve({ data: '*Offer added successfully' })
            }
            else {
                resolve({ data: '*This Product offer already exist' })
            }
        })
    },
    cancelOfferOfPro: (product) => {

        return new Promise(async (resolve, reject) => {
            let result = await db.get().collection(collection.OFFER_COLLECTION).deleteOne({ product: product })

            let data = await db.get().collection(collection.PRODUCTS).find({ name: product }).toArray()

            await data.map(async (eachField) => {
                await db.get().collection(collection.PRODUCTS).updateOne({ name: product },
                    {
                        $set: {
                            mrp: eachField.OldPrice,
                            productOffer: false,
                            offerPercentage: '',

                        }
                    })

            })
            resolve({ data: 'Offer cancel Successfully' })
        })

    },
    addCoupon: (coupon) => {

        coupon.amount = parseInt(coupon.amount)
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.COUPON_COLLECTION).insertOne(coupon)
            resolve()
        })
    },
    viewCoupon: () => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.COUPON_COLLECTION).find().toArray().then((data) => {
                resolve(data)
            })
        })
    },
    number: () => {
        return new Promise(async (resolve, reject) => {
            let count = await db.get().collection(collection.USER_COLLECTION).count()
            resolve(count)
        })
    },
    total: () => {
        return new Promise(async (resolve, reject) => {
            let grandTotal = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $group: {
                        _id: null,
                        netTotal: { $sum: "$total" }
                    }
                }]).toArray()

            resolve(grandTotal[0].netTotal)
        })
    },
    totalPro: () => {
        return new Promise(async (resolve, reject) => {
            let test = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $unwind: "$products"
                },
                {

                    $group: {
                        _id: null,
                        totalQuatity: { $sum: "$products.quantity" }

                    }

                }

            ]).toArray()

            resolve(test[0].totalQuatity)
        })
    },
    profit: (total) => {
        return new Promise((resolve, reject) => {
            let profit = total * .12
            resolve(profit)
        })
    },
    yearlyReport: (date) => {
        let startDate = date.startDate
        let endDate = date.endDate
        return new Promise(async (resolve, reject) => {
            let data = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $unwind: "$products"
                },
                {
                    $project: {
                        productItem: "$products.item", quantity: "$products.quantity", purchaseDate: "$date", saleStatus: "$products.status"
                    }

                },
                {
                    $match: {
                        saleStatus: {
                            $ne: 'cancel'
                        },
                        purchaseDate: {
                            $gte: new Date(startDate),


                            $lte:
                                new Date(endDate)

                        }
                    }

                },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'productItem',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $unwind: "$product"


                },
                {
                    $project: {
                        name: '$product.name', price: '$product.mrp', quantity: '$quantity', productId: '$product.name', category: "$product.category"
                    }

                },
                {


                    $group: {
                        _id: '$productId',
                        //      _id:"$category",
                        quantity: { $sum: '$quantity' },
                        totalPrice: { $sum: "$price" },
                        price: { $first: "$price" }


                    }

                },
                {
                    $project: {
                        name: '$_id', quantity: '$quantity', subtotal: "$totalPrice", price: "$price"
                    }
                }


            ]).toArray()

            resolve(data)  
        })  
    },
    monthly: (mon) => {    
        let startDate = mon.month + '-01' 
        let endDate = mon.month + '-31'

        return new Promise(async (resolve, reject) => {
            let result = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $unwind: "$products"


                },
                {
                    $project: {
                        productItem: "$products.item", quantity: "$products.quantity", purchaseDate: "$date", saleStatus: "$products.status"
                    }

                },


                {
                    $match: {
                        saleStatus: {           
                            $ne: 'cancel'
                        },
                        purchaseDate: {
                            $gte: new Date(startDate),


                            $lte:
                                new Date(endDate)

                        }    
                    }

                },      
                {
                    $lookup: {
                        from: "products",
                        foreignField: '_id',
                        localField: 'productItem',
                        as: 'product'
                    }
                },
                {
                    $unwind: '$product'

                },
                {
                    $project: {
                        name: '$product.name', unitPrice: '$product.mrp', quantity: '$quantity',
                    }
                },
                {
                    $group: {
                        _id: '$name',
                        subTotal: { $sum: '$unitPrice' },
                        quantity: { $sum: '$quantity' },
                        price: { $first: '$unitPrice' }
                    }
                }


            ]).toArray()

            resolve(result)
        })
    },
    piChart: () => {
        return new Promise(async (resolve, reject) => {
            let pi = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {

                    $group: { _id: "$method", count: { $sum: 1 } }

                }


            ]).toArray()
            data = []
            for (i = 0; i < pi.length; i++) {
                data[i] = pi[i].count
            }

            resolve(data)

        })
    },
    lineChart: () => {
        return new Promise(async (resolve, reject) => {
            let result = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $unwind: '$products'
                },
                {
                    $lookup: {
                        from: 'products',
                        foreignField: '_id',
                        localField: 'products.item',
                        as: 'product'
                    }


                },
                {
                    $unwind: "$product"
                },
                {
                    $group: {
                        _id: '$product.category',
                        count: { $sum: 1 }
                    }
                },





            ]).toArray()

            var opt = []
            for (i = 0; i < result.length; i++) {
                opt.push([result[i]._id, result[i].count])
            }
         
            resolve(opt)
        })
    }
}

   

