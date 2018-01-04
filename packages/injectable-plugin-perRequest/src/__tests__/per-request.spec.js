import { createCore, injectable} from '../../../injectable-core/src/index'
import perRequestPlugin, {expressPerRequestMiddleware} from '..'
import express from 'express'
import {over, lensProp, concat, pick, set} from 'ramda'
import request from 'supertest-as-promised'

let core
beforeEach(()=>{
	core = createCore({plugins: [perRequestPlugin]})
})

it('per request middlewares', async () => {
	const app = express()
	
	const setToken = injectable(
		{injects: ['setPerRequestContext']}
	)(({setPerRequestContext}, {token})=> {
		setPerRequestContext({ name:'token', value: token })
	} )

	const setCurrentUser = injectable(
		{injects: ['setPerRequestContext', 'getPerRequestContext']}
	)(({setPerRequestContext, getPerRequestContext}, {})=> {
		const token = getPerRequestContext({name: 'token'})
		setPerRequestContext({ name:'currentUser' })
		setPerRequestContext({}).set('currentUser', token + 'abc')
	} )

	const getCurrentUser = injectable(
		{injects:['getPerRequestContext']}
	)(({getPerRequestContext}, {})=> {
		return getPerRequestContext({name: 'currentUser'})
	} )

	core.addService('setToken', setToken)
	core.addService('setCurrentUser', setCurrentUser)
	core.addService('getCurrentUser', getCurrentUser)

	const tokenMiddleware = (req, res, next) => {
		const {core} = req
		try {
      core.getService('setToken')({token: req.get('Authorization')})
      const token = core.getService('getPerRequestContext')({name: 'token'})

      core.getService('setPerRequestContext')({name: 'currentUser', value: `${token}abc`})
      next()
		}
		catch(e) {
			console.error(e.stack)
			next(e)
		}
	}
	app.use( (err, req, res, next) => {
    if (res.headersSent) {
      return next(err)
    }
    console.error(err)
    res.status(500)
    res.render('error', { error: err })
	})

	app.get('/', expressPerRequestMiddleware(core), tokenMiddleware, (req, res) => {
		const {core} = req
    res.send({user: core.getService('getCurrentUser')({})})
	})

	await request(app)
	.get('/')
	.set({Authorization: 'ron'})
	.expect(200)
	.expect(x=>expect(x.body).toEqual({user:'ronabc'}))

	await request(app)
	.get('/')
	.set({Authorization: 'john'})
	.expect(200)
	.expect(x=>expect(x.body).toEqual({user:'johnabc'}))
})

test('per request getService middleware should work', async () => {
	const app = express()

	const setToken = injectable(
		{injects: ['setPerRequestContext']}
	)(({setPerRequestContext}, {token})=> {
		setPerRequestContext({ name:'token', value: token })
	} )
	const setCurrentUser = injectable(
		{injects: ['setPerRequestContext', 'getPerRequestContext']}
	)(({setPerRequestContext, getPerRequestContext}, {})=> {
		const token = getPerRequestContext({name: 'token'})
		setPerRequestContext({ name:'currentUser' })
		setPerRequestContext({}).set('currentUser', token + 'abc')
	} )

	const getCurrentUser = injectable(
		{injects: ['getPerRequestContext']}
	)(({getPerRequestContext}, {})=> {
		return getPerRequestContext({name: 'currentUser'})
	} )
	const getCurrentUserViaGetService = injectable(
		{injects: ['getService']}
	)(({getService:getTheService}, {})=> {
		const get = getTheService({name: 'getPerRequestContext'})
		return get({name: 'currentUser'})
	} )

	core.addService('setToken', setToken)
	core.addService('setCurrentUser', setCurrentUser)
	core.addService('getCurrentUser', getCurrentUser)
	core.addService('getCurrentUserViaGetService', getCurrentUserViaGetService)

	app.use( expressPerRequestMiddleware(core), (req, res, next) => {
		const {core:{getService}} = req
		getService('setToken')({token: req.get('Authorization')})
		const token = getService('getPerRequestContext')({name: 'token'})
		getService('setPerRequestContext')({name: 'currentUser', value: `${token}abc`})
		next()
	})
	app.get('/via-get-service', function (req, res) {
		const {core:{getService}} = req
		setTimeout(() => {
			res.send({user: getService('getCurrentUserViaGetService')({})})
		}, 10)
	})

	await request(app)
	.get('/via-get-service')
	.set({Authorization: 'peter'})
	.expect(200)
	.expect(x=>expect(x.body).toEqual({user:'peterabc'}))
})