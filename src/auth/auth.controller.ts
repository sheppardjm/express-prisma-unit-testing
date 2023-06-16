import type { SigninSchema, SignupSchema } from './auth.schemas'
import * as AuthService from './auth.service'
import type { Request, RequestHandler } from 'express'
import { AppError } from 'lib/utility-classes'

export const signup: RequestHandler = async (
  req: Request<unknown, unknown, SignupSchema>,
  res,
  next
) => {
  const userData = {
    username: req.body.username,
    password: req.body.password
  }

  if (await AuthService.findUserByUsername(userData.username)) {
    return next(
      new AppError('validation', 'A user already exists with that username')
    )
  }

  const newUser = await AuthService.createUser(userData)
  const token = AuthService.generateJWT(newUser.id)

  res.status(200).json({
    message: `Registered successfully`,
    user: newUser,
    token
  })
}

export const signin: RequestHandler = async (
  req: Request<unknown, unknown, SigninSchema>,
  res,
  next
) => {
  const { username, password } = req.body

  const existing = await AuthService.findUserByUsername(username)

  if (!existing) {
    return next(new AppError('validation', 'Account not found.'))
  }

  if (!AuthService.comparePasswords(password, existing.password)) {
    return next(new AppError('validation', 'Invalid login.'))
  }

  const token = AuthService.generateJWT(existing.id)

  res.status(200).json({
    message: 'Login successful!',
    user: {
      id: existing.id,
      username: existing.username
    },
    token
  })
}
