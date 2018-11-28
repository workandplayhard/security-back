import { Request, Response } from 'express'
import jsonwebtoken = require('jsonwebtoken')

import { User, IUser } from '../models/User'
import { jwtOptions } from '../config/jwt'

export class UsersController {
  public addNewUser (req: Request, res: Response) {
    const newUser = new User(req.body)

    newUser.save((err, user) => {
      if (err) {
        console.log('saving user failed:', err.message)
        if (err.name === 'ValidationError') {
          res.status(400).send(err.message)
          return
        }
        res.status(500).send(err)
        return
      }

      // todo: save token in database and get inserted _id
      const payload = { userId: user._id }
      const token = jsonwebtoken.sign(payload, jwtOptions.secretOrKey)

      res.status(201).json({
        user,
        token: `bearer ${token}`
      })
    })
  }

  public getUsers (_: Request, res: Response) {
    User.find({}, (err, user) => {
      if (err) {
        res.send(err)
      }
      res.json(user)
    })
  }

  public async login (req: Request, res: Response) {
    if (!req.body.email) {
      res.status(400).send({ message: 'email is mandatory' })
      return
    }

    if (!req.body.password) {
      res.status(400).send({ message: 'password is mandatory' })
    }

    const { password, email } = req.body

    let user: IUser

    try {
      user = await User.findOne({ email })
    } catch (e) {
      res.status(401).json({ message: e})
      return
    }

    if (!user) {
      res.status(401).json({ message: 'user does not exist' })
      return
    }

    if (!user.validPassword(password)) {
      res.status(401).json({ message: 'invalid password' })
    }

    const payload = { userId: user._id }
    const token = jsonwebtoken.sign(payload, jwtOptions.secretOrKey)
    // TODO: save token hash in the database to prevent forgery
    res.json({ message: 'ok', token: `bearer ${token}` })
  }

  public getUserByID (req: Request, res: Response) {
    User.findById(req.params.userId, (err, user) => {
      if (err) {
        res.send({ message: err })
        return
      }

      if (!user) {
        res.status(404).send({ message: `user not found: ${req.params.userId}` })
        return
      }

      res.json(user)
    })
  }

  public updateUser (req: Request, res: Response) {
    if (req.body.user._id !== req.params.userId) {
      res.status(401).send({ message: 'hop hop hop !' })
    }

    User.findOneAndUpdate({ _id: req.params.userId }, req.body, { new: true }, (err, user) => {
      if (err) {
        res.send({ message: err })
      }
      res.json(user)
    })
  }

  public deleteUser (req: Request, res: Response) {
    if (req.body.user._id !== req.params.userId) {
      res.status(401).send({ message: 'hop hop hop !' })
    }

    User.deleteOne({ _id: req.params.userId }, (err) => {
      if (err) {
        res.send({ message: err })
      }
      res.json({ message: 'Successfully deleted user!'})
    })
  }
}
