// @flow

import type {
	CreateCoreOption, Core, RawBizFunc, InjectedFunc, AddService, Middleware, Next,
	ReplaceService, RemoveService, BatchAddService, BuildAndAddService, InstallPlugin, ReduceOption
} from './types'
import type {Fn1} from './basic-types'
import {ifElse, zipObj, pipe, concat, pickBy, prop, mapObjIndexed, __, map, equals, isEmpty} from 'ramda'
import invariant from 'invariant'
import {then, loadFiles} from './util'
import {injectable} from './tag'

const createCore: Fn1<CreateCoreOption, Core> = (option = {}) => {
	let plugins = option.plugins|| []
	let middlewares = []
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
	
	const addService : AddService = (name, func) => {
		invariant(name, `name has not been passed in`)
		invariant(func, `func has not been passed in`)
		invariant(func.injectable, `the passing function ${name} should be injectable`)
		
		if(rawContainer.get(name)) {
			throw new Error(`${name} has already been registered`)
		}
		rawContainer.set(name, func)
		// console.info(`service ${name} has been added to container`)
	}
	
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
	
	const replaceService: ReplaceService = (name, func) => {
		const originalService = removeService(name)
		addService(name, func)
		return () => {
			removeService(name)
			addService(name, originalService)
		}
	}
	
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
	
	const installPlugin: InstallPlugin = plugin => {
		invariant(plugin && !isEmpty(plugin.middlewares), `should pass an option which at least has middlewares property`)
		const {middlewares: newMiddlewares, services = {}} = plugin
		
		middlewares = [...middlewares, ...newMiddlewares]
		mapObjIndexed((rawFunc, name) => addService(name, rawFunc), services)
	}
	
	const reduce : ReduceOption
		= ({filter, mapFn, reducer, empty}) => {
		let ret = empty
		for ( let item of rawContainer.entries()) {
			if (filter(item)){
				ret = reducer(mapFn(item), ret)
			}
		}
		return ret
	}

	addService('getService',
		injectable()(
			({}, {name, ...props}) => args => getService(name)({...props, ...args})
		)
	)
	plugins.forEach(installPlugin)
	
	return {addService, getService, replaceService, removeService, batchAddServices, buildAndAddService, reduce}
}

export default createCore