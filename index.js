const Telegraf = require('telegraf')
const R = require('request')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')
const { enter, leave } = Stage
const Composer = require('telegraf/composer')
const Welcome = new WizardScene('super-wizard',
  (ctx) => {
		if(ctx.session.auth){
			ctx.reply("You was login before, please logout first to relogin")
			ctx.scene.enter('greeter')
			return;
		}
    ctx.reply(`Hi ${ctx.from.username}. Before do transaction, please Login first.`, Markup.inlineKeyboard([
      Markup.callbackButton('🔑 Login', 'Login')
    ]).extra())
    return ctx.wizard.next()
  },
  (ctx) => {
    ctx.reply('What is your username?')
    return ctx.wizard.next()
  },
  (ctx) => {
		ctx.session.username = ctx.message.text
    ctx.reply('What is your password?')
    return ctx.wizard.next()
  },
  (ctx) => {
		ctx.session.password = ctx.message.text
		ctx.replyWithHTML(`This is your credential. Please check again before Sign in. Send /start or /welcome to relogin \n Username : <b>${ctx.session.username}</b> \n Password : <code>${ctx.message.text}</code>`, Markup.inlineKeyboard([
			Markup.callbackButton('🔒 Sign In', 'Sign')
		]).extra())
    return ctx.wizard.next()
	},
	(ctx)=>{
		let options = {
			'url': 'http://port-3002.devapp-abazizta633903.codeanyapp.com/user/login',
			'method' : 'POST' ,
			'headers' : {
				'Content-Type' : 'application/json'
			},
			'body' : JSON.stringify({
				username : ctx.session.username,
				password : ctx.session.password
			})
		}
		ctx.deleteMessage(ctx.update.message)
		ctx.replyWithHTML('⌛️ Loading...').then((q)=>{

		R(options, (err, res, body)=>{
			console.log(body)
			if(err){
				ctx.replyWithHTML(err + 'Please contact your adminsitrator. Or try /start again')
				return ctx.scene.leave()
			}
			else if(JSON.parse(body).code == '403'){
				ctx.replyWithHTML("Ooops!. It seems your username or password might be wrong. Plaese using /start to relogin")
				return ctx.scene.leave()

			}
			ctx.tg.deleteMessage(q.chat.id, q.message_id)
			ctx.session.auth = JSON.parse(body).auth
			ctx.session.secret = JSON.parse(body).secret
			ctx.scene.leave()
			ctx.replyWithHTML("Success. Now you can do transaction. Go to /shop for transaction")
		})
	})	
	}
)
const CheckOut = new WizardScene('checkOut', 
	(ctx)=>{
		ctx.reply('Input your phone number')
		return ctx.wizard.next()
	},
	(ctx)=>{
		ctx.session.phone = ctx.message.text
		ctx.replyWithHTML(`📇 CHECKOUT  \n	==================================== \n📦 Product Code : <b>${ctx.session.product}</b>\n👤 CustomerID/Destination : <b>${ctx.message.text}</b>`, Markup.inlineKeyboard([
			Markup.callbackButton(`Pay Rp.${ctx.session.price}`, 'Pay'),
			Markup.callbackButton(`Cancel`, 'Cancel')
		]).extra()
		)
		return ctx.wizard.next()
	},
	(ctx)=>{
		if(ctx.update.callback_query.data === 'Cancel'){
			ctx.tg.deleteMessage(ctx.chat.id, ctx.message_id)
			ctx.scene.enter('transaction')
		}
		else if(ctx.update.callback_query.data === 'Pay'){
			ctx.tg.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
			let options = {
				'url' : 'http://port-3002.devapp-abazizta633903.codeanyapp.com/trx/pulsa?res=ok_success',
				'method' : 'POST',
				'headers' : {
					'Content-type' : 'application/json',
					'auth' : ctx.session.auth,
					'secret' : ctx.session.secret
				},
				'body' : JSON.stringify({
					phone : ctx.session.phone,
					code : ctx.session.product
				})
			}	
			console.log(options)
			R(options, (err, res, body)=>{
				let Response;
				if(typeof JSON.parse(body).error == 'undefined' ){
					Response = JSON.parse(body).body.result
					ctx.replyWithHTML(`✉️ Status : ${Response.status}\n====================================\n📦 Product Code : ${ctx.session.product}\n👤 CustomerID/Destination :${Response.no_handphone}\n📱 Serial Number : ${Response.serial_number}\n🔖 ID Transaction : ${Response.trx_id}\n`)
					ctx.scene.enter('transaction')
				}
				else{
					Response = JSON.parse(body).error
					ctx.reply(JSON.parse(body).error.message)
					return;
				}
			})
		}
	}
)
CheckOut.hears('➡️ Back', (ctx)=>{
	ctx.scene.enter('transaction')
})
// Greeter scene
const greeterScene = new Scene('greeter')
greeterScene.enter((ctx) => {
	console.log(ctx.session)
	if(typeof ctx.session.auth == 'undefined'){
		ctx.reply("Ooops. You need login first. Using /start to relogin")
		ctx.scene.leave()
		return;
	}
	R(`http://port-3002.devapp-abazizta633903.codeanyapp.com/user/get?username=${ctx.session.username}`, (err, res, body)=>{
		console.log(body)
		ctx.replyWithHTML(`Information : \nHi <b>${ctx.session.username}</b>,\nBalance : <b>Rp.${new Intl.NumberFormat('en-IN').format(JSON.parse(body)[0].balance)}</b>💰`, Markup.keyboard([
			['💳 Transaction', '🔍 Search Transaction'],
			['💵 Deposit', '🚪 Logout']
		])
		.oneTime()
    	.resize()
		.extra())
	})
})
greeterScene.hears('💳 Transaction', (ctx)=>{
		ctx.scene.enter('transaction')
})
greeterScene.on('message', (ctx)=>{
	ctx.reply('OOpss')
})

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
	R.get('http://port-3000.devapp-abazizta633903.codeanyapp.com/pjson', (err, res, body)=>{
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
	console.log(ctx.session)
	ctx.scene.enter('checkOut')
})

Transaction.hears('➡️ Back', (ctx)=>{
	console.log(ctx)
	ctx.scene.enter('greeter')
})
// Echo scene
const echoScene = new Scene('ecsho')
echoScene.enter((ctx) => ctx.reply('echo scene'))
echoScene.leave((ctx) => ctx.reply('exiting echo scene'))
echoScene.command('back', leave())
echoScene.on('text', (ctx) => ctx.reply(ctx.message.text))
echoScene.on('message', (ctx) => ctx.reply('Only text messages please'))

const bot = new Telegraf('525640539:AAFgVI5wPnkKS_kv6Bm9H8igfMy1SWTtGyw')
const stage = new Stage([Welcome, CheckOut, greeterScene, Transaction])
bot.use(session())
bot.use(stage.middleware())
bot.command('shop', enter('greeter'))
bot.command('echo', enter('echo'))
bot.command('start', enter('super-wizard'))
bot.on('message', (ctx) => ctx.reply('Try /echo or /greeter'))
bot.startPolling()
bot.catch((err)=>{
	console.log(err)
})