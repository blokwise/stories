/* eslint-disable camelcase */
import { ComputedRef } from 'vue'
import type { StoryData } from 'storyblok-js-client'
import consola from 'consola'
import { isNullOrUndefined, isArray } from '@blokwise/utils'
import { useLanguages } from './useLanguages'
import { useStory } from './useStory'
import { useRoute } from './useRoute'
import type { StoryRoute } from './useRoute'
import type { LanguageOptions, Language } from './useLanguage'
import { ref, useStoryblokApi } from '#imports'

export interface StoryApi {
  /**
   * calls the owned space for options / configurations.
   *
   * @returns {object} Response with space data
   */
  me: Function
  /**
   * initializes cache version.
   */
  initCacheVersion: Function

  page: Function
  list: Function
  dimension: Function

  getStory: Function
  getSettings: Function
  getStories: Function
  getDimensions: Function
}

export const useStoryApi = ({
  // accessToken,
  languages,
  version = 'published',
  cacheProvider = 'memory',
  cacheVersion = false,
  isEditorMode,
  isModeFieldLevel = false
}: {
  accessToken: string,
  languages: LanguageOptions[],
  version: 'draft' | 'published' | 'auto'
  cacheProvider: 'memory'
  cacheVersion: boolean
  isEditorMode: ComputedRef<boolean>
  isModeFieldLevel: boolean
}): StoryApi => {
  // check for existence of accessToken and languages
  // if (isNullOrUndefined(accessToken)) {
  //   throw new TypeError('accessToken not passed as parameter')
  // }
  if (isNullOrUndefined(languages)) {
    throw new TypeError('languages not passed as parameter')
  }
  if (!isArray(languages)) {
    throw new TypeError('languages not passed as Array')
  }

  const _languages = useLanguages({ languages })
  const _cacheVersion = ref(cacheVersion)

  const _logger = consola.withScope('@blokwise/storyblok-api')

  const _client = useStoryblokApi()

  // const _client = new StoryblokClient({
  //   accessToken,
  //   cache: {
  //     clear: 'auto',
  //     type: cacheProvider
  //   }
  // })

  /**
   * gets the current version.
   * when set to auto it detects mode in localstorage if available.
   *
   * @returns {String} the cache version for requests. can be `published`, `preview`, `draft`
   */
  const _getVersion = () => {
    if (version !== 'auto') {
      return version
    }

    let mode = 'published'

    if (
      isEditorMode.value ||
      (typeof window !== 'undefined' &&
        window.localStorage.getItem('_storyblok_draft_mode'))
    ) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('_storyblok_draft_mode', '1')
        if (window.location === window.parent.location) {
          window.localStorage.removeItem('_storyblok_draft_mode')
        }
      }
      mode = 'draft'
    }

    return mode
  }

  const _list = async (
    query,
    {
      returnAsStoryInstance = true,
      returnResponseData = false,
      debug = false
    } = {}
  ) => {
    const path = query?.path
    if (path) {
      query = {
        ...query,
        starts_with: path
      }
      delete query.path
    }

    return await _request({
      query,
      options: {
        returnAsStoryInstance,
        returnResponseData,
        debug
      }
    })
  }

  const _get = async (
    query,
    {
      returnAsStoryInstance = true,
      returnResponseData = false,
      debug = false
    } = {}
  ) => {
    return await _request({
      query,
      options: {
        returnAsStoryInstance,
        returnResponseData,
        debug
      }
    })
  }

  const _request = async ({ query, options }) => {
    const defaultQuery = {
      // datatype: 'stories',
      path: null,
      id: null,
      uuid: null,
      starts_with: null,
      is_startpage: null,
      // datasource: '',
      version: _getVersion(),
      cv: _cacheVersion.value,
      // resolve_relations: null,
      filter_query: null,
      sort_by: null,
      by_uuids: null,
      per_page: 100,
      page: null,
      resolve_links: 'url',
      meta: {}
    }

    const datatype = 'stories'

    query = {
      ...defaultQuery,
      ...query
    }

    const { path, id, uuid, meta } = query
    if (path) {
      delete query.path
      delete query.meta
    }

    // exclude amp from path if exists
    // path = path.replace(/^(\D{2}\/)?amp\//, '$1')

    // // cut off amp/ from slug if it starts with
    // if (path.startsWith('amp/')) {
    //   path = path.replace(/^amp\//, '')
    // }

    const apiEndPoint =
      id || uuid || path
        ? `${datatype}/${id || uuid || path}`
        : datatype

    let res

    if (options.debug) {
      _logger.log({
        apiEndPoint,
        query,
        options
      })
    }

    try {
      res = await _client.get(`cdn/${apiEndPoint}`, query)

      _logger.log({ res })

      if (options.debug) {
        _logger.log({ res })
      }

      if (!options.returnAsStoryInstance) {
        return options.returnResponseData
          ? res
          : res?.data?.stories ?? res?.data?.story
      }

      if (res?.data?.stories) {
        res.data.stories = res.data.stories.map(story =>
          _createStoryInstance(_addMeta(story, meta))
        )
        return options.returnResponseData ? res : res.data.stories
      } else if (res?.data?.story) {
        res.data.story = _createStoryInstance(
          _addMeta(res.data.story, meta)
        )
        return options.returnResponseData ? res : res.data.story
      }
    } catch (e) {
      // _logger.error(res)
      // _logger.error(e)
    }
    throw new Error('resource is not available')
  }

  const _createStoryInstance = (story) => {
    return useStory(story, {
      languages: _languages,
      isModeFieldLevel
    })
  }

  const _addMeta = (story, meta) => {
    return {
      ...story,
      ...meta
    }
  }

  // exported methods
  const me = async () => {
    return await _request({
      query: { datatype: 'spaces', path: 'me' },
      options: {
        returnAsStoryInstance: false,
        returnResponseData: true
      }
    })
  }

  const initCacheVersion = async () => {
    // making cacheversion really work needs some improvement
    // renew cacheversion on $storybridge.on(['input', 'published', 'change'] to make it work
    const { data: spaceData } = await me()
    _cacheVersion.value = spaceData.space.version
  }

  const find = async (query, options = {}) => {
    return await _get(query, options)
  }

  const page = async (
    query: object,
    per_page: number = 100,
    page: number = 0,
    options: object = {}
  ) => {
    query = {
      ...query,
      per_page,
      page
    }

    const { data, total } = await _list(query, {
      ...options,
      returnResponseData: true
    })

    return {
      stories: data.stories,
      total
    }
  }

  const list = async (query: object, options: object = {}) => {
    const stories: StoryData[] = []
    const per_page: number = 100
    let total: number = 0
    let current: number = 0
    let run: boolean = true

    while (run) {
      current = current + 1
      const data = await page(query, per_page, current, options)
      stories.push(...data.stories)
      total = data.total
      run = total > 0 && total > current * per_page
    }

    return stories
  }

  const dimension = async (
    route: StoryRoute,
    options,
    isWildcardSearch = true,
    query
  ) => {
    // treelevel request start either with `en` or `de`
    // fieldlevel request start either with `en` or `[default]`
    const apiOptions = isWildcardSearch ? route.api.value.list.default : route.api.value.list.wildcardDisabled
    return await list({ ...apiOptions, ...query }, options)
  }

  const getStory = async ({
    slug,
    language,
    query = {}
  }: {
    slug: string,
    language: string | Language | object | undefined,
    query: object
  }) => {
    const route = useRoute({
      path: slug,
      language,
      languages: _languages,
      isModeFieldLevel
    })
    const apiOptions = route.api.value.single.default

    return await find({ ...apiOptions, ...query })
  }

  const getSettings = async ({
    language,
    slug = 'settings',
    query = {}
  }: {
    language?: string,
    slug: string,
    query: object
  }) => {
    const lang = _languages.find(language) || _languages.default

    return await getStory({ slug, language: lang, query })
  }

  const getStories = async ({
    slug,
    language,
    query = {}
  }: {
    slug: string,
    language?: string,
    query: object
  }) => {
    const route = useRoute({
      path: slug,
      language,
      languages: _languages,
      isModeFieldLevel
    })
    const apiOptions = route.api.value.list.default

    return await list({ ...apiOptions, ...query })
  }

  const getDimensions = async ({
    languages,
    slug = '/',
    isWildcardSearch = true,
    query = {}
  }: {
    languages?: string[],
    slug: string,
    isWildcardSearch?: boolean,
    query?: object
  }) => {
    if (!languages) {
      languages = _languages.items.value.map(language => language.code.value)
    }

    const dimensions = await Promise.all(
      languages.map(async (code) => {
        const route = useRoute({
          path: slug,
          language: code,
          languages: _languages,
          isModeFieldLevel
        })
        return await dimension(route, null, isWildcardSearch, query)
      })
    )

    return dimensions.flat()
  }

  return {
    me,
    initCacheVersion,
    page,
    list,
    dimension,
    getStory,
    getSettings,
    getStories,
    getDimensions
  }
}
