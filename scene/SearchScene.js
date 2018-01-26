const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
const R = require('request')
const ClipBoard = require('clipboardy')

const Search = new Scene('search')
Search.enter((ctx) => {	
    ctx.replyWithHTML(`Input a destination number`)
})
Search.on('text', (ctx)=>{
    ctx.replyWithHTML(`⏱Loading...`).then((q)=>{
        let options = {
            'url' : `http://localhost:3000/search?categories=phone&data=${ctx.message.text}`,
            'method' : 'GET',
            'headers' : {
                'Content-type' : 'application/json',
                'iduser' : ctx.session.iduser
            }
        }
        R(options, (err, res, body)=>{
            if(err){
                ctx.tg.deleteMessage(q.chat.id, q.message_id)
                console.log(err)
                return;
            }
            ctx.tg.deleteMessage(q.chat.id, q.message_id)
            let Response = JSON.parse(body)
            ctx.replyWithHTML(`✉️ Status : ${Response.status}\n====================================\n📦 Product Code : ${Response.id_product}\n👤 CustomerID/Destination :${Response.destination}\n📱 Serial Number : ${Response.SN}\n🔖 ID Transaction : ${Response.id_trx}\n🗓 Date Response : ${Response.date_response}`, Markup.inlineKeyboard([
                Markup.callbackButton('Copy & Search again', 'Reenter'),
                Markup.callbackButton('Copy & Close', 'Home'),
                Markup.callbackButton('Close only', 'Close')
            ]).extra())
        })
    })
})
Search.on('callback_query', (ctx)=>{
    let Data = ctx.update.callback_query.data
    let Text = ctx.update.callback_query.message.text
    switch(Data){
        case 'Reenter' : 
            ctx.tg.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
            ClipBoard.writeSync(Text)
            ctx.tg.answerCbQuery(ctx.callbackQuery.id, 'Success copied to clipboard', false)
            ctx.scene.reenter()
        break;

        case 'Home' : 
            ctx.tg.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
            ClipBoard.writeSync(Text)
            ctx.tg.answerCbQuery(ctx.callbackQuery.id, 'Success copied to clipboard', false)
            ctx.scene.leave()
            ctx.scene.enter('home')
        break;
        
        default : 
            ctx.tg.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id)
            ctx.scene.leave()
            ctx.scene.enter('home')
        break;
    }
})
module.exports = Search