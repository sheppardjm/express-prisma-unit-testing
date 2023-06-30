import { describe, expect, it } from "vitest"
import request from "supertest"
import app from "lib/createServer"
import prisma from './helpers/prisma'

describe('auth', () => {
  describe('[POST] /auth/signup', () => {
    it('should respond with a 200 status and user details', async () => {
      const { status, body } = await request(app).post('/auth/signup').send({
        username: 'testusername',
        password: 'testpassword'
      })
      const newUser = await prisma.user.findFirst()
      expect(status).toBe(200)
      expect(newUser).not.toBeNull()
      expect(body.user).toStrictEqual({
        username: 'testusername',
        id: newUser?.id
     })
    })
  })
})