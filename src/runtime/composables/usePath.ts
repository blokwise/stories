import { ComputedRef } from 'vue'
import { isNullOrUndefined } from '@blokwise/utils'
import { useSlug } from './useSlug'
import type { Languages } from './useLanguages'
import type { Language } from './useLanguage'
import type { Slug } from './useSlug'
import { computed } from '#imports'

export interface PathOptions {
  path: string
  languages: Languages
  language?: string | Language | any
}

export interface Path {
  path: ComputedRef<string>
  slug: Slug
  language: ComputedRef<Language>
}

/**
 * representation of a story path
 *
 * @param options.path path, as string
 * @param options.languages languages, as `Languages`
 * @param options.language optional language, as string or object
 * */
export const usePath = (options: PathOptions): Path => {
  // check for existence of path and languages
  if (isNullOrUndefined(options.path)) {
    throw new TypeError('path not passed as parameter')
  }
  if (isNullOrUndefined(options.languages)) {
    throw new TypeError('languages not passed as parameter')
  }

  const { languages } = options
  const path = computed(() => options.path)

  const language: ComputedRef<Language> = computed(() => {
    // find language
    if (options.language) {
      // by prop
      return languages.find(options.language)
    } else {
      // by path
      const code = path.value
        .split('/')
        .map(s => s.trim())
        .filter(s => !!s)
        .find(s => languages.isValid(s))
      return (
        code ? useLanguage({ code }) : languages.default.value
      )
    }
  })

  const slug = useSlug({ slug: path.value, languages, language: language.value })

  // add language to slugs if there is not yet
  if (!slug.fragments.value.some(s => s.isLanguage)) {
    slug.fragments.value.unshift({
      path: language.value?.code.value,
      isLanguage: true,
      language: language.value
    })
  }

  return {
    path,
    slug,
    language
  }
}
