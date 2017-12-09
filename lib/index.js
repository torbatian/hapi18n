const i18n = require('i18n')
const Joi = require('joi')

const internals = {}

internals.param = (internali18n, request, options) => {
  if (request.params[options.detect.param] && options.i18n.locales.includes(request.params[options.detect.param])) {
    internali18n.setLocale(request.params[options.detect.param])
  }
}

internals.query = (internali18n, request, options) => {
  if (request.query[options.detect.query] && options.i18n.locales.includes(request.query[options.detect.query])) {
    internali18n.setLocale(request.query[options.detect.query])
  }
}

internals.header = (internali18n, request, options) => {
  if (request.headers[options.detect.header] && options.i18n.locales.includes(request.headers[options.detect.header])) {
    internali18n.setLocale(request.headers[options.detect.header])
  }
}

internals.schema = Joi.object().keys({
  detect: Joi.object().keys({
    order: Joi.array().min(1).max(3).items(Joi.string().tags(['param', 'query', 'header'])).unique().default(['param', 'query', 'header']),
    param: Joi.string().default('i18nlocale'),
    query: Joi.string().default('i18nlocale'),
    header: Joi.string().default('accept-language')
  }).default({
    order: ['param', 'query', 'header'],
    param: 'i18nlocale',
    query: 'i18nlocale',
    header: 'accept-language'
  }),
  i18n: Joi.object().default({
    locales: ['en'],
    defaultLocale: 'en'
  })
})

exports.plugin = {
  once: true,
  pkg: require('../package.json'),

  register: (server, options) => {
    const optionsValidation = Joi.validate(options, internals.schema)
    if (optionsValidation.error) {
      throw Error('hapi18n options error.')
    }

    options = optionsValidation.value

    i18n.configure(options.i18n)

    server.decorate('request', 'i18n', {})
    server.ext({
      type: 'onPreAuth',
      method: (request, h) => {
        let internali18n = {}

        i18n.init(request, internali18n)
        internali18n.setLocale(options.i18n.defaultLocale || options.i18n.locales[0])

        options.detect.order.forEach(detect => {
          internals[detect](internali18n, request, options)
        })

        request.i18n = internali18n

        return h.continue
      }
    })
  }
}
