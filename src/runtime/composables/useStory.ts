import { ComputedRef, Ref } from 'vue'
import { isNullOrUndefined, isObject } from '@blokwise/utils'
import type { StoryData, AlternateObject } from 'storyblok-js-client'
import type { Languages } from './useLanguages'
import type { StoryRoute } from './useRoute'
import { useRoute } from './useRoute'

export interface Story {
  alternates: ComputedRef<StoryRoute[]>
  route: StoryRoute
  content: any
  created_at: string
  full_slug: string
  group_id: string
  id: number
  is_startpage: boolean
  meta_data: any
  name: string
  parent_id: number
  position: number
  published_at: string | null
  first_published_at: string | null
  slug: string
  lang: string
  translated_slugs?: {
    path: string
    name: string | null
    lang: StoryData['lang']
  }[]
  /** only present with translated_slugs */
  default_full_slug?: string
  sort_by_date: string | null
  tag_list: string[]
  uuid: string
}

export const useStory = (
  storyData: StoryData,
  {
    languages,
    isModeFieldLevel = false
  }: {
    languages: Languages,
    isModeFieldLevel: boolean
  }
): Story => {
  // check for existence of languages
  if (
    isNullOrUndefined(storyData.uuid) &&
    isNullOrUndefined(storyData.id) &&
    isNullOrUndefined(storyData.full_slug)
  ) {
    throw new TypeError(
      'one identifier must be provided. either uuid, id or full_slug'
    )
  }
  if (isNullOrUndefined(languages)) {
    throw new TypeError('languages not passed as parameter')
  }

  const storyRoute = useRoute({
    path: storyData.full_slug,
    uuid: storyData.uuid,
    id: storyData.id,
    languages,
    isModeFieldLevel
  })

  const alternates: ComputedRef<StoryRoute[]> = computed(() => {
    const translatedSlugs = storyData.translated_slugs ?? []

    const alternates = translatedSlugs
      ?.filter(
        translatedSlug =>
          translatedSlug.lang !== storyRoute.language.code.value
      )
      .map(translatedSlug =>
        ({
          ...useRoute({
            path: `${translatedSlug.lang}/${translatedSlug.path}`,
            languages,
            isModeFieldLevel
          })
        } ?? null)
      )
      .filter(a => a)

    // translated_slugs only contains non-default language slugs
    // add default language route as alternate if story is non-default language
    if (storyRoute?.language.isDefault.value === false && storyData.default_full_slug) {
      alternates.push(
        useRoute({
          path: storyData.default_full_slug,
          languages,
          isModeFieldLevel
        })
      )
    }

    return alternates
  })

  const story = {
    ...storyData,
    alternates,
    content: (() => {
      const stringifiedContent = JSON.stringify(storyData.content)
      return JSON.parse(
        stringifiedContent,
        _getRouteReplacer(languages, isModeFieldLevel)
      )
    })(),
    route: storyRoute
  }

  return story
}

/**
 * get a replacer to parse a JSON and add Route instances to multilinks fieldtypes
 * @param {Languages} languages Languages instance for available languages.
 * @param {Boolean} isModeFieldLevel boolean to flag if its mode field level or tree level translation.
 *
 * @returns {Function} replacer function
 */
const _getRouteReplacer = (
  languages,
  isModeFieldLevel
) => {
  /**
   * replace value
   * @param {String} key object representing the key.
   * @param {object} value object representing the value.
   *
   * @returns {object} replaced value
   */
  return (key, value) => {
    // execute mapper function per field if it is found somewhere in the json object
    // for link fields
    if (
      key &&
      isObject(value) &&
      value.fieldtype === 'multilink' &&
      value.linktype === 'story'
    ) {
      value.route = useRoute({
        path: value.story?.full_slug ?? value.cached_url,
        languages,
        isModeFieldLevel
      })
      return value
    }
    // for resolved stories
    if (key && isObject(value) && 'alternates' in value && 'uuid' in value) {
      value.route = useRoute({
        path: value.full_slug,
        id: value.id,
        uuid: value.uuid,
        languages,
        isModeFieldLevel
      })
      return value
    }

    return value
  }
}
