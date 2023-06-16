import type { CreateQuoteSchema, DeleteQuoteSchema } from './quotes.schemas'
import * as QuoteService from './quotes.service'
import * as TagService from './tags.service'
import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { AppError } from 'lib/utility-classes'

export const getAllQuotes: RequestHandler = async (req, res) => {
  const quotes = await QuoteService.getQuotesByUser(req.session.userId)
  res.json(quotes)
}

export const createQuote: RequestHandler = async (
  req: Request<unknown, unknown, CreateQuoteSchema>,
  res
) => {
  const { text, tags } = req.body
  let tagIds: number[] = []

  if (tags?.length) {
    tagIds = await TagService.upsertTags(tags)
  }

  const quote = await QuoteService.createQuote(text, tagIds, req.session.userId)

  res.status(200).json({
    message: 'Quote created successfully.',
    quote
  })
}

export const deleteQuote: RequestHandler<DeleteQuoteSchema> = async (
  req: Request<DeleteQuoteSchema>,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params
  const quoteId = parseInt(id)
  const quote = await QuoteService.getQuoteById(quoteId)

  if (!quote) {
    return next(new AppError('validation', 'Quote not found.'))
  }

  if (!(quote.userId === req.session.userId)) {
    return next(
      new AppError(
        'unauthorized',
        'You are not authorized to delete this quote.'
      )
    )
  }

  const deleted = await QuoteService.deleteQuote(quoteId)

  if (quote.tags.length) {
    await TagService.deleteOrphanedTags(quote.tags.map(tag => tag.id))
  }

  res.status(200).json({
    message: 'Quote deleted successfully.',
    quote: deleted
  })
}
