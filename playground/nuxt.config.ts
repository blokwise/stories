import { defineNuxtConfig } from 'nuxt'
import BlokwiseStories from '..'

export default defineNuxtConfig({
  typescript: {
    shim: false
  },

  modules: [
    BlokwiseStories
  ],

  blokwisestories: {
    withConsole: true
  }
})
