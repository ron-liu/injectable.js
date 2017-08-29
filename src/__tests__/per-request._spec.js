import {expect, clean, describe, it, expectException, request} from '../../__tests__/init.spec'
import { getService, inject, injectable, addService, tag} from '../index'
import express from 'express'
import {over, lensProp, concat, pick, set} from '../../../util'
import {use} from '../index'
import perRequestMiddleware from '../../injectable-plugins/per-request'

const store = new WeakMap()
export const PER_REQUEST_KEY_PROPERTY_NAME = '__perRequestPropertyKey'

describe('per request', ()=> {
	
	beforeEach(()=>{
		clean()
		use(perRequestMiddleware)
	})
	
	it('per request middlewares', async () => {
		const app = express()
		
		const setPerRequest = tag(
			injectable
		)(({}, {[PER_REQUEST_KEY_PROPERTY_NAME]: key, name, value}) => {
			
			if (!store.get(key)) store.set(key, {})
			return store.set(key, set(lensProp(name), value, store.get(key)))
		})

		const getPerRequest = tag(
			injectable
		)(({}, input) => {
			const {[PER_REQUEST_KEY_PROPERTY_NAME]: key, name} = input
			if (!store.get(key)) return null
			return store.get(key)[name]
		})
		
		const setToken = tag(
			injectable,
			inject(['setPerRequest'])
		)(({setPerRequest}, {token})=> {
			setPerRequest({ name:'token', value: token })
		} )
		const setCurrentUser = tag(
			injectable,
			inject(['setPerRequest', 'getPerRequest'])
		)(({setPerRequest, getPerRequest}, {})=> {
			const token = getPerRequest({name: 'token'})
			setPerRequest({ name:'currentUser' })
			setPerRequest({}).set('currentUser', token + 'abc')
		} )

		const getCurrentUser = tag(
			injectable,
			inject(['getPerRequest'])
		)(({getPerRequest}, {})=> {
			return getPerRequest({name: 'currentUser'})
		} )
		
		addService('setPerRequest', setPerRequest)
		addService('getPerRequest', getPerRequest)
		addService('setToken', setToken)
		addService('setCurrentUser', setCurrentUser)
		addService('getCurrentUser', getCurrentUser)
		
		app.use((req, res, next) => {
			getService('setToken')({token: req.get('Authorization'), [PER_REQUEST_KEY_PROPERTY_NAME]: req})
			const token = getService('getPerRequest')({name: 'token', [PER_REQUEST_KEY_PROPERTY_NAME]: req})
			getService('setPerRequest')({name: 'currentUser', value: `${token}abc`, [PER_REQUEST_KEY_PROPERTY_NAME]: req})
			console.log('using', store.get(req), req.get('Authorization'))
			next()
		})
		
		app.get('/', function (req, res) {
			setTimeout(() => {
				console.log('get /', store.get(req))
				res.send({user: getService('getCurrentUser')({[PER_REQUEST_KEY_PROPERTY_NAME]: req})})
			}, 10)
		})

		app.get('/via-get-service', function (req, res) {
			setTimeout(() => {
				console.log('get /via-get-service', store.get(req))
				res.send({user: getService('getCurrentUserViaGetService')({[PER_REQUEST_KEY_PROPERTY_NAME]: req})})
			}, 10)
		})
		
		await request(app)
		.get('/')
		.set({Authorization: 'ron'})
		.expect(200)
		.expect(x=>expect(x.body).to.eql({user:'ronabc'}))

		await request(app)
		.get('/')
		.set({Authorization: 'john'})
		.expect(200)
		.expect(x=>expect(x.body).to.eql({user:'johnabc'}))
	})
	
	it('per request getService middleware should work', async () => {
		const app = express()
		
		const setPerRequest = tag(
			injectable
		)(({}, {[PER_REQUEST_KEY_PROPERTY_NAME]: key, name, value}) => {
			
			if (!store.get(key)) store.set(key, {})
			return store.set(key, set(lensProp(name), value, store.get(key)))
		})
		
		const getPerRequest = tag(
			injectable
		)(({}, input) => {
			const {[PER_REQUEST_KEY_PROPERTY_NAME]: key, name} = input
			if (!store.get(key)) return null
			return store.get(key)[name]
		})
		
		const setToken = tag(
			injectable,
			inject(['setPerRequest'])
		)(({setPerRequest}, {token})=> {
			setPerRequest({ name:'token', value: token })
		} )
		const setCurrentUser = tag(
			injectable,
			inject(['setPerRequest', 'getPerRequest'])
		)(({setPerRequest, getPerRequest}, {})=> {
			const token = getPerRequest({name: 'token'})
			setPerRequest({ name:'currentUser' })
			setPerRequest({}).set('currentUser', token + 'abc')
		} )
		
		const getCurrentUser = tag(
			injectable,
			inject(['getPerRequest'])
		)(({getPerRequest}, {})=> {
			return getPerRequest({name: 'currentUser'})
		} )
		const getCurrentUserViaGetService = tag(
			injectable,
			inject(['getService'])
		)(({getService:getTheService}, {})=> {
			const get = getTheService({name: 'getPerRequest'})
			return get({name: 'currentUser'})
		} )
		
		addService('setPerRequest', setPerRequest)
		addService('getPerRequest', getPerRequest)
		addService('setToken', setToken)
		addService('setCurrentUser', setCurrentUser)
		addService('getCurrentUser', getCurrentUser)
		addService('getCurrentUserViaGetService', getCurrentUserViaGetService)
		
		app.use((req, res, next) => {
			getService('setToken')({token: req.get('Authorization'), [PER_REQUEST_KEY_PROPERTY_NAME]: req})
			const token = getService('getPerRequest')({name: 'token', [PER_REQUEST_KEY_PROPERTY_NAME]: req})
			getService('setPerRequest')({name: 'currentUser', value: `${token}abc`, [PER_REQUEST_KEY_PROPERTY_NAME]: req})
			console.log('using', store.get(req), req.get('Authorization'))
			next()
		})
		app.get('/via-get-service', function (req, res) {
			setTimeout(() => {
				console.log('get /via-get-service', store.get(req))
				res.send({user: getService('getCurrentUserViaGetService')({[PER_REQUEST_KEY_PROPERTY_NAME]: req})})
			}, 10)
		})
		
		await request(app)
		.get('/via-get-service')
		.set({Authorization: 'peter'})
		.expect(200)
		.expect(x=>expect(x.body).to.eql({user:'peterabc'}))
		
	})	
	
})