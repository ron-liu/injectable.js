import {injectable, genPassDown, getOptionFromArgs, addOptionIntoArgs} from 'injectable-core'
import {merge, pick, mapObjIndexed, lensProp, set} from 'ramda'
export const PER_REQUEST_KEY_NAME = '__perRequestPropertyKey'

// It will hold req: perRequestStore across all different core instances
// I didn't put it in core, should be ok
const store = new WeakMap()

const setPerRequestContext = injectable()
(({}, {name, value, ...args}) => {
	const key = getOptionFromArgs(PER_REQUEST_KEY_NAME, args)
	if (!store.get(key)) store.set(key, {})
	return store.set(key, set(lensProp(name), value, store.get(key)))
})

const getPerRequestContext = injectable()
(({}, {name, ...args}) => {
	const key = getOptionFromArgs(PER_REQUEST_KEY_NAME, args)

  if (!store.get(key)) return null
	return store.get(key)[name]
})

const passDown = genPassDown(PER_REQUEST_KEY_NAME)

const perRequestMiddleware = next => (injects, rawFunc) => args => {
	const decoratedInjects = mapObjIndexed( passDown(args), injects)
	return next(decoratedInjects, rawFunc)(args)
}

export default {
	middlewares: [perRequestMiddleware],
	services: {setPerRequestContext, getPerRequestContext}
}

export const expressPerRequestMiddleware = core => (req, res, next) => {
  req.core = {
    ...core,
    getService: name => {
      const service = core.getService(name)
      return args => service(addOptionIntoArgs(PER_REQUEST_KEY_NAME, req, args))
    }
  }
  next()
}

