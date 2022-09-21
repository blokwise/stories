import { Ref } from 'vue'
import { isNullOrUndefined } from '@blokwise/utils'

export interface LanguageOptions {
  code: string
  iso?: string
  isDefault?: boolean
  isFallback?: boolean
}

export interface Language {
  code: Ref<string>
  iso?: Ref<string>
  isDefault: Ref<boolean>
  isFallback: Ref<boolean>
}

/**
 * representation of a story language
 *
 * @param options.code language code (e.g. en)
 * @param options.iso iso code of language (e.g. en-US)
 * @param options.isDefault is the language defined as default language?
 * @param options.isFallback is the language the fallback language?
 * */
export const useLanguage = ({
  code = null,
  iso = null,
  isDefault = false,
  isFallback = false
}: LanguageOptions): Language => {
  if (isNullOrUndefined(code)) {
    throw new TypeError('code must be passed as parameter')
  }

  return {
    code: ref(code),
    iso: ref(iso),
    isDefault: ref(isDefault),
    isFallback: ref(isFallback)
  }
}
