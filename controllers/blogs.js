const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', async (req, res) => {
    const blogs = await Blog.find({})
    res.json(blogs)
})

blogsRouter.delete('/:id', async (req, res) => {
    await Blog.findByIdAndRemove(req.params.id)
    res.status(204).end()
})

blogsRouter.post('/', async (req, res) => {
    const body = req.body
    const blog = new Blog({
        ...body,
        likes: body.likes || 0,
    })

    const savedBlog = await blog.save()
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
