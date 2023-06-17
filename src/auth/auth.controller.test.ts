import * as AuthController from './auth.controller'
import * as AuthService from './auth.service'
import type { Request, Response } from 'express'
import { AppError } from 'lib/utility-classes'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('auth/auth.service', () => ({
  findUserByUsername: vi.fn(),
  comparePasswords: vi.fn(),
  generateJWT: vi.fn(),
  createUser: vi.fn()
}))

vi.mock('lib/utility-classes', () => ({
  AppError: class {
    constructor(public type: string, public message: string) {}
  }
}))

describe('auth.controller', () => {
  let request: Request
  let response: Response
  const next = vi.fn()

  beforeEach(() => {
    vi.resetAllMocks()
    response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response
    request = {
      body: {
        username: 'testusername',
        password: 'testpassword'
      }
    } as Request
  })

  describe('signup', () => {
    it('should throw a validation error if a user already exists with username', async () => {
      vi.mocked(AuthService.findUserByUsername).mockResolvedValueOnce({
        id: 1,
        username: 'testusername',
        password: 'hashedpass'
      })
      await AuthController.signup(request, response, next)
      expect(AuthService.findUserByUsername).toHaveBeenCalledWith(
        'testusername'
      )
      expect(next).toHaveBeenCalled()
      expect(next.mock.calls[0][0]).toBeInstanceOf(AppError)
      expect(next.mock.calls[0][0].message).toBeTypeOf('string')
      expect(next.mock.calls[0][0].type).toBe('validation')
    })
    it('should create a new user if username not taken', async () => {
      vi.mocked(AuthService.findUserByUsername).mockResolvedValueOnce(null)
      vi.mocked(AuthService.createUser).mockResolvedValueOnce({
        id: 1,
        username: 'testusername'
      })
      vi.mocked(AuthService.generateJWT).mockReturnValueOnce('testtoken')
      await AuthController.signup(request, response, next)
      expect(AuthService.createUser).toHaveBeenCalledWith(request.body)
    })
    it('should create a session token for the new user', async () => {
      vi.mocked(AuthService.findUserByUsername).mockResolvedValueOnce(null)
      vi.mocked(AuthService.createUser).mockResolvedValueOnce({
        id: 1,
        username: 'testusername'
      })
      vi.mocked(AuthService.generateJWT).mockReturnValueOnce('testtoken')
      await AuthController.signup(request, response, next)
      expect(AuthService.generateJWT).toHaveBeenCalledWith(1)
    })
    it('should respond to the request with json: message, user, and token', async () => {
      vi.mocked(AuthService.findUserByUsername).mockResolvedValueOnce(null)
      vi.mocked(AuthService.createUser).mockResolvedValueOnce({
        id: 1,
        username: 'testusername'
      })
      vi.mocked(AuthService.generateJWT).mockReturnValueOnce('testtoken')
      await AuthController.signup(request, response, next)
      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Registered successfully',
        user: { id: 1, username: 'testusername' },
        token: 'testtoken'
      })
    })
  })

  describe('signin', () => {
    it('should throw a validation error if no user exists with username', async () => {
      vi.mocked(AuthService.findUserByUsername).mockResolvedValueOnce(null)
      await AuthController.signin(request, response, next)
      expect(next).toHaveBeenCalled()
      expect(next.mock.calls[0][0]).toBeInstanceOf(AppError)
      expect(next.mock.calls[0][0].type).toBe('validation')
      expect(next.mock.calls[0][0].message).toBeTypeOf('string')
    })
    it('should throw a validation error if password is incorrect', async () => {
      vi.mocked(AuthService.findUserByUsername).mockResolvedValueOnce({
        id: 1,
        username: 'testusername',
        password: 'hashedpass'
      })
      vi.mocked(AuthService.comparePasswords).mockReturnValueOnce(false)
      await AuthController.signin(request, response, next)
      expect(AuthService.comparePasswords).toHaveBeenCalledWith(
        'testpassword',
        'hashedpass'
      )
      expect(next).toHaveBeenCalled()
      expect(next.mock.calls[0][0]).toBeInstanceOf(AppError)
      expect(next.mock.calls[0][0].type).toBe('validation')
      expect(next.mock.calls[0][0].message).toBeTypeOf('string')
    })
    it('should create a session token for the user', async () => {
      vi.mocked(AuthService.findUserByUsername).mockResolvedValueOnce({
        id: 1,
        username: 'testusername',
        password: 'hashedpass'
      })
      vi.mocked(AuthService.comparePasswords).mockReturnValueOnce(true)
      vi.mocked(AuthService.generateJWT).mockReturnValueOnce('testtoken')
      await AuthController.signin(request, response, next)
      expect(AuthService.generateJWT).toHaveBeenCalledWith(1)
    })
    it('should respond to the request with json: message, user, and token', async () => {
      vi.mocked(AuthService.findUserByUsername).mockResolvedValueOnce({
        id: 1,
        username: 'testusername',
        password: 'hashedpass'
      })
      vi.mocked(AuthService.comparePasswords).mockReturnValueOnce(true)
      vi.mocked(AuthService.generateJWT).mockReturnValueOnce('testtoken')
      await AuthController.signin(request, response, next)
      expect(response.status).toHaveBeenCalledWith(200)
      expect(response.json).toHaveBeenCalledWith({
        message: 'Login successful!',
        user: { id: 1, username: 'testusername' },
        token: 'testtoken'
      })
    })
  })
})
