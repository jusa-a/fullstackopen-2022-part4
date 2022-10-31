const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

const bcrypt = require('bcrypt')
const User = require('../models/user')

beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('secret', 10)
    const user = new User({ username: 'root', passwordHash })
    await user.save()
}, 100000)

describe('creating users', () => {
    test('a valid user can be created', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'tester',
            name: 'test user',
            password: 'fortesting',
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

        const usernames = usersAtEnd.map((u) => u.username)
        expect(usernames).toContain(newUser.username)
    })

    test('user is not created if username is not given', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            name: 'no username',
            password: 'nousername',
        }

        const response = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toContain(
            'User validation failed: username: Path `username` is required.'
        )

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toEqual(usersAtStart)
    })

    test('user is not created if username is too short', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'aa',
            name: 'short username',
            password: 'shortusername',
        }

        const response = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toContain(
            'User validation failed: username: Path `username` (`aa`) is shorter than the minimum allowed length (3).'
        )

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toEqual(usersAtStart)
    })

    test('user is not created if username is already taken', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'root',
            name: 'taken username',
            password: 'takenusername',
        }

        const response = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toContain('username must be unique')

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toEqual(usersAtStart)
    })

    test('user is not created if password is not given', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'nopassword',
            name: 'no password',
        }

        const response = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toContain('password is missing')

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toEqual(usersAtStart)
    })

    test('user is not created if password is too short', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'shortpassword',
            name: 'short password',
            password: 'aa',
        }

        const response = await api.post('/api/users').send(newUser).expect(400)

        expect(response.body.error).toContain(
            'password must be at leats 3 characters long'
        )

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toEqual(usersAtStart)
    })
})

afterAll(() => {
    mongoose.connection.close()
})
