const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
const R = require('request')

const Transaction = new Scene('transaction')
Transaction.enter((ctx)=>{
	ctx.replyWithHTML(`Choose type transaction`, Markup.keyboard([
		['📱 Phone', '🌐 Internet Package', '➡️ Back']
	])
	.oneTime()
	.resize()
	.extra())
})

Transaction.hears('📱 Phone', (ctx)=>{
	//Get Service JSON Product
	R.get('http://localhost:3000/pjson', (err, res, body)=>{
		let arr = JSON.parse(body).product
		let Product = arr.map(n=>Markup.callbackButton(n.name, `{"name" : "${n.name}", "price" : "${n.main_price}"}`))
		ctx.replyWithHTML(`Product List`, Markup.inlineKeyboard([
			Product
		]).extra())
	})
})

Transaction.on('callback_query', (ctx)=>{
	let ParseCB = JSON.parse(ctx.update.callback_query.data)
	ctx.session.product = ParseCB.name
	ctx.session.price = ParseCB.price
	ctx.scene.enter('checkOut')
})

Transaction.hears('➡️ Back', (ctx)=>{
	console.log(ctx)
	ctx.scene.enter('home')
})

module.exports = Transaction;