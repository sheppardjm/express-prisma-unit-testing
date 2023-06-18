import type { Request, Response } from 'express';
import * as QuoteController from './quotes.controller';
import * as QuoteService from './quotes.service';
import * as TagService from './tags.service'
import { AppError } from 'lib/utility-classes'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./quotes.service', () => ({
  createQuote: vi.fn(),
  getQuotesByUser: vi.fn(),
  getQuoteById: vi.fn(),
  deleteQuote: vi.fn(),
}))

vi.mock('quotes/tags.service', () => ({
  deleteOrphanedTags: vi.fn(),
  upsertTags: vi.fn()
}))

vi.mock('lib/utility-classes', () => ({
  AppError: class {
    constructor(public type: string, public message: string) {}
  }
}))

describe('quotes.controller', () => {
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  let request: Request<any, any, any, any>
  let response: Response
  const next = vi.fn()

  beforeEach(() => {
    vi.restoreAllMocks()
    response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response
    request = {} as Request
  })

  describe('getAllQuotes', () => {
    it('should return all quotes for the user', async () => {
      request['session'] = { userId: 1 }
      const quotes = [
        {
          id: 1,
          userId: 1,
          text: 'Hello world',
          tags: [
            {
              id: 1,
              color: '#000000',
              name: 'tag'
            }
          ]
        }
      ]
      vi.mocked(QuoteService.getQuotesByUser).mockResolvedValueOnce(quotes)
      await QuoteController.getAllQuotes(request, response, next)
      expect(vi.mocked(QuoteService.getQuotesByUser)).toHaveBeenCalledWith(1)
      expect(response.json).toHaveBeenCalledWith(quotes)
    })
    it('should throw an error if no session userId', async () => {
      vi.mocked(QuoteService.getQuotesByUser).mockResolvedValueOnce([])
      expect(
        QuoteController.getAllQuotes(request, response, next)
      ).rejects.toThrowError()
    })
  })

  describe('createQuote', () => {
    it('should create a quote', async () => {
      request['session'] = { userId: 1 }
      request.body = {
        text: 'Hello world',
        tags: [1, 2, 3]
      }
      vi.mocked(TagService.upsertTags).mockResolvedValueOnce([1, 2, 3])
      await QuoteController.createQuote(request, response, next)
      expect(QuoteService.createQuote).toHaveBeenCalledWith(
        'Hello world',
        [1, 2, 3],
        1,
      )
    })
    it('should upsert tags if tags are provided', async () => {
      request['session'] = { userId: 1 }
      request.body = {
        text: 'Hello world',
        tags: [1, 2, 3]
      }
      vi.mocked(TagService.upsertTags).mockResolvedValueOnce([1, 2, 3])
      await QuoteController.createQuote(request, response, next)
      expect(TagService.upsertTags).toHaveBeenCalledWith([1, 2, 3])
    })
    it('should respond with the created quote', async () => {
      request['session'] = { userId: 1 }
      request.body = {
        text: 'Hello world',
        tags: [1, 2, 3]
      }
      vi.mocked(TagService.upsertTags).mockResolvedValueOnce([1, 2, 3])
      vi.mocked(QuoteService.createQuote).mockResolvedValueOnce({
        id: 1,
        text: 'Hello world',
        userId: 1,
        tags: []
      })
      await QuoteController.createQuote(request, response, next)
      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Quote created successfully.',
        quote: {
          id: 1,
          text: 'Hello world',
          userId: 1,
          tags: []
        }
      })
    })

    describe('deleteQuote', () => {
      it('should return an error if quote not found', async () => {
        request = { params: { id: 1 } } as Request<
          { id: 1 },
          unknown,
          unknown,
          unknown
        >
        vi.mocked(QuoteService.getQuoteById).mockResolvedValueOnce(null)
        await QuoteController.deleteQuote(request, response, next)
        expect(next).toHaveBeenCalled()
        expect(next.mock.calls[0][0]).toBeInstanceOf(AppError)
        expect(next.mock.calls[0][0].message).toBeTypeOf('string')
        expect(next.mock.calls[0][0].type).toBe('validation')
      })
      it('should return an error if user is not authorized to delete quote', async () => {
        request = { params: { id: 1 }, session: { userId: 2 } } as Request<
          { id: 1 },
          unknown,
          unknown,
          unknown
        >
        vi.mocked(QuoteService.getQuoteById).mockResolvedValueOnce({
          id: 1,
          userId: 999,
          text: 'Hello world',
          tags: []
        })
        await QuoteController.deleteQuote(request, response, next)
        expect(next).toHaveBeenCalled()
        expect(next).toHaveBeenCalled()
        expect(next.mock.calls[0][0]).toBeInstanceOf(AppError)
        expect(next.mock.calls[0][0].message).toBeTypeOf('string')
        expect(next.mock.calls[0][0].type).toBe('unauthorized')
      })
      it('should delete a quote if allowed and available', async () => {
        request = {
          session: { userId: 2 },
          params: { id: 1 }
        } as Request<{ id: 1 }, unknown, unknown, unknown>
  
        vi.mocked(QuoteService.getQuoteById).mockResolvedValueOnce({
          id: 1,
          userId: 2,
          text: 'Hello world',
          tags: []
        })
  
        await QuoteController.deleteQuote(request, response, next)
        expect(QuoteService.deleteQuote).toHaveBeenCalledWith(1)
      })
      it('should delete orphaned tags if quote had tags', async () => {
        request = {
          session: { userId: 2 },
          params: { id: 1 }
        } as Request<{ id: 1 }, unknown, unknown, unknown>
  
        vi.mocked(QuoteService.getQuoteById).mockResolvedValueOnce({
          id: 1,
          userId: 2,
          text: 'Hello world',
          tags: [
            { id: 1, color: '#000000', name: 'tag' },
            { id: 2, color: '#000000', name: 'tag' }
          ]
        })
        await QuoteController.deleteQuote(request, response, next)
        expect(TagService.deleteOrphanedTags).toHaveBeenCalledWith([1, 2])
      })
      it('should not delete orphaned tags if quote had no tags', async () => {
        request = {
          session: { userId: 2 },
          params: { id: 1 }
        } as Request<{ id: 1 }, unknown, unknown, unknown>
  
        vi.mocked(QuoteService.getQuoteById).mockResolvedValueOnce({
          id: 1,
          userId: 2,
          text: 'Hello world',
          tags: []
        })
        await QuoteController.deleteQuote(request, response, next)
        expect(TagService.deleteOrphanedTags).not.toHaveBeenCalled()
      })
      it('should respond to the request with a message and the deleted quote', async () => {
        request = {
          session: { userId: 2 },
          params: { id: 1 }
        } as Request<{ id: 1 }, unknown, unknown, unknown>
  
        const mockedQuote = {
          id: 1,
          userId: 2,
          text: 'Hello world',
          tags: []
        }
        vi.mocked(QuoteService.getQuoteById).mockResolvedValueOnce(mockedQuote)
        vi.mocked(QuoteService.deleteQuote).mockResolvedValueOnce(mockedQuote)
        await QuoteController.deleteQuote(request, response, next)
        expect(response.status).toHaveBeenCalledWith(200)
        expect(response.json).toHaveBeenCalledWith({
          message: 'Quote deleted successfully.',
          quote: {
            id: 1,
            userId: 2,
            text: 'Hello world',
            tags: []
          }
        })
      })
    })
  })
})