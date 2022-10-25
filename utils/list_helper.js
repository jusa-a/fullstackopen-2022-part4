const dummy = (blogs) => {
    blogs
    return 1
}

const totalLikes = (blogs) => {
    return blogs.reduce((sum, blog) => {
        return sum + blog.likes
    }, 0)
}

const favoriteBlog = (blogs) => {
    const blog = blogs.reduce((prev, curr) => {
        return prev.likes > curr.likes ? prev : curr
    }, {})

    return (({ title, author, likes }) => ({ title, author, likes }))(blog)
}

const mostBlogs = (blogs) => {
    const author_list = Object.values(
        blogs.reduce((authors, blog) => {
            if (!authors[blog.author]) {
                authors[blog.author] = { author: blog.author, blogs: 0 }
            }
            authors[blog.author].blogs += 1
            return authors
        }, {})
    )

    return author_list.reduce((prev, curr) => {
        return prev.blogs > curr.blogs ? prev : curr
    }, {})
}

const mostLikes = (blogs) => {
    const author_list = Object.values(
        blogs.reduce((authors, blog) => {
            if (!authors[blog.author]) {
                authors[blog.author] = { author: blog.author, likes: 0 }
            }
            authors[blog.author].likes += blog.likes
            return authors
        }, {})
    )

    return author_list.reduce((prev, curr) => {
        return prev.likes > curr.likes ? prev : curr
    }, {})
}

module.exports = { dummy, totalLikes, favoriteBlog, mostBlogs, mostLikes }
