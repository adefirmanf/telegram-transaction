const WizardScene = require('telegraf/scenes/wizard')
const Markup = require('telegraf/markup')
const R = require('request')
	
const Login = new WizardScene('super-wizard',
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
		ctx.tg.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
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
		ctx.tg.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
		let options = {
			//Transaction  Service | Login
			'url': 'http://localhost:3002/user/login',
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
				ctx.replyWithHTML('<code>' + err + '</code>' +  '\nPlease contact your adminsitrator. Or try /start to re-login')
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
			ctx.replyWithHTML("Success. Now you can do transaction.")
			ctx.scene.enter('home')
		})
	})	
	}
)

module.exports = Login;