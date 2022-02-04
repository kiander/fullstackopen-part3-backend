require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const mongoose = require('mongoose')
const cors = require('cors')
const app = express()

const Person = require('./models/person')
const { response } = require('express')

app.use(express.json())
app.use(cors())

app.use(
    morgan((tokens, req, res) =>
    {
        return [
            tokens.method(req, res),
            tokens.url(req, res),
            tokens.status(req, res),
            tokens.res(req, res, 'content-length'),
            '-',
            tokens['response-time'](req, res),
            'ms',
        ].join(' ')
    })
)

app.use(express.static('build'))

app.get('/info', (req, res) =>
{
    const date = new Date()

    Person.find({}).then(persons =>
    {
        res.send(`<p>${date}</p><p>Phonebook has info for ${persons.length} people</p>`)
    })

})

app.get('/api/persons', (req, res) =>
{
    Person.find({}).then(persons =>
    {
        res.json(persons)
    })
})

app.post('/api/persons', (req, res) =>
{
    const body = req.body

    if (!body.name)
    {
        return res.status(400).json({
            error: 'name missing'
        })
    }

    if (!body.number)
    {
        return res.status(400).json({
            error: 'number missing'
        })
    }

    // if (persons.find(person => person.name === body.name)) {
    //     return res.status(400).json({
    //         error: 'name already in list'
    //     })
    // }

    const person = new Person({
        name: body.name,
        number: body.number,
    })

    person.save().then(savedPerson =>
    {
        res.json(savedPerson)
    })

})

app.get('/api/persons/:id', (req, res) =>
{
    Person.findById(req.params.id)
        .then(person =>
        {
            if (person)
            {
                response.json(person)
            } else
            {
                response.status(404).send('Not found')
            }
        })
        .catch(error => next(error))
})

app.delete('/api/persons/:id', (req, res, next) =>
{
    Person.findByIdAndRemove(req.params.id)
        .then(result =>
        {
            res.status(204).end()
        })
        .catch(error => next(error))
})

const unknownEndpoint = (req, res) =>
{
    res.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) =>
{
    console.error(error.message)

    if (error.name === 'CastError')
    {
        return response.status(400).send({ error: 'malformatted id' })
    }

    next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () =>
{
    console.log(`Server running on port ${PORT}`)
})