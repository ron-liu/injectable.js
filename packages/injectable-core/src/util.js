// @flow

import type {Fn1, CurriedFn2} from './basic-types'
import glob from 'glob'
import {prop, merge, pick, curry, over, lensProp, pipe,isNil, when, __, path} from 'ramda'
import type {Args, InjectedFunc} from "./types"
export const OPTIONS_KEY = '__INJECTABLE_ARGS_OPTIONS__'

type Pattern = {
	pattern: string,
	ignores: Array<string>
}

export const loadFiles : Fn1<Pattern, Array<string>>
	= ({pattern, ignores = [ '**/node_modules/**' ]}) =>
	new Promise((res, rej) => glob(pattern, {ignore: ignores}, (err, files) => {
		if (err) {
			rej(err)
		}
		else {
			res(files)
		}
	}))

export const then : CurriedFn2<Fn1<any, any>, Promise<any>> = curry((fn, promise) => {
	return promise.then(fn)
})

// export const addOptionIntoArgs: CurriedFn2<string, mixed, mixed, void>
// 	= curry((name, value, args) => pipe(
// 		over(lensProp(OPTIONS_KEY), when(isNil, ()=>{})),
// 		over(lensProp(OPTIONS_KEY), merge(__, {[name]: value}) )
// 	)(args))

const addOptionsIntoArgs: CurriedFn2<{[id:string]: mixed}, mixed, void>
	= curry((values = {}, args = {}) => pipe(
		over(lensProp(OPTIONS_KEY), when(isNil, ()=>{})),
		over(lensProp(OPTIONS_KEY), merge(__, values) )
	)(args))


type PassDown = CurriedFn2<Args, InjectedFunc, InjectedFunc>
export const passDown : PassDown = curry((argsFromUpService, injectedService) =>
  (args = {}) => injectedService(addOptionsIntoArgs(prop(OPTIONS_KEY, argsFromUpService), args))
)
// export const genPassDown : Fn1<string, PassDown>
// 	= name =>　curry((argsFromUpService, injectedService) =>
//   (args = {}) => injectedService(addOptionIntoArgs(name, path([ OPTIONS_KEY, name], argsFromUpService), args))
// )

export const getOptionFromArgs: CurriedFn2<string, mixed, mixed>
	= curry((name, args) => {
		const options = prop(OPTIONS_KEY, args) || {}
		return prop(name, options)
})
