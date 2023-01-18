import authRouter from 'auth/auth.router'
import express from 'express'
import { errorHandler } from 'lib/middlewares'
import { authorization } from 'lib/middlewares'
import quotesRouter from 'quotes/quotes.router'

const app = express()
app.use(express.json())
app.use('/quotes', authorization, quotesRouter)
app.use('/auth', authRouter)
app.use(errorHandler)

export default app
