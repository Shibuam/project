function changeQuantity(cartId,proId,count){
   
   let  quantity=document.getElementById(proId).innerHTML
  
$.ajax({
    url:'/change-product-quantity',
    data:{
        cart:cartId,
        product:proId,
        count:count,
        quantity:quantity
    },
    method:'post',
    success:(response)=>{
        location.reload()
        if(response.removeProduct){
            alert("Product removed from cart")
         
        }
       
        else{
            document.getElementById(proId).innerHTML=quantity+count
        }
    }
})
}
