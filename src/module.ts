import { resolve } from 'path'
import { fileURLToPath } from 'url'
import consola from 'consola'
import { defineNuxtModule, installModule } from '@nuxt/kit'
import { name, version } from '../package.json'

export interface ModuleOptions {
  withConsole: boolean,
  prefix: string
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: 'blokwisestories'
  },
  defaults: {
    withConsole: false,
    prefix: 'nuxt'
  },

  async setup (options, nuxt) {
    const logger = consola.withScope('@blokwise/stories')

    await installModule('@pinia/nuxt', {
      autoImports: [
        // automatically imports `defineStore`
        // import { defineStore } from 'pinia'
        'defineStore'
      ]
    })

    await installModule('@storyblok/nuxt', {
      accessToken: '1A2uqoctnfDhzG0ByKpuswtt',
      bridge: true,
      apiOptions: {}, // storyblok-js-client options
      useApiClient: true
    })

    // transpile runtime
    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
    nuxt.options.build.transpile.push(runtimeDir)

    // add blokwise stories components
    // nuxt.hook('components:dirs', (dirs) => {
    //   dirs.push({
    //     path: resolve(runtimeDir, 'components'),
    //     prefix: options.prefix
    //   })
    // })

    // add blokwise stories composables
    nuxt.hook('autoImports:dirs', (dirs) => {
      dirs.push(resolve(runtimeDir, 'composables'))
    })

    // add blokwise stories stores
    nuxt.hook('autoImports:dirs', (dirs) => {
      dirs.push(resolve(runtimeDir, 'stores'))
    })

    if (options.withConsole) {
      logger.success({
        message: 'blokwise stories ready',
        additional: 'Module @blokwise/stories successfully registered.\nReady to fetch and stores storyblok stories.',
        badge: true
      })
    }
  }
})
