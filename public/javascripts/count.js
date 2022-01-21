function addToCart(proId){
    $.ajax({
        url:'/cart/'+proId,
        method:'get',
        success:(Response)=>{
            if(Response.status){
                let count=$('#cart-count').html()
                count=parseInt(count)+1
                $('#cart-count').html(count)
            }
           
        }
    })
   }