const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')
const ts = require('typescript')

function service(transport = async () => ({results: []})) {
  const requests = []
  const exported = {exports: {}}
  const filename = path.resolve(__dirname, '../../src/services/geo.ts')
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}
  }).outputText
  vm.runInNewContext(source, {
    module: exported,
    exports: exported.exports,
    URLSearchParams,
    require(name) {
      assert.equal(name, '@/utils/api')
      return {
        API_VERSIONS: {BFG2: 'v1'},
        buildApiUrl: route => `/api/v1${route}`,
        apiFetch: async (url, options) => {
          requests.push({url: new URL(url, 'https://example.test'), options})
          return transport(url, options)
        }
      }
    }
  }, {filename})
  return {api: exported.exports, requests}
}

test('suggestions carry optional normalized country, session and abort signal', async () => {
  const {api, requests} = service()
  const controller = new AbortController()
  await api.suggestAddresses('12 street', 'session-one', controller.signal, 'au')
  const request = requests[0]
  assert.equal(request.url.pathname, '/api/v1/geo/address/suggest/')
  assert.equal(request.url.searchParams.get('country_code'), 'AU')
  assert.equal(request.url.searchParams.get('q'), '12 street')
  assert.equal(request.url.searchParams.get('session'), 'session-one')
  assert.equal(request.options.signal, controller.signal)
})

test('place resolution uses the same country context', async () => {
  const {api, requests} = service()
  const controller = new AbortController()
  await api.resolveAddress('place-one', 'session-two', controller.signal, 'gb')
  assert.equal(requests[0].url.searchParams.get('country_code'), 'GB')
  assert.equal(requests[0].url.searchParams.get('place_id'), 'place-one')
  assert.equal(requests[0].url.searchParams.get('session'), 'session-two')
  assert.equal(requests[0].options.signal, controller.signal)
})

test('reverse geocoding carries coordinates and country', async () => {
  const {api, requests} = service()
  await api.reverseGeocode(-33.8, 151.2, 'au')
  assert.equal(requests[0].url.searchParams.get('lat'), '-33.8')
  assert.equal(requests[0].url.searchParams.get('lng'), '151.2')
  assert.equal(requests[0].url.searchParams.get('country_code'), 'AU')
})

test('existing callers retain requests without a country override', async () => {
  const {api, requests} = service()
  await api.suggestAddresses('12 street')
  await api.resolveAddress('place-one')
  await api.reverseGeocode(-36.8, 174.7)
  assert.equal(requests.length, 3)
  assert.ok(requests.every(request => !request.url.searchParams.has('country_code')))
})

test('changing country does not reset the workspace usage-cap latch', async () => {
  const {api, requests} = service(async () => {
    throw Object.assign(new Error('Usage cap reached'), {
      status: 402, validationErrors: {code: 'usage_cap_reached'}
    })
  })
  assert.equal((await api.suggestAddresses('12 street', undefined, undefined, 'AU')).length, 0)
  assert.equal((await api.suggestAddresses('12 street', undefined, undefined, 'NZ')).length, 0)
  assert.equal(requests.length, 1)
})
