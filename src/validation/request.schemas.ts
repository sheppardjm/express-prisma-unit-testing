import { z } from 'zod';

// Signup Schema & Type
export const SignupSchema = z.object({
  body: z.object({
    username: z.string(),
    password: z.string()
  })
})
export type SignupSchema = z.infer<typeof SignupSchema>['body']

// Signin Schema & Type
export const SigninSchema = SignupSchema
export type SigninSchema = SignupSchema

// Create Quote Schema & Type
export const CreateQuoteSchema = z.object({
  body: z.object({
    tags: z.string().array().optional(),
    text: z.string()
  })
})
export type CreateQuoteSchema = z.infer<typeof CreateQuoteSchema>['body']

// Delete Quote Schema
export const DeleteQuoteSchema = z.object({
  params: z.object({
    id: z.number()
  })
})
export type DeleteQuoteSchema = z.infer<typeof DeleteQuoteSchema>['params']
