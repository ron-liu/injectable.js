import {createCore, tag, injectable, inject, OPTIONS_KEY} from '../index'

let core
const createNewCore = () => core = createCore()

beforeEach(createNewCore)

test('pass down should work', async() => {
  const getCode = injectable({
    injects: ['genCode']
  })(({genCode}, {}) => {
    return genCode({})
  })
  const genCode = injectable()(({}, args) => {
    return args[OPTIONS_KEY]['a'] + args[OPTIONS_KEY]['b']
  })

  core.addService('getCode', getCode)
  core.addService('genCode', genCode)
  expect(core.getService('getCode')({[OPTIONS_KEY]: {a: 2, b: 4}})).toEqual(6)
})
