// @flow

import type {
	CreateCoreOption, Core, RawBizFunc, InjectedFunc, AddService, Middleware, Next,
	ReplaceService, RemoveService, BatchAddService, BuildAndAddService
} from './types'
import type {Fn1} from './basic-types'
import {curry, ifElse, zipObj, pipe, concat, pickBy, prop, mapObjIndexed, __, map, equals} from 'ramda'
import invariant from 'invariant'
import {loadFiles, then} from './util'
import {injectable} from './tag'

const createCore: Fn1<CreateCoreOption, Core> = (option = {}) => {
	const {middlewares = []} = option
	const rawContainer : Map<string, RawBizFunc> = new Map()
	const container: Map<string, InjectedFunc> = new Map()
	
	const applyMiddlewares : Fn1<[Middleware], Next>
		= (middlewares) => {
		let next: Next = (injects, rawFunc) => args => {
			return rawFunc(injects, args)
		}
		middlewares.forEach(x => {
			next = x(next)
		})
		return next
	}
	
	const addService : AddService = curry((name, func) => {
		invariant(name, `name has not been passed in`)
		invariant(func, `func has not been passed in`)
		invariant(func.injectable, `the passing function ${name} should be injectable`)
		
		if(rawContainer.get(name)) {
			throw new Error(`${name} has already been registered`)
		}
		rawContainer.set(name, func)
		// console.info(`service ${name} has been added to container`)
	})
	
	const getService: Fn1<string, InjectedFunc> = ifElse(
		x => container.get(x),
		x => container.get(x),
		serviceName => {
			const rawFunc = rawContainer.get(serviceName)
			if (!rawFunc) throw new Error(`${serviceName} has not been registered`)
			
			const needToBeInjected = rawFunc.injectable.injects || []
			const injects = zipObj(
				needToBeInjected,
				needToBeInjected.map(ifElse(
					equals(serviceName),
					()=>()=>{},
					getService
				))
			)
			
			const biz = applyMiddlewares(middlewares)(injects, rawFunc)
			
			if (injects[serviceName]) injects[serviceName] = biz
			container.set(serviceName, biz)
			
			return biz
		}
	)
	
	const removeService: RemoveService = name => {
		const originalService = rawContainer.get(name)
		container.clear()
		rawContainer.delete(name)
		return originalService
	}
	
	const replaceService: ReplaceService = curry((name, func) => {
		const originalService = removeService(name)
		addService(name, func)
		return () => {
			removeService(name)
			addService(name, originalService)
		}
	})
	
	const batchAddServices : BatchAddService = pipe(
		concat(__, '/**/*.biz.js'),
		pattern => loadFiles({pattern}),
		then(map(require)),
		then(map(pipe(
			pickBy(prop('injectable')),
			mapObjIndexed((fn, name) => addService(name, fn))
		)))
	)
	
	const buildAndAddService : BuildAndAddService
		= ({name, option, func}) => addService(name, injectable(option)(func))

	addService('getService',
		injectable()(
			({}, {name, ...props}) => args => getService(name)({...props, ...args})
		)
	)
	
	return {addService, getService, replaceService, removeService, batchAddServices, buildAndAddService}
}

export default createCore