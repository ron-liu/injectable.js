// @flow

import type {Fn1,CurriedFn2} from './basic-types'
import glob from 'glob'
import {curry} from 'ramda'

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
