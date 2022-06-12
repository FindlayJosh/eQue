
const select = new SlimSelect({
    select: '#trackManager',
    placeholder: 'Choose Genres'
})

document.onchange = function(){
    console.log(select.selected())
    document.querySelector('#invisSelect').value = select.selected() 
}
