const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const { userExtractor } = require('../utils/middleware')

blogsRouter.get('/', async (req, res) => {
    const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
    res.json(blogs)
})

blogsRouter.delete('/:id', userExtractor, async (req, res) => {
    const user = req.user
    const blog = await Blog.findById(req.params.id)

    if (blog.user.toString() === user._id.toString()) {
        await Blog.findByIdAndRemove(req.params.id)
        user.blogs = user.blogs.filter((b) => b.toString() !== req.params.id)
        await user.save()
        return res.status(204).end()
    }

    return res.status(401).json({ error: 'no permission' })
})

blogsRouter.post('/', userExtractor, async (req, res) => {
    const body = req.body
    const user = req.user

    const blog = new Blog({
        ...body,
        likes: body.likes || 0,
        user: user._id,
    })

    const savedBlog = await blog.save()
    await savedBlog.populate('user', { username: 1, name: 1 })
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()

    res.status(201).json(savedBlog)
})

blogsRouter.put('/:id', async (req, res) => {
    const { likes } = req.body

    const updatedBlog = await Blog.findByIdAndUpdate(
        req.params.id,
        { likes },
        { new: true }
    )
    res.json(updatedBlog)
})

module.exports = blogsRouter
