import { ComputedRef } from 'vue'
import { useLanguage } from './useLanguage'
import type { LanguageOptions, Language } from './useLanguage'
import { computed } from '#imports'

export interface LanguagesOptions {
  languages: LanguageOptions[]
}

export interface Languages {
  /**
   * returns all the languages of the instance.
   */
  items: ComputedRef<Language[]>
  /**
   * returns the default language from the languages of the instance.
   */
  default: ComputedRef<Language>
  /**
   * returns the fallback language from the languages of the instance.
   */
  fallback: ComputedRef<Language>
  /**
   * returns a language from the languages of the instance.
   *
   * @param language the language, as string
   * @returns the language
   *
   * @example Correct usage.
   * ```ts
   * findByString('en');
   * ```
   */
  findByString: (language: string) => Language
  /**
   * returns a language from the languages of the instance.
   *
   * @param language the language, as object
   * @returns the language
   *
   * @example Correct usage.
   * ```ts
   * findByObject({ code: 'en' });
   * ```
   */
  findByObject: (language: Language | any) => Language
  /**
   * returns a language from the languages of the instance.
   *
   * @param language the language, as string or object
   * @returns the language
   *
   * @example Correct usage with string provided.
   * ```ts
   * find('en');
   * ```
   *
   * @example Correct usage with object provided.
   * ```ts
   * find({ code: 'en' });
   * ```
   */
  find: (language: Language | string) => Language
  /**
   * returns true or false if a language exists in the languages of the instance.
   *
   * @param language the language, as String or object
   * @returns the language
   *
   * @example Correct usage with string provided.
   * ```ts
   * isValid('en');
   * ```
   *
   * @example Correct usage with object provided.
   * ```ts
   * isValid({ code: 'en' });
   * ```
   */
  isValid: (language: Language | string | any) => boolean
}

/**
 * representation of all available story languages.
 *
 * @param options.languages array of language options to initialize languages
 * */
export const useLanguages = ({
  languages
}: LanguagesOptions): Languages => {
  const items = computed(() => languages.map(options => useLanguage(options)))

  const findByString = (language: string) => {
    return (
      items.value.find(l => l.code.value === language || l.iso.value === language) ?? null
    )
  }

  const findByObject = (language: Language | any) => {
    language = ((language?.code?.value ?? language?.code) || (language?.iso?.value ?? language?.iso))
    return (
      items.value.find(l => l.code.value === language || l.iso.value === language) ?? null
    )
  }

  const find = (language: Language | string | any) => {
    return findByObject(language) ?? findByString(language)
  }

  const isValid = (language: Language | string | any) => {
    language = ((language?.code?.value ?? language?.code) || (language?.iso?.value ?? language?.iso)) ?? language
    return items.value.some(l => l.code.value === language || l.iso.value === language)
  }

  const getDefault = () => {
    return items.value.find(l => !!l.isDefault.value)
  }

  const getFallback = () => {
    return items.value.find(l => !!l.isFallback.value)
  }

  return {
    items,
    default: computed(() => getDefault()),
    fallback: computed(() => getFallback()),
    findByString,
    findByObject,
    find,
    isValid
  }
}
