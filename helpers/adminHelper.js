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


                let exist=await db.get().collection(collection.OFFER_COLLECTION).findOne({category:offer.category})
            console.log(exist)
                if(exist==null){
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
            resolve({data:'*Offer added successfully'} )
        }
        else{
resolve({data:'*This category offer already exist'})
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
        return new Promise(async(resolve, reject) => {
               await db.get().collection(collection.OFFER_COLLECTION).deleteOne({category:category})
               let data= await db.get().collection(collection.PRODUCTS).find({category:category}).toArray()

              await data.map(async(eachField)=>{
                await db.get().collection(collection.PRODUCTS).update({category:category},
                    {
                        $set:{
                            mrp:eachField.OldPrice,
                            offer:false,
                            offerPercentage:'',
                            
                        }
                    })
            
               })
               resolve({data:'Offer cancel Successfully'})
        })
       
    },
    addOfferProduct:(offer)=>{
        offer.percentage = parseFloat(offer.percentage)
        return new Promise(async (resolve, reject) => {


                let exist=await db.get().collection(collection.OFFER_COLLECTION).findOne({product:offer.product})
            console.log(exist)
                if(exist==null){
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
            resolve({data:'*Offer added successfully'} )
        }
        else{
resolve({data:'*This Product offer already exist'})
        }
        })
    },
}


/*

addCategoryOffer: (offer) => {


        let category = offer.offerItem
        console.log("category",category);


        return new Promise(async (resolve, reject) => {
            let offerExist = await db.get().collection(collection.CATEGORY_OFFER).findOne(
                { offerItem: category }
            )
            console.log("offer Exist   :", offerExist);
            if (offerExist) {
                resolve({ Exist: true })
            } else {


                db.get().collection(collection.CATEGORY_OFFER).insertOne(offer).then(async (data) => {
                   let activeOffer=await db.get().collection(collection.CATEGORY_OFFER).findOne({_id:data.insertedId})
                   console.log("activeOfferactiveOfferactiveOfferactiveOfferactiveOfferactiveOffer",activeOffer);
                    let Id = activeOffer._id
                    let discount = activeOffer.discount
                    let category =activeOffer.offerItem
                    let validity = activeOffer.validity






                    let items = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([{
                        $match: { $and: [{ category: category }, { offer: false }] }
                    }]).toArray()
                   console.log("itemsitemsitemsitemsitemsitemsitems",items);

                    await items.map(async (product) => {


                        let productPrice = product.price


                        let offerPrice = productPrice - ((productPrice * discount) / 100)
                        offerPrice = parseInt(offerPrice.toFixed(2))
                        let proId = product._id + ""

                        await db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
                            {
                                _id: ObjectId(proId)

                            },
                            {
                                $set: {
                                    price: offerPrice,
                                    offer: true,
                                    OldPrice: productPrice,
                                    offerPercentage: parseInt(discount)
                                }
                            })
                    })


                    let Item2 = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([{
                        $match: { $and: [{ category: category }, { ProductOffer: true }] }
                    }]).toArray()



                    if (Item2[0]) {

                        await Item2.map(async (product) => {



                            let ProdName = product.name
                            console.log('********', ProdName, '^^^^^^^^^^^^^^^^^^^^^^^^');
                            proOFF = await db.get().collection(collection.PRODUCT_OFFER).aggregate([
                                {
                                    $match: { items: { $regex: ProdName, $options: 'i' } }
                                }]).toArray()
                            console.log('===============', proOFF[0], '================');
                            let proOffPercentage = parseInt(proOFF[0].discount)

                            console.log('PERCNETAGE OOOOOOOOOOOOOOOOOO', proOffPercentage, 'LLLLL', 'disount', discount);
                            console.log(discount);
                            console.log(proOffPercentage);
                            Discount = parseInt(discount)

                            let BSToFF = proOffPercentage < discount ? discount : proOffPercentage
                            let prize = product.OldPrice
                            let offerrate = prize - ((prize * BSToFF) / 100)
                            console.log(`thisis bst off${BSToFF}`);

                            console.log(BSToFF);
                            // let idfPro = product._id + ""
                            // console.log(idfPro);
                            db.get().collection(collection.PRODUCT_COLLECTION).updateOne(
                                {
                                    _id: ObjectId(product._id)

                                },
                                {
                                    $set: {
                                        price: offerrate,
                                        offer: true,
                                        OldPrice: prize,
                                        offerPercentage: parseInt(BSToFF)
                                    }
                                }
                            )


                        })


                    } else {
                    }

                    resolve({ Exist: false })
                })
            }
        })
    },

*/