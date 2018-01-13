import {injectable, getOptionFromArgs, addOptionIntoArgs} from 'injectable-core'
import {merge, pick, mapObjIndexed, lensProp, set} from 'ramda'
export const PER_REQUEST_KEY_NAME = '__perRequestPropertyKey'

// It will hold req: perRequestStore across all different core instances
// I didn't put it in core, should be ok
const store = new WeakMap()

const setPerRequestContext = injectable()
(({}, {name, value, ...args}) => {
	const key = getOptionFromArgs(PER_REQUEST_KEY_NAME, args)
  if (!key) throw Error(`there is no per request key in arguments, make sure you already put req as per request key in the argument`)
	if (!store.get(key)) store.set(key, {})
	return store.set(key, set(lensProp(name), value, store.get(key)))
})

const getPerRequestContext = injectable()
(({}, {name, ...args}) => {
	const key = getOptionFromArgs(PER_REQUEST_KEY_NAME, args)

  if (!store.get(key)) return null
	return store.get(key)[name]
})

export default {
	middlewares: [],
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

