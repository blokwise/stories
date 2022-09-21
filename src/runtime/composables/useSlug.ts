import {
  addLeadingSlash as _addLeadingSlash,
  addTrailingSlash as _addTrailingSlash,
  removeLeadingSlash as _removeLeadingSlash,
  removeTrailingSlash as _removeTrailingSlash
} from '@blokwise/utils'
import { Ref, ComputedRef } from 'vue'
import type { Language } from './useLanguage'
import type { Languages } from './useLanguages'
import { ref } from '#imports'

export interface SlugFragment {
  path: string;
  isLanguage: boolean;
  language: Language;
}

export interface Slug {
  payload: Ref<string>;
  fragments: Ref<SlugFragment[]>;
  language: ComputedRef<Language>;
  /**
   * returns an array representation of the passed payload.
   *
   * @returns {Array<string>} payload as array
   */
   toSlugFragments: (payload: string) => SlugFragment[];
  /**
   * starts the build chain process to transform a slug.
   * returns the instance to chain things in a fluid API way.
   *
   * @returns {Slug} this Slug instance
   */
  create: () => Slug;
  /**
   * adds a leading slash to the url.
   * returns the instance to chain things in a fluid API way.
   *
   * @returns {Slug} this Slug instance
   */
  addLeadingSlash: () => Slug;
  /**
   * removes the leading slash from the url.
   * returns the instance to chain things in a fluid API way.
   *
   * @returns {Slug} this Path instance
   */
  removeLeadingSlash: () => Slug;
  /**
   * adds a trailing slash to the url.
   * returns the instance to chain things in a fluid API way.
   *
   * @returns {Slug} this Path instance
   */
  addTrailingSlash: () => Slug;
  /**
   * removes the trailing slash from the url.
   * returns the instance to chain things in a fluid API way.
   *
   * @returns {Slug} this Slug instance
   */
  removeTrailingSlash: () => Slug;
  /**
   * adds the language to the url.
   * returns the instance to chain things in a fluid API way.
   *
   * @returns {Slug} this Slug instance
   */
  withLanguage: ({ defaultAsCode }: { defaultAsCode: boolean }) => Slug;
  /**
   * removes the language from the url.
   * returns the instance to chain things in a fluid API way.
   *
   * @returns {Slug} this Slug instance
   */
  withoutLanguage: () => Slug;
  /**
   * adds a fragment to the payload.
   * returns the instance to chain things in a fluid API way.
   * @param {String} fragment the slug fragment to add
   *
   * @returns {Slug} this Slug instance
   */
  withFragment: (fragment: string) => Slug;
  /**
   * removes a fragment to the payload.
   * returns the instance to chain things in a fluid API way.
   * @param {String} fragment the slug fragment to add
   *
   * @returns {Slug} this Slug instance
   */
  withoutFragment: (fragment: string) => Slug;
  /**
   * creates the path from the payload.
   * returns the payload as path.
   *
   * @returns {String} path
   */
  toString: () => string;
}

/**
 * instance representing a slug.
 *
 * @param slug slug, as string.
 */
export const useSlug = ({
  slug,
  languages,
  language
}: {
  slug: string;
  languages: Languages;
  language?: Language;
}): Slug => {
  return (({
    slug,
    languages,
    language
  }: {
    slug: string;
    languages: Languages;
    language?: Language;
  }): Slug => {
    const toSlugFragments = function (payload: string): SlugFragment[] {
      return payload
        .split('/')
        .filter(s => s)
        .map(
          (path): { path: string; isLanguage: boolean; language: Language } => {
            return {
              path,
              isLanguage: languages.isValid(path),
              language: languages.find(path)
            }
          }
        )
    }

    // internal vars
    const payload: Ref<string> = ref('')
    const _fragments: SlugFragment[] = toSlugFragments(slug)
    const fragments: Ref<any[]> = ref(_fragments)

    const _language = computed((): Language => {
      // find language
      if (language) {
        // by prop
        return languages.find(language)
      } else {
        // by path
        return (
          fragments.value.find(fragment => fragment.isLanguage)?.language ??
          languages.default.value
        )
      }
    })

    // add language to slugs if there is not yet
    if (!fragments.value.some(s => s.isLanguage)) {
      fragments.value.unshift({
        path: _language.value.code.value,
        isLanguage: true,
        language: _language.value
      })
    }

    // methods
    const create = function (): Slug {
      payload.value = fragments.value.map(p => p.path.trim()).join('/')
      return this
    }

    const addLeadingSlash = function (): Slug {
      payload.value = _addLeadingSlash(payload.value)
      return this
    }

    const removeLeadingSlash = function (): Slug {
      payload.value = _removeLeadingSlash(payload.value)
      return this
    }

    const addTrailingSlash = function (): Slug {
      payload.value = _addTrailingSlash(payload.value)
      return this
    }

    const removeTrailingSlash = function (): Slug {
      payload.value = _removeTrailingSlash(payload.value)
      return this
    }

    const withLanguage = function ({ defaultAsCode = true } = {}): Slug {
      payload.value = toSlugFragments(payload.value)
        .map((fragment) => {
          if (
            fragment.isLanguage &&
            !defaultAsCode &&
            fragment.language.isDefault
          ) {
            fragment.path = '[default]'
          }
          return fragment.path
        })
        .join('/')
      return this
    }

    const withoutLanguage = function (): Slug {
      payload.value = toSlugFragments(payload.value)
        .filter(fragment => !fragment.isLanguage)
        .map(p => p.path)
        .join('/')
      return this
    }

    const withFragment = function (fragment: string): Slug {
      payload.value = (() => {
        const _payload = toSlugFragments(payload.value)
        _payload.push({
          path: fragment,
          isLanguage: languages.isValid(fragment),
          language: languages.find(fragment)
        })
        return _payload
          .map(fragment => fragment.path)
          .filter(s => s !== null)
          .join('/')
      })()
      return this
    }

    const withoutFragment = function (fragment: string): Slug {
      payload.value = (() => {
        const _payload = toSlugFragments(payload.value)
        return _payload
          .filter(f => f.path !== fragment)
          .map(fragment => fragment.path)
          .filter(s => s !== null)
          .join('/')
      })()
      return this
    }

    const toString = function (): string {
      payload.value = payload.value
        .split('/')
        .map(p => p.trim())
        .join('/')
      return payload.value
    }

    return {
      payload,
      fragments,
      language: _language,
      toSlugFragments,
      create,
      addLeadingSlash,
      removeLeadingSlash,
      addTrailingSlash,
      removeTrailingSlash,
      withLanguage,
      withoutLanguage,
      withFragment,
      withoutFragment,
      toString
    }
  })({
    slug,
    languages,
    language
  })
}
