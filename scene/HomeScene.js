const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
const R = require('request')

const Home = new Scene('home')
Home.enter((ctx) => {
	console.log(ctx.session)
	if(typeof ctx.session.auth == 'undefined'){
		ctx.reply("Ooops. You need login first. Using /start to relogin")
		ctx.scene.leave()
		return;
	}
	//Get Service username
	R(`http://localhost:3002/user/get?username=${ctx.session.username}`, (err, res, body)=>{
		console.log(body)
		ctx.session.iduser = JSON.parse(body)[0].id
		ctx.replyWithHTML(`Information : \nHi <b>${ctx.session.username}</b>,\nBalance : <b>Rp.${new Intl.NumberFormat('en-IN').format(JSON.parse(body)[0].balance)}</b>💰`, Markup.keyboard([
			['💳 Transaction', '🔍 Search Transaction'],
			['💵 Deposit', '🚪 Logout']
		])
		.oneTime()
    	.resize()
		.extra())
	})
})
Home.hears('💳 Transaction', (ctx)=>{
		ctx.scene.enter('transaction')
})
Home.hears('💵 Deposit', (ctx)=>{
	ctx.scene.enter('deposit')
})
Home.hears('🔍 Search Transaction', (ctx)=>{
	ctx.scene.enter('search')
})
Home.hears('🚪 Logout', (ctx)=>{
	ctx.session = null;
	ctx.replyWithHTML('Bye~')
})
Home.on('message', (ctx)=>{
	ctx.reply('OOpss')
})

module.exports = Home;