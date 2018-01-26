//Telegraf Library
const Telegraf = require('telegraf')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')
const { enter, leave } = Stage

//Scene Library
const Home = require('./scene/HomeScene')
const Login = require('./scene/WelcomeScene')
const CheckOut = require('./scene/CheckoutScene')
const Transaction = require('./scene/TransactionScene')
const {Deposit, RequestDeposit} = require('./scene/DepositScene')
const Search = require('./scene/SearchScene')

//Bot Setup
const bot = new Telegraf('518267903:AAGFERSgwMC3UnHHWGwROWjcTEsteQJJZNY')
const stage = new Stage([Login, CheckOut, Deposit, Search, RequestDeposit, Home, Transaction])

//Middleware
bot.use(session())
bot.use(stage.middleware())

//Entering command
bot.command('shop', enter('home'))
bot.command('start', enter('super-wizard'))

//Wrong command
bot.on('message', (ctx) => ctx.reply('Ooops, wrong command. Try /shop or /start'))

//Server start
bot.startPolling()

//Logging Error
bot.catch((err)=>{
	console.log(err)
})