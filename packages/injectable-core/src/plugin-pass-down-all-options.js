import {passDown} from './util'
import {mapObjIndexed} from 'ramda'

export const passDownAllOptionsPlugin = next => (injects, rawFunc) => args => {
  const decoratedInjects = mapObjIndexed( passDown(args), injects)
  return next(decoratedInjects, rawFunc)(args)
}