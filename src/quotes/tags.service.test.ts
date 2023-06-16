// src/quotes/tags.service.test.ts
import * as TagService from './tags.service'
import prismaMock from 'lib/__mocks__/prisma'
import randomColor from 'randomcolor'
import { describe, beforeEach, it, expect, vi } from 'vitest'

vi.mock('lib/prisma')
vi.mock('randomcolor', () => ({
  default: vi.fn(() => '#ffffff')
}))

describe('tags.service', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })
  describe('upsertTags', () => {
    it('should return a list of tagIds', async () => {
      prismaMock.$transaction.mockResolvedValueOnce([1, 2, 3])
      const tagIds = await TagService.upsertTags(['tag1', 'tag2', 'tag3'])
      expect(tagIds).toStrictEqual([1, 2, 3])
    })
  })
  describe('upsertTags', () => {
    it('should only create tags that do not exist', async () => {
      prismaMock.$transaction.mockImplementationOnce(
        callback => callback(prismaMock)
      )
      prismaMock.tag.findMany.mockResolvedValueOnce([
        { id: 1, name: 'tag1', color: '#ffffff' }
      ])
      prismaMock.tag.createMany.mockResolvedValueOnce({ count: 0 })
      await TagService.upsertTags(['tag1', 'tag2', 'tag3'])
      expect(prismaMock.tag.createMany).toHaveBeenCalledWith({
        data: [
          { name: 'tag2', color: '#ffffff' },
          { name: 'tag3', color: '#ffffff' }
        ]
      })
    })
  })
  describe('upsertTags', () => {
    it('should give new tags a random color', async () => {
      prismaMock.$transaction.mockImplementationOnce(
        callback => callback(prismaMock)
      )
      prismaMock.tag.findMany.mockResolvedValue([])
      prismaMock.tag.createMany.mockResolvedValueOnce({ count: 3 })
      await TagService.upsertTags(['tag1', 'tag2', 'tag3'])
      expect(randomColor).toHaveBeenCalledTimes(3)
    })
  })
  describe('upsertTags', () => {
    it('should return tagIds', async () => {
      prismaMock.$transaction.mockImplementationOnce(
        callback => callback(prismaMock)
      )
      prismaMock.tag.findMany.mockResolvedValueOnce([
        { id: 1, name: 'tag1', color: '#ffffff' }
      ])
      prismaMock.tag.createMany.mockResolvedValueOnce({ count: 3 })
      prismaMock.tag.findMany.mockResolvedValueOnce([
        { id: 2, name: 'tag2', color: '#ffffff' },
        { id: 3, name: 'tag3', color: '#ffffff' }
      ])
      await TagService.upsertTags(['tag1', 'tag2', 'tag3'])
      expect(prismaMock.$transaction).toHaveReturnedWith([1, 2, 3])
    })
  })
  describe('upsertTags', () => {
    it('should return an empty array if no tags are provided', async () => {
      prismaMock.$transaction.mockImplementationOnce(
        callback => callback(prismaMock)
      )
      prismaMock.tag.findMany.mockResolvedValueOnce([])
      prismaMock.tag.createMany.mockResolvedValueOnce({ count: 0 })
      /* prismaMock.tag.findMany.mockResolvedValueOnce([]) */
      await TagService.upsertTags([])
      expect(prismaMock.$transaction).toHaveReturnedWith([])
    })
  })
})
