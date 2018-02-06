const WizardScene = require('telegraf/scenes/wizard')
const Markup = require('telegraf/markup')
const R = require('request')

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
				//Transaction Service
				'url' : 'http://localhost:3002/trx/pulsa?res=ok_success',
				'method' : 'POST',
				'headers' : {
					'Content-type' : 'application/json',
					'auth' : ctx.session.auth,
					'secret' : ctx.session.secret
				},
				'body' : JSON.stringify({
					phone : ctx.session.phone,
					code : ctx.session.product,
					provider : ctx.session.Provider
				})
			}	
			
			R(options, (err, res, body)=>{
				console.log(JSON.parse(body))
				let Response;
				if(typeof JSON.parse(body).error == 'undefined' ){
					Response = JSON.parse(body).object.details
					ctx.replyWithHTML(`✉️ Status : ${Response.status}\n====================================\n📦 Product Code : ${ctx.session.product}\n👤 CustomerID/Destination :${Response.destination}\n📱 Serial Number : ${Response.SN}\n🔖 ID Transaction : ${JSON.parse(body).idTransaction}\n`)
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

module.exports = CheckOut