const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
const R = require('request')
const _ = require('lodash')

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

		//Grouping Provider
		let GroupPackage = _.groupBy(arr, 'description')
		let PackageType = Object.getOwnPropertyNames(GroupPackage)

		ctx.session.ProductList = GroupPackage

		let Provider = PackageType.map(n=>Markup.callbackButton(n, `{"userChoosen" : "${n}"}`))
		ctx.replyWithHTML(`Provider List`, Markup.inlineKeyboard([
			Provider
		]).extra())
	})
})

Transaction.on('callback_query', (ctx)=>{
	let ParseCB = JSON.parse(ctx.update.callback_query.data)

	switch(Object.getOwnPropertyNames(ParseCB)[0]){
		case 'userChoosen' :  
		ctx.session.Provider = ParseCB.userChoosen
		let ProductCode = ctx.session.ProductList[ParseCB.userChoosen]
		ctx.session.ProductCode = ProductCode

		let Product = ProductCode.map(n=>Markup.callbackButton(n.name, `{"productName" : "${n.name}"}`))
		ctx.replyWithHTML(`Provider List`, Markup.inlineKeyboard([
			Product
		]).extra())
		break;

		case 'productName' : 
		//Group Name for Getting price
		let GroupName = _.groupBy(ctx.session.ProductCode, 'name')
		ctx.session.price = GroupName[ParseCB.productName][0].supplier_price
		ctx.session.product = ParseCB.productName
		ctx.scene.enter('checkOut')
		// console.log(ctx.session.ProductCode)
		break;
	
		default : 
		ctx.replyWithHTML('Undefined command/callbacks')
		ctx.scene.leave()

	}
	return;
	// ctx.session.product = ParseCB.name
	// ctx.session.price = ParseCB.price
	// ctx.scene.enter('checkOut')
})

Transaction.hears('➡️ Back', (ctx)=>{
	console.log(ctx)
	ctx.scene.enter('home')
})

module.exports = Transaction;