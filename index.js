require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
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

app.get('/info', (req, res, next) =>
{
  const date = new Date()

  Person.find({}).then(persons =>
  {
    res.send(`<p>${date}</p><p>Phonebook has info for ${persons.length} people</p>`)
  })
    .catch(error => next(error))

})

app.get('/api/persons', (req, res, next) =>
{
  Person.find({}).then(persons =>
  {
    res.json(persons)
  })
    .catch(error => next(error))
})

app.post('/api/persons', (req, res, next) =>
{
  const body = req.body

  const person = new Person({
    name: body.name,
    number: body.number,
  })

  person
    .save().then(savedPerson =>
    {
      res.json(savedPerson)
    })
    .catch(error => next(error))

})

app.get('/api/persons/:id', (req, res, next) =>
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
    .then(() =>
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
  else if (error.name === 'ValidationError')
  {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () =>
{
  console.log(`Server running on port ${PORT}`)
})