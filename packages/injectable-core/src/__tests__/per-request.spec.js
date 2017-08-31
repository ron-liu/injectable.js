import { createCore, injectable, expressPerRequestMiddleware} from '..'
import express from 'express'
import {over, lensProp, concat, pick, set} from 'ramda'
import request from 'supertest-as-promised'

let core
beforeEach(()=>{
	core = createCore()
})

test('per request middlewares', async () => {
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
		core.getService('setToken')({token: req.get('Authorization')})
		const token = core.getService('getPerRequestContext')({name: 'token'})
		
		core.getService('setPerRequestContext')({name: 'currentUser', value: `${token}abc`})
		next()
	}

	app.get('/', expressPerRequestMiddleware(core), tokenMiddleware, (req, res) => {
		const {core} = req
		setTimeout(() => {
			res.send({user: core.getService('getCurrentUser')({})})
		}, 10)
	})

	app.get('/via-get-service', (req, res) => {
		setTimeout(() => {
			res.send({user: req.core.getService('getCurrentUserViaGetService')({})})
		}, 10)
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