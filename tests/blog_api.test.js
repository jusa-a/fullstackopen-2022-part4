const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

const User = require('../models/user')
const Blog = require('../models/blog')

let token = ''

beforeEach(async () => {
    await User.deleteMany({})

    await api.post('/api/users').send(helper.initialUsers[0])
    const response = await api.post('/api/login').send(helper.initialUsers[0])
    token = response.body.token

    await Blog.deleteMany({})

    for (let blog of helper.initialBlogs) {
        await api
            .post('/api/blogs')
            .set('Authorization', `bearer ${token}`)
            .send(blog)
    }
}, 100000)

describe('viewing blogs', () => {
    test('correct amount of blogs are returned as json', async () => {
        const response = await api
            .get('/api/blogs')
            .expect(200)
            .expect('Content-Type', /application\/json/)

        expect(response.body).toHaveLength(helper.initialBlogs.length)
    })

    test('unique identifier property of blog posts is named "id"', async () => {
        const response = await api.get('/api/blogs')

        expect(response.body[0].id).toBeDefined()
    })
})

describe('adding a blog', () => {
    test('a valid blog can be added', async () => {
        const newBlog = {
            title: 'testing blog list',
            author: 'tester',
            url: 'testURL',
            likes: 99,
        }

        await api
            .post('/api/blogs')
            .set('Authorization', `bearer ${token}`)
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

        const titles = blogsAtEnd.map((b) => b.title)
        expect(titles).toContain('testing blog list')
    })

    test('a blog with missing "likes" property defaults to 0', async () => {
        const newBlog = {
            title: 'testing blog list',
            author: 'tester',
            url: 'testURL',
        }

        await api
            .post('/api/blogs')
            .set('Authorization', `bearer ${token}`)
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

        const likes = blogsAtEnd.map((b) => b.likes)
        expect(likes).toContain(0)
    })

    test('blog without title is not added', async () => {
        const newBlog = {
            author: 'tester',
            url: 'testURL',
            likes: 0,
        }

        await api
            .post('/api/blogs')
            .set('Authorization', `bearer ${token}`)
            .send(newBlog)
            .expect(400)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    })

    test('blog without url is not added', async () => {
        const newBlog = {
            title: 'testing blog list',
            author: 'tester',
            likes: 0,
        }

        await api
            .post('/api/blogs')
            .set('Authorization', `bearer ${token}`)
            .send(newBlog)
            .expect(400)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    })

    test('blog is not added if token is not provided', async () => {
        const newBlog = {
            title: 'testing blog list',
            author: 'tester',
            likes: 0,
        }

        await api.post('/api/blogs').send(newBlog).expect(401)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    })
})

describe('deleting a blog', () => {
    test('blog can be deleted with valid id', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToDelete = blogsAtStart[0]

        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .set('Authorization', `bearer ${token}`)
            .expect(204)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)

        const titles = blogsAtEnd.map((b) => b.title)
        expect(titles).not.toContain(blogToDelete.title)
    })

    test('blog is not deleted if token is not provided', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToDelete = blogsAtStart[0]

        await api.delete(`/api/blogs/${blogToDelete.id}`).expect(401)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toEqual(blogsAtStart)
    })

    test('blog is not deleted without correct authorization', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToDelete = blogsAtStart[0]

        await api.post('/api/users').send(helper.initialUsers[1])
        const res = await api.post('/api/login').send(helper.initialUsers[1])
        token = res.body.token

        const response = await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .set('Authorization', `bearer ${token}`)
            .expect(401)

        expect(response.body.error).toContain('no permission')

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toEqual(blogsAtStart)
    })
})

describe('updating a blog', () => {
    test('likes of a blog can be updated', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToUpdate = blogsAtStart[0]

        await api.put(`/api/blogs/${blogToUpdate.id}`).send({ likes: 12 })

        const blogsAtEnd = await helper.blogsInDb()
        const updatedBlog = blogsAtEnd[0]
        expect(updatedBlog.likes).toEqual(12)
    })
})

afterAll(() => {
    mongoose.connection.close()
})
