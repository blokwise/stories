import { isNullOrUndefined, slugify } from '@blokwise/utils'
import { ComputedRef } from 'vue'
import type { Language } from './useLanguage'
import type { Languages } from './useLanguages'
import { usePath } from './usePath'
import { computed } from '#imports'

export interface NuxtRoute {
  to: string;
  alias: string;
  routeName: string;
}

export interface StoryRoute {
  id: number;
  uuid: string;
  to: string;
  routeName: string;
  alias?: string[];
  language: Language;
  api: ComputedRef<{
    single: { default: object };
    list: { default: object; wildcardDisabled: object };
  }>;
}

export interface RouteOptions {
  path: string;
  languages: Languages;
  uuid?: string;
  id?: number;
  route?: any;
  language?: string | object;
  isModeFieldLevel?: boolean;
}

export const useRoute = ({
  path,
  languages,
  uuid = null,
  id = null,
  route = null,
  language = null,
  isModeFieldLevel = false
}: RouteOptions): StoryRoute => {
  // check for existence of path and languages
  if (isNullOrUndefined(path)) {
    throw new TypeError('path not passed as parameter')
  }
  if (isNullOrUndefined(languages)) {
    throw new TypeError('languages not passed as parameter')
  }

  const options = computed(() => ({
    path,
    route,
    isModeFieldLevel
  }))

  // create Path for the Route
  const storyPath = usePath({
    path: options.value.route?.route ?? options.value.path,
    languages,
    language
  })

  /**
   * transforms the payload of the instance to a nuxt link path.
   * nuxt route object with `nuxtLink`, `alias` and `routeName`
   */
  const nuxtRoute = computed(() => {
    const nuxtLink = (
      storyPath.language.value.isDefault.value
        ? storyPath.slug.create().withoutFragment('index').withoutLanguage().addLeadingSlash().toString()
        : storyPath.slug.create().withoutFragment('index').withLanguage().addLeadingSlash().toString()
    ).replace('::', '?')

    const alias = storyPath.slug
      .create()
      .withoutFragment('index')
      .withLanguage()
      .addLeadingSlash()
      .toString()
    const pathWithoutLanguage = storyPath.slug.create().withoutFragment('index').withoutLanguage().toString()

    const routeName = `${slugify(
      (pathWithoutLanguage !== '' ? pathWithoutLanguage : 'index')
        .replace('::', '-o-')
        .replace(':', '-p-')
        .replace(/\//g, ' ')
    )}___${storyPath.language.value.code.value}`

    // prepare the payload
    return {
      path: nuxtLink,
      alias: alias !== nuxtLink ? [alias] : null,
      routeName
    }
  })

  /**
   * api endpoint for single items
   * transforms the payload of the instance to an api endpoint path for the storyblok client.
   */
  const singleApiRoute = computed(() => {
    const isIndexStory = storyPath.slug.fragments.value.length < 2
    const needsIndexSlug = isIndexStory && options.value.isModeFieldLevel
    return {
      default: {
        path: storyPath.slug
          .create()
          .withLanguage({ defaultAsCode: !options.value.isModeFieldLevel })
          .withFragment(needsIndexSlug ? 'index' : null)
          .toString(),
        uuid,
        id,
        language: uuid || id ? storyPath.language.value.code : null
      }
    }
  })

  /**
   * api endpoint for list items
   * transforms the payload of the instance to an api endpoint path for the storyblok client.
   * list api endpoint configuration
   */
  const listApiRoute = computed(() => {
    return {
      default: {
        starts_with: storyPath.slug
          .create()
          .withLanguage({ defaultAsCode: !options.value.isModeFieldLevel })
          .withFragment(options.value.isModeFieldLevel ? '*' : '')
          .toString()
      },
      wildcardDisabled: {
        starts_with: storyPath.slug
          .create()
          .withLanguage({ defaultAsCode: !options.value.isModeFieldLevel })
          .toString()
      }
    }
  })

  const apiRoute = computed(() => ({
    single: singleApiRoute.value,
    list: listApiRoute.value
  }))

  const storyRoute = {
    id,
    uuid,
    to: nuxtRoute.value?.path,
    routeName: nuxtRoute.value?.routeName,
    alias: nuxtRoute.value?.alias,
    language: storyPath?.language.value,
    api: apiRoute
  }

  // console.log(storyPath.slug.create().withoutFragment('index').withoutLanguage().addLeadingSlash().toString())
  // console.table([storyRoute, nuxtRoute, apiRoute])

  return storyRoute
}
