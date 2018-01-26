const WizardScene = require('telegraf/scenes/wizard')
const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
const R = require('request')

const Deposit = new Scene('deposit')
Deposit.enter((ctx) => {
	if(typeof ctx.session.auth == 'undefined'){
		ctx.reply("Ooops. You need login first. Using /start to relogin")
		ctx.scene.leave()
		return;
	}
	//Get Service username
    ctx.replyWithHTML(`Information : \nHi <b>${ctx.session.username}</b>`, Markup.keyboard([
        [ '🔍 Check outstanding request', '💰 Request', '➡️ Back'],
    ])
    .oneTime()
    .resize()
    .extra())
})
Deposit.hears('💰 Request', (ctx)=>{
    console.log("Hello?")
    ctx.scene.enter('request-deposit')
})
Deposit.hears('➡️ Back', (ctx)=>{
    ctx.scene.enter('home')
})
Deposit.hears('🔍 Check outstanding request', (ctx)=>{
    ctx.reply('⚒ Coming soon ⚒')
    ctx.scene.enter('deposit')
})
const RequestDeposit = new WizardScene('request-deposit', 
    (ctx)=>{
        ctx.reply(`Please input your amount`, Markup.keyboard([
            ['➡️ Back'],
        ])
        .oneTime()
        .resize()
        .extra())
        ctx.wizard.next()
    },
    (ctx)=>{
        ctx.session.requestDeposit = ctx.message.text
        ctx.replyWithHTML(`Deposit request <b>Rp.${new Intl.NumberFormat('en-IN').format(ctx.message.text)}</b> ?`, Markup.inlineKeyboard([
            Markup.callbackButton('Request', 'Request'),
            Markup.callbackButton('Cancel', 'Cancel')   
        ]).extra())
    return ctx.wizard.next()
    },
    (ctx)=>{
        ctx.tg.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
        //if callback_query.data === 'Request'
        let options = {
            "url" : 'http://localhost:3002/user/deposit?username='+ctx.session.username,
            "method" : "POST",
            "headers" : {
                'secret' : ctx.session.secret,
                'auth' : ctx.session.auth,
                'Content-Type' : 'application/json' 
            },
            "body" : JSON.stringify({
                "amount" : ctx.session.requestDeposit
            })
        }
        R(options, (err, res, body)=>{
            if(err){
                console.log(err)
                ctx.replyWithHTML(err)
            }
            let Parse = JSON.parse(body)
            console.log(Parse[0].date)
            ctx.replyWithHTML(`Success! Deposit has been requested\n===============================\n🗓 Date Request : ${Parse[0].date}\n💰 Deposit : <b>${new Intl.NumberFormat('en-IN').format(ctx.session.requestDeposit)}</b>\n⏱ Status : Pending`)
        })
       ctx.scene.enter('home')
    },
)
// RequestDeposit.hears('💰 Request', (ctx)=>{
//     ctx.scene.enter('request-deposit')
// })
RequestDeposit.hears('➡️ Back', (ctx)=>{
    ctx.scene.enter('deposit')
})
// RequestDeposit.hears('🔍 Check outstanding request', (ctx)=>{
//     ctx.reply('⚒ Coming soon ⚒')
// })
module.exports = {
    Deposit : Deposit,
    RequestDeposit : RequestDeposit
}